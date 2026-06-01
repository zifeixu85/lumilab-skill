---
name: lumilab-deploy
description: |
  One-command deploy of a venture's fake-door landing to Cloudflare Pages. DEFAULT = public, indexable validation page — so real strangers from SEO/GEO/小红书 can visit and you measure真实意愿（这是「对外测市场意愿」的正经模式）。Optional --private = client-side AES-GCM + password gate (advanced, for showing teammates/investors). Uses wrangler CLI; generates QR. Supports rotate-password and undeploy. Use when user types /lumilab deploy, /lumilab undeploy, or /lumilab rotate-password.
  关键词：deploy / 部署 / cloudflare pages / wrangler / 公开验证页 / SEO / 私密加密分享 / 密码门 / 一键部署 / 二维码 / 公网链接
version: 1.6.1
metadata:
  hermes:
    tags: [deploy, cloudflare, encryption, aes-gcm, password-gate]
  lumilab:
    tier: utility
    requires_browser: false
    chat_only_ok: true
  category: foundation
  agent: infrastructure
  upstream:
    - "wrangler (Cloudflare official CLI)"
    - "Web Crypto API (browser-native AES-GCM + PBKDF2)"
  outputs:
    - "data/ventures/<name>/deploy/manifest.json"
    - "data/ventures/<name>/deploy/encrypted-bundle/ (加密后的 HTML 包装层)"
    - "data/ventures/<name>/deploy/qr.png"
    - "~/.lumilab/shares.json (新增/更新条目)"
  reads:
    - "data/ventures/<name>/studio/ (要部署的内容)"
    - "~/.lumilab/config.json (默认密码 / 默认公开私密)"
    - "~/.lumilab/secrets.enc (Cloudflare token)"
license: AGPL-3.0-or-later
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---



# Deploy — Cloudflare Pages（默认公开验证页 / 可选私密加密）

## 用途

把 venture 的 **fake-door landing 验证页**一键部署到公网。

**默认 = 公开 + 可索引验证页**：让 SEO/GEO/小红书来的**真实陌生人**能访问，你才测得到真实购买意愿——这是「对外测市场意愿」的正经模式（配合第一方埋点读访问/点击/转化）。

**核心特点**：
- 纯静态托管（Cloudflare Pages），部署 **landing 验证页**（不是 studio 作战室日志）
- **默认公开 + 可被搜索/GEO 索引**（验证需要被陌生人发现）
- `--noindex`：公开但不收录（只发链接、不做 SEO）
- `--private`（高级选项）：内容**真加密**（AES-GCM-256 + PBKDF2 1M）+ 密码门，给队友/投资人私密预览用 —— **不在默认/配置主流程出现**，仅显式 `--private` 时走

## 命令

```bash
/lumilab deploy <venture>              # 部署 = 公开可索引验证页（默认）
/lumilab deploy <venture> --noindex    # 公开但不被搜索引擎收录
/lumilab deploy <venture> --private    # 私密：加密 + 密码门（高级，给特定人看）
/lumilab undeploy <venture>            # 删 Cloudflare 项目 + 归档 shares.json
/lumilab rotate-password <venture>     # （--private 部署的）改密码 + 重新部署
/lumilab deploy:status [<venture>]     # 查看部署状态
/lumilab signals <venture>                  # 拉第一方埋点 → studio/validation-signals.json（漏斗面板）
```

## 部署流程（默认公开）

```
1. 选 landing 验证页（landing/v<最大N>/ 优先；--target studio 才部署作战室）
2. 公开模式：直接拷贝源目录（不加密、无密码门），保留 landing-mvp 生成的
   sitemap.xml / robots.txt / llms.txt / canonical / OG —— SEO/GEO 生效
3. wrangler pages deploy → <project>.pages.dev
4. 生成二维码 deploy/qr.png + 更新 shares.json + deploy/manifest.json（public:true）
5. 输出公开 URL（可直接发小红书/朋友圈/PH 引流）

私密模式（--private）：步骤 2 换成 PBKDF2(密码,1M)→AES-GCM-256 加密整页 +
生成密码门 wrapper HTML，其余相同；输出 URL + 密码（单独告诉访问者）。
```

## 第一方埋点 + 欢迎邮件（公开模式自带）

公开部署自动注入第一方埋点（`track.js` + CF Pages Function `/api/track` → 你自己的 **CF D1**），收 访问/点击/留资/付费 + UTM 渠道归因 + 国家（边缘免费拿）+ 爬虫过滤。`scripts/pull-signals.ts <venture>` 拉成漏斗喂 Studio。

**欢迎邮件（Resend，可选）**：留邮箱后自动回一封欢迎信 —— 但**发信必须有验证域名**（任何邮件服务的行业要求）：
- 发信域名 = FROM 地址的域名，**跟 landing 在 `xxx.pages.dev` 无关**；用户只要有**任意一个自有域名**，在 Resend 验证一次（加 SPF/DKIM DNS），设 `config.json` 的 `deploy.resend_from = "Name <hi@your-domain>"` 即可。
- **`pages.dev` 不能验证**（用户不控制其 DNS），所以发不了 `@pages.dev` 的信。
- **没配域名也没关系**：邮箱照样**入库 D1**（可导出/手动发），只是不自动回欢迎信 —— 验证主流程完全不受影响。`deploy.resend_from` 未配（或填 resend.dev 沙盒）时自动跳过发信、只捕获。

## 密码门 HTML 包装层

`templates/password-gate.html.tpl`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{venture_name}} · Private Studio</title>
  <style>
    /* 严格 Anti-Slop 设计：不用 Inter / 不用紫蓝渐变 / 用 OKLCH / 有 @keyframes */
    :root {
      --color-bg: oklch(98% 0.005 60);
      --color-text: oklch(18% 0.005 60);
      --color-accent: oklch(45% 0.18 12);
      --font-display: 'Cabinet Grotesk', system-ui, sans-serif;
      --font-mono: 'Geist Mono', monospace;
    }
    body { font-family: var(--font-display); background: var(--color-bg); color: var(--color-text); }
    .gate { min-height: 100dvh; display: grid; place-content: center; padding: 2rem; }
    .gate h1 { font-size: 2rem; font-weight: 500; }
    .gate input { font-family: var(--font-mono); font-size: 1.5rem; letter-spacing: 0.5rem; }
    @keyframes gate-reveal { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .gate { animation: gate-reveal 400ms cubic-bezier(0.16, 1, 0.3, 1); }
    /* ... */
  </style>
</head>
<body>
  <main class="gate" id="gate">
    <h1>🔒 Private Studio</h1>
    <p>This {{venture_name}} project page is password-protected.</p>
    <form id="unlock-form">
      <input type="password" id="pwd" placeholder="••••••" autofocus required>
      <button type="submit">Unlock</button>
    </form>
    <p class="hint" id="hint"></p>
  </main>
  <div id="content" style="display:none"></div>

  <script>
    const SALT_B64 = "{{salt_b64}}";
    const IV_B64 = "{{iv_b64}}";
    const ITERATIONS = {{iterations}};
    const ENCRYPTED_B64 = "{{ciphertext_b64}}";

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
        const html = new TextDecoder().decode(plaintext);
        document.getElementById('content').innerHTML = html;
        document.getElementById('content').style.display = 'block';
        document.getElementById('gate').style.display = 'none';
        // execute any scripts in decrypted content
        document.querySelectorAll('#content script').forEach(s => {
          const ns = document.createElement('script');
          ns.textContent = s.textContent;
          document.body.appendChild(ns);
        });
        return true;
      } catch (e) {
        return false;
      }
    }

    document.getElementById('unlock-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pwd = document.getElementById('pwd').value;
      const hint = document.getElementById('hint');
      hint.textContent = 'Decrypting...';
      const ok = await tryUnlock(pwd);
      if (!ok) {
        hint.textContent = 'Wrong password. Try again.';
        document.getElementById('pwd').value = '';
      }
    });
  </script>
</body>
</html>
```

## 加密参数

```
Algorithm:    AES-GCM
Key length:   256 bits
KDF:          PBKDF2-SHA256
Iterations:   1,000,000
Salt:         16 bytes random per deploy
IV:           12 bytes random per deploy
```

**安全估算**：
- 6 位数字密码（1M 组合）+ PBKDF2 1M 迭代 = 离线 GPU 攻击约 30 分钟
- 4 位数字（10K）= 5-30 秒（**警告用户**）
- 8 位字母+数字 = 几乎不可能

## wrangler 调用

```bash
# 首次创建项目（若不存在）
wrangler pages project create <project-name> --production-branch=main

# 部署
wrangler pages deploy ./encrypted-bundle/ \
  --project-name=<project-name> \
  --branch=main

# 删除
wrangler pages project delete <project-name>

# 列表
wrangler pages project list
```

Token 从 `~/.lumilab/secrets.enc` 解密后通过 env var 传入：`CLOUDFLARE_API_TOKEN=xxx wrangler ...`

## Skill 实现：scripts/

```
skills/lumilab-deploy/scripts/
├── deploy.ts           # 主入口 /lumilab deploy
├── undeploy.ts
├── rotate-password.ts
├── encrypt.ts          # AES-GCM + PBKDF2 加密
├── gate-wrapper.ts     # 生成 password gate HTML
├── qr.ts               # 二维码生成
└── wrangler.ts         # wrangler CLI wrapper
```

## 错误处理

- `wrangler not installed` → 提示 `npm i -g wrangler`
- `Cloudflare 401` → token 失效，提示 `/lumilab config` 重配
- `Build failed` → 透传 Cloudflare 错误日志
- `Project name conflict` → 自动加 hash 后缀重试

## 跨 runtime user-input 协议

```yaml
user_input:
  - mode: terminal
    method: "AskUserQuestion 密码选择 / 公开私密 / 二次确认"
  - mode: browser
    method: "通过 Share Manager 触发部署 / 删除 / 改密码"
```

## 必做约束

```
✓ 默认 private + 默认密码（不要用户每次都想）
✓ 密码本地存 secrets.enc，shares.json 仅引用
✓ undeploy 二次确认
✓ rotate-password 自动重新加密 + 推送
✓ 显示给用户的密码可一键复制
✓ Qr 码本地生成（不依赖外部服务）
✓ deploy 后写 shares.json 更新
```

## Anti-Slop

❌ 部署成功消息「🎉 Congrats! Your studio is live!」（俗）
❌ "Deploying with ❤️ to Cloudflare..."（炫技）
❌ 进度用 spinner gif（用 skeleton 或文本进度）

✅ "Encrypting (5s) → Uploading (28s) → Building (8s) → Done"（具体）
✅ URL + 密码用等宽字体清晰显示
✅ 「单独告诉对方」明确写在提示里

## 引用

- 配套：lumilab-config（提供 token）
- 配套：lumilab-studio（提供要部署的 HTML 内容）

## 分支决策

| 条件 | 动作 |
|---|---|
| wrangler 未安装 | abort，提示 `npm i -g wrangler`，不重试 |
| Cloudflare 返回 401 | abort，token 失效，提示 `/lumilab config` 重配 |
| 用户选「公开」 | 跳过加密步骤，manifest 写 `public: true`，无 encryption 块 |
| `deploy:status` 且 venture 未部署过 | 报「未找到部署记录」，不创建空 manifest |
| 同 venture 内容 hash 未变 | 跳过部署，复用上一版 URL |
| `rotate-password` | 重新加密 + 推送，同时失效旧 localStorage 缓存 |

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | free（本地执行） | ≥1.0，必需 |
| wrangler | Cloudflare CLI | 免费 | free（Cloudflare Pages 免费层 500 build/月） | 用户全局安装，部署必需 |
| Cloudflare Pages | 静态托管 | 免费层够用 | free（个人项目通常 $0/mo） | 加密 blob 托管 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | ~1-2K tokens / 次部署 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Output validation

`scripts/validate-output.ts`（bun，确定性校验）检查 `deploy/manifest.json`：`versions` 为非空数组、每个版本含 `url`（https://）/ `deployed_at` / `public`（boolean），非 public 版本的 `encryption` 块满足 `algorithm == "AES-GCM"`、`kdf == "PBKDF2"`、`iterations >= 100000`。

```bash
bun run scripts/validate-output.ts data/ventures/<slug>/   # exit 0 = valid, 1 = invalid
bun run scripts/validate-output.ts --help
```

校验字段:
- `deploy/manifest.json` → `versions`: array（非空）
- `deploy/manifest.json` → `versions[].url`: string（必须 `https://` 开头）
- `deploy/manifest.json` → `versions[].deployed_at`: string（非空，ISO-8601）
- `deploy/manifest.json` → `versions[].public`: boolean
- `deploy/manifest.json` → `versions[].encryption`: object（非 public 版本必需，含 `algorithm == "AES-GCM"`、`kdf == "PBKDF2"`、`iterations >= 100000`）

## Outputs

- `data/ventures/<slug>/deploy/manifest.json`（部署版本历史 + 加密参数）
- `data/ventures/<slug>/deploy/encrypted-bundle/`（AES-GCM 加密后的 HTML 包装层）
- `data/ventures/<slug>/deploy/qr.png`（移动端访问二维码）
- `~/.lumilab/shares.json`（新增/更新分享条目）
- 远端 `<slug>.pages.dev`（AES-GCM + PBKDF2 加密）

## Example

`lumilab deploy <venture>` → 返回 URL + 密码

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

同一 venture 重 deploy 覆盖 Cloudflare 远端文件；`deploy/manifest.json` 累积版本历史（含旧 URL + 旧密码）。

## Privacy

**端到端**：客户端 AES-GCM + PBKDF2 1M 迭代，密码不离开本机；Cloudflare 只存加密 blob；密码在 manifest 单独 chmod 600 存本地，不进远端。

## Cache

相同 venture 内容 hash 不变则跳过部署；密码不变则 reuse cache，加密 blob 不变。

## Failure modes

`E_401` Cloudflare token 失效 → 直接 abort；wrangler 缺失 → 提示 `npm i -g wrangler`；网络断 → 本地保留 `.deploy.pending` 待续传。

## Edge cases

venture slug 含中文 / 特殊字符自动 punycode；password rotate 同时失效 localStorage cache；删除部署同时清 shares.json 条目。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **Vercel / Netlify 直接部署**：不带客户端加密 + 密码门，分享即公开。
- **加密笔记工具**：能加密但不是可分享的 web 页。
- **通用 LLM 帮你写部署脚本**：能跑但不做 AES-GCM + PBKDF2 + 密码门 + localStorage 缓存。

Lumi Lab 的差异：Cloudflare Pages + 客户端 AES-GCM/PBKDF2 1M 迭代加密 + 6 位密码门 + rotate 自动失效缓存，端到端密码不离开本机。

## Moat（复利护城河）

deploy/manifest.json 累积所有部署历史（含旧 URL / 旧密码）。每个 venture 的 Studio 都可一键加密分享，形成你的私密作品集网络。

## Changelog

- **1.0.0-rc1** — 加 `## Changelog` / `scripts/package.json` / `校验字段:` 显式 schema 声明；Dependencies 表补单次调用成本列。
- **0.3.0** — `validate-output.ts` 加 manifest 版本数组 + 加密参数校验（AES-GCM / PBKDF2 / iterations ≥ 100000）；`anti-slop-lint.ts` 接入。
- **0.2.0** — 补 `## 分支决策` if-then 表、6 位密码门、rotate 自动失效缓存。
- **0.1.0-p0** — 初版：Cloudflare Pages 部署 + 客户端 AES-GCM/PBKDF2 加密 + 二维码。

## 环境自检（首次运行前）

本 skill 的 `scripts/` 用 **bun ≥ 1.0** 运行。宿主里第一次调用 Lumi Lab 任意 skill 前，先做一次环境自检——缺 bun 就自动装（装在 `~/.bun/`，无需 root，约 30 秒）：

```bash
command -v bun >/dev/null 2>&1 || { [ -x "$HOME/.bun/bin/bun" ] && export PATH="$HOME/.bun/bin:$PATH"; }
command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"   # 当前 shell 立即可用
```

宿主 agent（Claude Code / OpenClaw / Hermes）能跑 shell，应在首次调用前自动执行上面这段。纯方法论用法（不跑脚本、只读 SKILL.md 做对话）不需要 bun。

## 主动交付（不要静默落盘）

这个 skill 产出的任何**用户该看的东西**，都要主动交付给用户 —— 不能写完文件就完事。

- **优先 HTML 图文并茂**：分析报告、landing、Studio、周复盘等用户要「看」的产物，渲染成 HTML，本地自动开浏览器，chat 环境（`LUMILAB_CHANNEL != local`）作为**文件附件**发给用户。
- **.md / .yaml 产物**：在 chat 里贴一段**纯文字摘要** + 告诉用户文件路径；用户要细节再发完整文件。不要假设用户会自己去翻 `data/ventures/` 目录。
- **每个 phase 结束**：用一两句话告诉用户「这一步做了什么、产出在哪、下一步是什么」。
- **判断「用户该看」的标准**：如果这个产物影响用户的下一个决策，或者用户花了输入成本期待一个结果 —— 就必须主动交付，不能等用户问。

## 写时更新（产物变了就刷新 home / studio）

Lumi Lab 用「写时更新」保持 home dashboard 和 venture Studio 是最新的 —— 没有常驻进程做实时同步，所以**谁改了数据，谁负责顺手刷新**。

这个 skill 只要**创建或更新了某个 venture 的文件**（写了 `market_analysis.json` / `reports/` / `landing/` / `decisions.yaml` / `design_direction.json` / retro YAML 等），做完后**必须**：

1. 重渲这个 venture 的 Studio：`bun run ../lumilab-studio/scripts/render.ts ~/.lumilab/data/ventures/<slug>`
2. 重渲 home dashboard：`bun run ../lumilab-home/scripts/home.ts render`

这样用户回到 home 或 Studio 就能立刻看到这一步的产物，不用手动说「刷新」。如果只是读、没写 venture 数据，不用刷新。

CLI 入口（`lumilab idea` / `config` / `deploy`）已经内置了写时更新；**对话式调用时由你（宿主 agent）负责补这两步**。
