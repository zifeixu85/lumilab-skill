#!/usr/bin/env bun
/**
 * Secrets store with platform keychain backend + plaintext fallback.
 *
 * Backends (auto-detected):
 *   - macOS: `security` (login.keychain), service="lumilab", account=<key>
 *   - Linux: `secret-tool` (libsecret), label="lumilab/<key>"
 *   - Fallback: ~/.lumilab/secrets.json (chmod 600)
 *
 * API (CLI):
 *   keychain.ts get <key>
 *   keychain.ts set <key> <value>     # value via stdin if not provided
 *   keychain.ts list
 *   keychain.ts del <key>
 *   keychain.ts migrate-plaintext     # move ~/.lumilab/secrets.json → keychain, keep file but mark migrated
 *   keychain.ts which                 # print which backend is active
 *
 * Programmatic:
 *   import { getSecret, setSecret, listSecrets, deleteSecret, backend } from './keychain.ts';
 */
import { spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';

const SERVICE = 'lumilab';
const HOME = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');
const FALLBACK_PATH = join(HOME, 'secrets.json');

export type Backend = 'macos-keychain' | 'linux-secret-tool' | 'plaintext';

function has(cmd: string): boolean {
  return spawnSync('which', [cmd], { stdio: 'pipe' }).status === 0;
}

export function backend(): Backend {
  if (platform() === 'darwin' && has('security')) return 'macos-keychain';
  if (platform() === 'linux' && has('secret-tool')) return 'linux-secret-tool';
  return 'plaintext';
}

function readPlaintext(): Record<string, string> {
  if (!existsSync(FALLBACK_PATH)) return {};
  try { return JSON.parse(readFileSync(FALLBACK_PATH, 'utf-8')); } catch { return {}; }
}
function writePlaintext(obj: Record<string, string>) {
  writeFileSync(FALLBACK_PATH, JSON.stringify(obj, null, 2));
  try { chmodSync(FALLBACK_PATH, 0o600); } catch {}
}

export function getSecret(key: string): string | undefined {
  const b = backend();
  if (b === 'macos-keychain') {
    const r = spawnSync('security', ['find-generic-password', '-s', SERVICE, '-a', key, '-w'], { stdio: ['ignore', 'pipe', 'pipe'] });
    if (r.status === 0) return r.stdout.toString().trim();
    return undefined;
  }
  if (b === 'linux-secret-tool') {
    const r = spawnSync('secret-tool', ['lookup', 'service', SERVICE, 'account', key], { stdio: ['ignore', 'pipe', 'pipe'] });
    if (r.status === 0) return r.stdout.toString().trim();
    return undefined;
  }
  const obj = readPlaintext();
  return obj[key];
}

export function setSecret(key: string, value: string): void {
  const b = backend();
  if (b === 'macos-keychain') {
    spawnSync('security', ['delete-generic-password', '-s', SERVICE, '-a', key], { stdio: 'ignore' });
    const r = spawnSync('security', ['add-generic-password', '-s', SERVICE, '-a', key, '-w', value, '-U'], { stdio: 'pipe' });
    if (r.status !== 0) throw new Error(`keychain set failed: ${r.stderr?.toString()}`);
    return;
  }
  if (b === 'linux-secret-tool') {
    const r = spawnSync('secret-tool', ['store', '--label=' + `${SERVICE}/${key}`, 'service', SERVICE, 'account', key], { input: value, stdio: ['pipe', 'pipe', 'pipe'] });
    if (r.status !== 0) throw new Error(`secret-tool set failed: ${r.stderr?.toString()}`);
    return;
  }
  const obj = readPlaintext();
  obj[key] = value;
  writePlaintext(obj);
}

export function deleteSecret(key: string): void {
  const b = backend();
  if (b === 'macos-keychain') { spawnSync('security', ['delete-generic-password', '-s', SERVICE, '-a', key], { stdio: 'ignore' }); return; }
  if (b === 'linux-secret-tool') { spawnSync('secret-tool', ['clear', 'service', SERVICE, 'account', key], { stdio: 'ignore' }); return; }
  const obj = readPlaintext();
  delete obj[key];
  writePlaintext(obj);
}

export function listSecrets(): string[] {
  // For macOS / Linux backends we can't enumerate by service portably; we track keys in a sidecar index.
  const indexPath = join(HOME, 'secrets.index.json');
  if (existsSync(indexPath)) {
    try { return JSON.parse(readFileSync(indexPath, 'utf-8')) as string[]; } catch {}
  }
  return Object.keys(readPlaintext());
}

export function indexAdd(key: string): void {
  const indexPath = join(HOME, 'secrets.index.json');
  const list = listSecrets();
  if (!list.includes(key)) list.push(key);
  writeFileSync(indexPath, JSON.stringify(list, null, 2));
}

export function migratePlaintext(): { migrated: string[]; backend: Backend; from: string } {
  const b = backend();
  const before = readPlaintext();
  const migrated: string[] = [];
  if (b === 'plaintext') return { migrated, backend: b, from: FALLBACK_PATH };
  for (const [k, v] of Object.entries(before)) {
    if (typeof v === 'string' && v) {
      setSecret(k, v);
      indexAdd(k);
      migrated.push(k);
    }
  }
  // Keep plaintext file but rename so we don't keep secrets around in flat-text
  if (migrated.length) {
    try {
      const archivePath = FALLBACK_PATH + '.migrated-' + new Date().toISOString().replace(/[:.]/g, '-');
      writeFileSync(archivePath, JSON.stringify(before, null, 2));
      try { chmodSync(archivePath, 0o600); } catch {}
      writeFileSync(FALLBACK_PATH, JSON.stringify({ _migrated_to: b, _at: new Date().toISOString() }, null, 2));
    } catch {}
  }
  return { migrated, backend: b, from: FALLBACK_PATH };
}

async function main() {
  const [, , cmd, key, ...rest] = process.argv;
  switch (cmd) {
    case 'which':
      console.log(backend());
      break;
    case 'get': {
      if (!key) { console.error('usage: keychain.ts get <key>'); process.exit(2); }
      const v = getSecret(key);
      if (v === undefined) { process.exit(1); }
      console.log(v);
      break;
    }
    case 'set': {
      if (!key) { console.error('usage: keychain.ts set <key> [value | - for stdin]'); process.exit(2); }
      let value = rest.join(' ');
      if (!value || value === '-') value = await Bun.stdin.text().then(s => s.trim());
      setSecret(key, value);
      indexAdd(key);
      console.log(`✓ stored ${key} in ${backend()}`);
      break;
    }
    case 'del':
      if (!key) { console.error('usage: keychain.ts del <key>'); process.exit(2); }
      deleteSecret(key);
      console.log(`✓ deleted ${key}`);
      break;
    case 'list':
      for (const k of listSecrets()) console.log(k);
      break;
    case 'migrate-plaintext': {
      const r = migratePlaintext();
      console.log(`✓ migrated ${r.migrated.length} keys to ${r.backend}: ${r.migrated.join(', ') || '(none)'}`);
      break;
    }
    default:
      console.error('Lumi Lab keychain — get | set | del | list | which | migrate-plaintext');
      process.exit(2);
  }
}

if (import.meta.main) main().catch(e => { console.error(e); process.exit(1); });
