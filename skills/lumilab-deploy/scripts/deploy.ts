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

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';
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
  indexable?: boolean;              // 仅 --public 模式有效；默认 noindex
  target?: 'landing' | 'studio';   // 默认 landing（验证页）；studio = 项目作战室日志
}

/**
 * 选要部署的目录。默认部署 **landing 验证页**（用户上线验证用的那个），
 * 不是 studio 作战室日志。
 *   - target='landing'（默认）：landing/v<最大N>/ 优先，否则 landing/（含 index.html）
 *   - target='studio'：studio/
 * 找不到对应目录时明确报错，绝不静默 fallback 到另一个（避免「部署了详情页」的坑）。
 */
function resolveDeploySource(ventureDir: string, target: 'landing' | 'studio'): { dir: string; label: string } {
  if (target === 'studio') {
    const studioDir = join(ventureDir, 'studio');
    if (existsSync(join(studioDir, 'index.html'))) return { dir: studioDir, label: 'Studio 作战室日志' };
    console.error(`✗ studio/index.html 不存在：${studioDir}\n  先渲染 Studio：lumilab render <venture>`);
    process.exit(1);
  }
  // target === 'landing'
  const landingRoot = join(ventureDir, 'landing');
  if (existsSync(landingRoot)) {
    // 找 landing/v<N>/ 最大版本
    const versions = readdirSync(landingRoot)
      .filter((d) => /^v\d+$/.test(d) && existsSync(join(landingRoot, d, 'index.html')))
      .sort((a, b) => parseInt(b.slice(1), 10) - parseInt(a.slice(1), 10));
    if (versions.length > 0) {
      return { dir: join(landingRoot, versions[0]), label: `Landing 验证页 (${versions[0]})` };
    }
    // 或 landing/ 根目录直接有 index.html
    if (existsSync(join(landingRoot, 'index.html'))) {
      return { dir: landingRoot, label: 'Landing 验证页' };
    }
  }
  console.error(`✗ 没找到 landing 验证页：${landingRoot}/[v<N>/]index.html`);
  console.error(`  先生成 landing：用 lumilab-idea-to-landing 跑完流水线，或直接用 lumilab-landing-mvp`);
  console.error(`  （如果你确实想部署 Studio 作战室日志，加 --target studio）`);
  process.exit(1);
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
  // Cloudflare token 在历史版本里被存过几种 key 名（wizard 存 cloudflare_token，
  // chat-set 存 CLOUDFLARE_API_TOKEN，旧版 cloudflare_api_token）——这里把所有
  // 变体都读一遍，避免「存在 A、读的是 B」的踩坑。
  const KEY_VARIANTS = ['CLOUDFLARE_API_TOKEN', 'cloudflare_api_token', 'cloudflare_token', 'CLOUDFLARE_TOKEN'];
  // env override 最优先
  for (const k of KEY_VARIANTS) {
    if (process.env[k]) return process.env[k] as string;
  }
  // keychain.ts（macOS Keychain / Linux secret-tool）
  const keychainScript = join(import.meta.dir, '..', '..', 'lumilab-config', 'scripts', 'keychain.ts');
  if (existsSync(keychainScript)) {
    for (const key of KEY_VARIANTS) {
      const r = spawnSync('bun', ['run', keychainScript, 'get', key], { stdio: ['ignore', 'pipe', 'ignore'] });
      if (r.status === 0) {
        const v = r.stdout.toString().trim();
        if (v && v !== 'fake') return v;
      }
    }
  }
  // fallback: plaintext secrets.json —— 读所有变体（含大小写），跳过占位值 "fake"
  const secretsPath = join(LUMILAB_HOME, 'secrets.json');
  if (existsSync(secretsPath)) {
    try {
      const secrets = JSON.parse(readFileSync(secretsPath, 'utf-8')) as Record<string, unknown>;
      for (const k of KEY_VARIANTS) {
        const v = secrets[k];
        if (typeof v === 'string' && v.trim() && v.trim() !== 'fake') return v.trim();
      }
    } catch { /* fall through to error */ }
  }
  console.error('Cloudflare token 未配置（或值为占位 "fake"）。先跑 `lumilab config`，或 `lumilab secrets set CLOUDFLARE_API_TOKEN <真实 token>`。');
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
  if (!existsSync(ventureDir)) {
    console.error(`venture 不存在：${ventureDir}`);
    process.exit(1);
  }

  // 默认部署 landing 验证页，不是 studio 作战室
  const target = opts.target ?? 'landing';
  const { dir: sourceDir, label: sourceLabel } = resolveDeploySource(ventureDir, target);

  console.log(`\n📦 Deploying venture: ${opts.venture}`);
  console.log(`   部署内容：${sourceLabel}\n`);

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
      ['run', join(__dirname, 'encrypt.ts'), sourceDir, password, deployDir],
      { stdio: 'inherit' }
    );
    if (encryptResult.status !== 0) {
      console.error('Encryption failed');
      process.exit(1);
    }
  } else {
    // Public: 拷贝源目录内容到 deployDir
    spawnSync('cp', ['-r', `${sourceDir}/.`, deployDir]);
    // 默认 noindex：搜索引擎不索引 fake-door 验证页
    //   - HTML 注入 <meta name="robots" content="noindex,nofollow">
    //   - Cloudflare _headers 文件加 X-Robots-Tag: noindex
    //   - 写一个 robots.txt 兜底
    // 显式 --indexable 时跳过（v2 SEO 上线模式）
    const allowIndex = opts.indexable ?? false;
    if (!allowIndex) {
      const indexHtml = join(deployDir, 'index.html');
      if (existsSync(indexHtml)) {
        const original = readFileSync(indexHtml, 'utf-8');
        if (!original.includes('name="robots"')) {
          const injected = original.replace(
            /<head>/i,
            '<head>\n  <meta name="robots" content="noindex,nofollow,noarchive">'
          );
          writeFileSync(indexHtml, injected);
        }
      }
      writeFileSync(join(deployDir, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n');
      writeFileSync(join(deployDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
      console.log('  🔕 noindex: meta + _headers + robots.txt (no search engine)');
    } else {
      console.log('  🔎 indexable: search engines can crawl this page');
    }
  }

  // Step 3: wrangler deploy
  const projectName = `${opts.venture}-${process.env.USER ?? 'user'}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 58);
  const cfToken = getCloudflareToken();
  const wranglerEnv = { ...process.env, CLOUDFLARE_API_TOKEN: cfToken };

  // 首次部署：项目不存在时 wrangler 4.x 不会自动建 → 先确保项目存在（幂等，已存在则忽略报错）
  console.log(`  ☁️  确保 Pages 项目存在：${projectName}`);
  spawnSync(
    'wrangler',
    ['pages', 'project', 'create', projectName, '--production-branch', 'main'],
    { env: wranglerEnv, stdio: 'ignore' }
  ); // 已存在会非零退出，无害；真失败由下面的 deploy 兜底报错

  console.log(`  ☁️  wrangler pages deploy → ${projectName}.pages.dev`);
  const wranglerResult = spawnSync(
    'wrangler',
    ['pages', 'deploy', deployDir, '--project-name', projectName, '--commit-dirty=true'],
    {
      env: wranglerEnv,
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

  // Step 7: 写时更新 —— 部署状态变了，re-render home + 这个 venture 的 studio（best-effort）。
  try {
    const homeScript = join(__dirname, '..', '..', 'lumilab-home', 'scripts', 'home.ts');
    if (existsSync(homeScript)) {
      spawnSync('bun', ['run', homeScript, 'render'], { stdio: 'ignore' });
    }
    const renderScript = join(__dirname, '..', '..', 'lumilab-studio', 'scripts', 'render.ts');
    if (existsSync(renderScript)) {
      spawnSync('bun', ['run', renderScript, ventureDir], { stdio: 'ignore' });
    }
  } catch { /* best-effort */ }

  // Step 8: Output
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
    console.error('Usage: bun run deploy.ts <venture-name> [--public] [--indexable] [--password=xxxxxx] [--target landing|studio]');
    console.error('  默认：私有 + 加密 + 密码门');
    console.error('  --public：公开（noindex 兜底，搜索引擎不收录）');
    console.error('  --public --indexable：完全开放（最终上线模式）');
    console.error('  --target studio：部署 Studio 作战室（默认 landing 验证页）');
    process.exit(1);
  }
  const venture = args[0];
  const isPublic = args.includes('--public');
  const indexable = args.includes('--indexable');
  const passwordArg = args.find(a => a.startsWith('--password='));
  const password = passwordArg ? passwordArg.split('=')[1] : undefined;
  // --target landing|studio （也接受 --target=landing 写法）
  const targetIdx = args.findIndex(a => a === '--target' || a.startsWith('--target='));
  let target: 'landing' | 'studio' = 'landing';
  if (targetIdx !== -1) {
    const raw = args[targetIdx].includes('=') ? args[targetIdx].split('=')[1] : args[targetIdx + 1];
    if (raw === 'studio') target = 'studio';
    else if (raw === 'landing') target = 'landing';
    else { console.error(`✗ --target 只能是 landing 或 studio（收到：${raw}）`); process.exit(2); }
  }

  await deploy({ venture, public: isPublic, indexable, password, target });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
