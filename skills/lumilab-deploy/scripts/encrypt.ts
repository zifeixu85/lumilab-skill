/**
 * encrypt.ts — Client-side encryption for venture Studio bundle.
 *
 * AES-GCM-256 + PBKDF2-SHA256 (1M iterations).
 * Produces a wrapper HTML with embedded password gate (Web Crypto API).
 *
 * Usage:
 *   bun run encrypt.ts <studio-dir> <password> <output-dir>
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';

const PBKDF2_ITERATIONS = 1_000_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
}

async function encryptString(plaintext: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plaintext)
    )
  );
  return {
    salt_b64: bytesToBase64(salt),
    iv_b64: bytesToBase64(iv),
    ciphertext_b64: bytesToBase64(ciphertext),
    iterations: PBKDF2_ITERATIONS,
  };
}

function readDirRecursive(dir: string, baseDir: string = dir): Record<string, string> {
  const results: Record<string, string> = {};
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const relPath = relative(baseDir, fullPath);
    if (statSync(fullPath).isDirectory()) {
      Object.assign(results, readDirRecursive(fullPath, baseDir));
    } else {
      results[relPath] = readFileSync(fullPath, 'utf-8');
    }
  }
  return results;
}

function generateGateHtml(opts: {
  ventureName: string;
  salt_b64: string;
  iv_b64: string;
  ciphertext_b64: string;
  iterations: number;
}): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${opts.ventureName} · Private Studio</title>
<style>
  :root {
    --color-bg: oklch(98% 0.005 60);
    --color-text: oklch(18% 0.005 60);
    --color-accent: oklch(45% 0.18 12);
    --color-muted: oklch(60% 0.005 60);
    --font-display: 'Cabinet Grotesk', 'Fraunces', Georgia, serif;
    --font-mono: 'Geist Mono', ui-monospace, monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: var(--font-display);
    background: var(--color-bg);
    color: var(--color-text);
    min-height: 100dvh;
  }
  .gate {
    min-height: 100dvh;
    display: grid;
    place-content: center;
    padding: 2rem;
    text-align: center;
    max-width: 32rem;
    margin: 0 auto;
  }
  .gate-lock { font-size: 2rem; margin-bottom: 1rem; }
  .gate h1 {
    font-size: clamp(1.5rem, 4vw, 2rem);
    font-weight: 500;
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
  }
  .gate .subtitle {
    color: var(--color-muted);
    margin-bottom: 2rem;
  }
  .gate form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .gate input {
    flex: 1;
    font-family: var(--font-mono);
    font-size: 1.5rem;
    letter-spacing: 0.5rem;
    text-align: center;
    padding: 0.75rem 1rem;
    border: 1px solid oklch(85% 0.005 60);
    border-radius: 0.5rem;
    background: white;
    color: var(--color-text);
  }
  .gate input:focus {
    outline: none;
    border-color: var(--color-accent);
  }
  .gate button {
    padding: 0.75rem 1.5rem;
    background: var(--color-text);
    color: var(--color-bg);
    border: none;
    border-radius: 0.5rem;
    font-family: var(--font-display);
    font-weight: 500;
    cursor: pointer;
    transition: transform 150ms;
  }
  .gate button:active { transform: translateY(1px); }
  .gate .hint {
    color: var(--color-muted);
    font-size: 0.875rem;
    min-height: 1.5rem;
  }
  .gate .hint.error { color: var(--color-accent); }
  .gate .remember {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.85rem; color: var(--color-muted);
    margin-top: 0.5rem; cursor: pointer;
  }
  .gate .remember input { accent-color: var(--color-accent); }
  @keyframes gate-reveal {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .gate > * { animation: gate-reveal 400ms cubic-bezier(0.16, 1, 0.3, 1) both; }
  .gate > *:nth-child(2) { animation-delay: 80ms; }
  .gate > *:nth-child(3) { animation-delay: 160ms; }
  .gate > *:nth-child(4) { animation-delay: 240ms; }
</style>
</head>
<body>
<main class="gate" id="gate" style="display:none">
  <div class="gate-lock">🔒</div>
  <h1>${opts.ventureName}</h1>
  <p class="subtitle">这是一个加密的 Studio。请输入密码查看。</p>
  <form id="unlock-form">
    <input type="password" id="pwd" placeholder="••••••" autofocus required inputmode="numeric" pattern="[0-9]*">
    <button type="submit">解锁</button>
  </form>
  <label class="remember"><input type="checkbox" id="remember" checked> 在此设备上记住密码</label>
  <p class="hint" id="hint"></p>
</main>
<div id="content" style="display:none"></div>

<script>
const SALT_B64 = "${opts.salt_b64}";
const IV_B64 = "${opts.iv_b64}";
const ITERATIONS = ${opts.iterations};
const ENCRYPTED_B64 = "${opts.ciphertext_b64}";

// Cache key tied to encrypted blob (rotating password creates a new salt, invalidating cache)
const CACHE_KEY = "lumilab:unlocked:" + SALT_B64.slice(0, 16);

function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function tryUnlock(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64ToBytes(SALT_B64), iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, ['decrypt']
  );
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64ToBytes(IV_B64) },
      key, b64ToBytes(ENCRYPTED_B64)
    );
    return new TextDecoder().decode(plaintext);
  } catch (e) {
    return null;
  }
}

function renderDecrypted(decryptedText) {
  let html;
  try {
    const bundle = JSON.parse(decryptedText);
    const key = Object.keys(bundle).find(k => k === 'index.html' || k.endsWith('/index.html'));
    html = bundle[key] || '<p style="font-family:system-ui;padding:2rem">No index.html found in bundle</p>';
  } catch {
    html = decryptedText;
  }
  document.open();
  document.write(html);
  document.close();
}

// On load: try cached password (localStorage = persistent / sessionStorage = tab only)
(async function autoUnlock() {
  const cached = localStorage.getItem(CACHE_KEY) || sessionStorage.getItem(CACHE_KEY);
  if (cached) {
    const html = await tryUnlock(cached);
    if (html !== null) {
      renderDecrypted(html);
      return;
    }
    // Cache stale (password rotated) — clear and show gate
    localStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem(CACHE_KEY);
  }
  document.getElementById('gate').style.display = 'grid';
})();

document.getElementById('unlock-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pwd = document.getElementById('pwd').value;
  const remember = document.getElementById('remember').checked;
  const hint = document.getElementById('hint');
  hint.classList.remove('error');
  hint.textContent = 'Decrypting...';
  const html = await tryUnlock(pwd);
  if (html === null) {
    hint.classList.add('error');
    hint.textContent = 'Wrong password. Try again.';
    document.getElementById('pwd').value = '';
    return;
  }
  // Cache
  try {
    if (remember) localStorage.setItem(CACHE_KEY, pwd);
    else sessionStorage.setItem(CACHE_KEY, pwd);
  } catch {}
  renderDecrypted(html);
});
</script>
</body>
</html>`;
}

async function main() {
  const [, , studioDir, password, outputDir] = process.argv;
  if (!studioDir || !password || !outputDir) {
    console.error('Usage: bun run encrypt.ts <studio-dir> <password> <output-dir>');
    process.exit(1);
  }

  if (!existsSync(studioDir)) {
    console.error(`Studio dir does not exist: ${studioDir}`);
    process.exit(1);
  }

  // Read all files in studio dir
  const bundle = readDirRecursive(studioDir);
  const bundleJson = JSON.stringify(bundle);

  console.log(`Bundle size: ${(bundleJson.length / 1024).toFixed(1)} KB`);
  console.log(`Encrypting with PBKDF2 (${PBKDF2_ITERATIONS} iter) + AES-GCM-256...`);

  const encrypted = await encryptString(bundleJson, password);

  // Generate gate HTML
  const ventureName = studioDir.split('/').filter(Boolean).slice(-2)[0] || 'Studio';
  const gateHtml = generateGateHtml({
    ventureName,
    ...encrypted,
  });

  // Write output
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'index.html'), gateHtml);

  console.log(`✓ Encrypted bundle: ${outputDir}/index.html`);
  console.log(`  Wrapper size: ${(gateHtml.length / 1024).toFixed(1)} KB`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
