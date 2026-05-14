/**
 * deploy.ts — /lumilab deploy <venture> command.
 *
 * 1. Read studio dir
 * 2. Ask user for password (or use default from config)
 * 3. Encrypt + generate password gate HTML
 * 4. wrangler pages deploy
 * 5. Generate QR code
 * 6. Update ~/.lumilab/shares.json
 *
 * Usage:
 *   bun run deploy.ts <venture-name> [--public]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { spawnSync, spawn } from 'child_process';
import { homedir } from 'os';

const LUMILAB_HOME = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');
// venture 数据永远在 ~/.lumilab/data/，跟 cwd / 谁调用无关。
const DATA_ROOT = join(LUMILAB_HOME, 'data');

interface DeployOptions {
  venture: string;
  password?: string;
  public?: boolean;
}

interface ShareRecord {
  venture: string;
  url: string;
  password_ref: string;
  visibility: 'public' | 'private';
  deployed_at: string;
  last_redeployed: string;
  status: 'active' | 'archived';
  cloudflare_project_name: string;
}

function loadConfig() {
  const configPath = join(LUMILAB_HOME, 'config.json');
  if (!existsSync(configPath)) {
    console.error(`Config not found: ${configPath}`);
    console.error(`Please run: /lumilab config`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(configPath, 'utf-8'));
}

function loadShares(): { shares: ShareRecord[] } {
  const sharesPath = join(LUMILAB_HOME, 'shares.json');
  if (!existsSync(sharesPath)) {
    return { shares: [] };
  }
  return JSON.parse(readFileSync(sharesPath, 'utf-8'));
}

function saveShares(data: { shares: ShareRecord[] }) {
  const sharesPath = join(LUMILAB_HOME, 'shares.json');
  writeFileSync(sharesPath, JSON.stringify(data, null, 2));
}

function getCloudflareToken(): string {
  // 优先走 keychain.ts（macOS Keychain / Linux secret-tool）；
  // 仅当 keychain 后端不可用时回退到 ~/.lumilab/secrets.json（chmod 600）。
  const keychainScript = join(import.meta.dir, '..', '..', 'lumilab-config', 'scripts', 'keychain.ts');
  if (existsSync(keychainScript)) {
    for (const key of ['CLOUDFLARE_API_TOKEN', 'cloudflare_api_token']) {
      const r = spawnSync('bun', ['run', keychainScript, 'get', key], { stdio: ['ignore', 'pipe', 'ignore'] });
      if (r.status === 0) {
        const v = r.stdout.toString().trim();
        if (v) return v;
      }
    }
  }
  // env override
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  // fallback: plaintext secrets.json
  const secretsPath = join(LUMILAB_HOME, 'secrets.json');
  if (existsSync(secretsPath)) {
    try {
      const secrets = JSON.parse(readFileSync(secretsPath, 'utf-8'));
      const token = secrets.cloudflare_api_token || secrets.CLOUDFLARE_API_TOKEN;
      if (token) return token;
    } catch { /* fall through to error */ }
  }
  console.error('Cloudflare token 未配置。先跑 `lumilab config`，或 `lumilab secrets set CLOUDFLARE_API_TOKEN <token>`。');
  process.exit(1);
}

async function generateQrPng(url: string, outputPath: string) {
  // 用 qrencode CLI（macOS: brew install qrencode）；fallback 到在线 API
  const result = spawnSync('qrencode', ['-o', outputPath, '-s', '8', url]);
  if (result.status !== 0) {
    // fallback: 不生成 PNG，只写 SVG via Web Crypto API（P1）
    console.warn('  qrencode not installed. Skipping QR PNG generation.');
    console.warn('  Install: brew install qrencode (macOS) | apt install qrencode (Linux)');
    return false;
  }
  return true;
}

async function deploy(opts: DeployOptions) {
  const config = loadConfig();
  const ventureDir = join(DATA_ROOT, 'ventures', opts.venture);
  const studioDir = join(ventureDir, 'studio');

  if (!existsSync(studioDir)) {
    console.error(`Studio dir not found: ${studioDir}`);
    console.error(`Did you generate the venture first? Try /lumilab new "<idea>"`);
    process.exit(1);
  }

  console.log(`\n📦 Deploying venture: ${opts.venture}\n`);

  // Step 1: Determine password
  const isPublic = opts.public ?? false;
  let password: string | undefined;
  if (!isPublic) {
    password = opts.password ?? config.deploy?.default_password;
    if (!password) {
      console.error('No password provided. Set default_password in config or pass --password');
      process.exit(1);
    }
    console.log(`  🔑 Using password: ${password.replace(/./g, '•')} (${password.length} chars)`);
  } else {
    console.log(`  ⚠️  Public deployment (anyone with URL can view)`);
  }

  // Step 2: Encrypt + wrap (if private)
  const deployDir = join(ventureDir, 'deploy', 'encrypted-bundle');
  mkdirSync(deployDir, { recursive: true });

  if (!isPublic && password) {
    console.log('  🔒 Encrypting (AES-GCM + PBKDF2 1M iter)...');
    const encryptResult = spawnSync(
      'bun',
      ['run', join(__dirname, 'encrypt.ts'), studioDir, password, deployDir],
      { stdio: 'inherit' }
    );
    if (encryptResult.status !== 0) {
      console.error('Encryption failed');
      process.exit(1);
    }
  } else {
    // Public: just copy studio contents to deployDir
    spawnSync('cp', ['-r', `${studioDir}/.`, deployDir]);
  }

  // Step 3: wrangler deploy
  const projectName = `${opts.venture}-${process.env.USER ?? 'user'}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 58);
  console.log(`  ☁️  wrangler pages deploy → ${projectName}.pages.dev`);

  const cfToken = getCloudflareToken();
  const wranglerResult = spawnSync(
    'wrangler',
    ['pages', 'deploy', deployDir, '--project-name', projectName, '--commit-dirty=true'],
    {
      env: { ...process.env, CLOUDFLARE_API_TOKEN: cfToken },
      stdio: 'inherit',
    }
  );

  if (wranglerResult.status !== 0) {
    console.error('\n❌ Cloudflare deploy failed.');
    console.error('Check: 1) wrangler installed (npm i -g wrangler)');
    console.error('       2) Cloudflare token valid (run /lumilab config)');
    process.exit(1);
  }

  const url = `https://${projectName}.pages.dev`;
  console.log(`\n  ✅ Deployed: ${url}`);

  // Step 4: Generate QR
  const qrPath = join(ventureDir, 'qr.png');
  await generateQrPng(url, qrPath);

  // Step 5: Update shares.json
  const shares = loadShares();
  const now = new Date().toISOString();
  const existing = shares.shares.find(s => s.venture === opts.venture);
  if (existing) {
    existing.url = url;
    existing.last_redeployed = now;
    existing.visibility = isPublic ? 'public' : 'private';
    existing.status = 'active';
  } else {
    shares.shares.push({
      venture: opts.venture,
      url,
      password_ref: isPublic ? '' : `venture_passwords.${opts.venture}`,
      visibility: isPublic ? 'public' : 'private',
      deployed_at: now,
      last_redeployed: now,
      status: 'active',
      cloudflare_project_name: projectName,
    });
  }
  saveShares(shares);

  // Step 6: Save password to secrets if private
  if (!isPublic && password) {
    const secretsPath = join(LUMILAB_HOME, 'secrets.json');
    const secrets = existsSync(secretsPath) ? JSON.parse(readFileSync(secretsPath, 'utf-8')) : {};
    secrets.venture_passwords = secrets.venture_passwords ?? {};
    secrets.venture_passwords[opts.venture] = password;
    writeFileSync(secretsPath, JSON.stringify(secrets, null, 2));
  }

  // Step 7: Output
  console.log(`\n  📋 Summary:`);
  console.log(`     URL:      ${url}`);
  if (!isPublic && password) {
    console.log(`     密码:     ${password}（请单独告诉访问者）`);
  }
  console.log(`     二维码:   ${qrPath}`);
  console.log(`\n  💡 在 /lumilab manage 可以看到所有部署 + 改密码 + 删除`);
}

// Entry
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: bun run deploy.ts <venture-name> [--public] [--password=xxxxxx]');
    process.exit(1);
  }
  const venture = args[0];
  const isPublic = args.includes('--public');
  const passwordArg = args.find(a => a.startsWith('--password='));
  const password = passwordArg ? passwordArg.split('=')[1] : undefined;

  await deploy({ venture, public: isPublic, password });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
