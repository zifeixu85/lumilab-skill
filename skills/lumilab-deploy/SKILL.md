---
name: lumilab-deploy
description: |
  One-command deployment of venture Studio to Cloudflare Pages with client-side encryption and password gate. Reads encrypted content (AES-GCM + PBKDF2 1M iterations) and wraps it in static HTML password gate. Uses wrangler CLI to push to Cloudflare Pages. Generates QR code for mobile access. Supports rotate-password and undeploy. Use when user types /lumilab deploy, /lumilab undeploy, or /lumilab rotate-password.
  关键词：deploy / 部署 / cloudflare pages / wrangler / 加密分享 / 密码门 / venture studio 部署 / 一键部署 / 二维码 / 公网链接
version: 1.0.0-rc1
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
    - "data/ventures/<name>/deploy/deploy-status.json"
    - "data/ventures/<name>/deploy/encrypted-bundle/ (加密后的 HTML 包装层)"
    - "data/ventures/<name>/qr.png"
    - "~/.lumilab/shares.json (新增/更新条目)"
  reads:
    - "data/ventures/<name>/studio/ (要部署的内容)"
    - "~/.lumilab/config.json (默认密码 / 默认公开私密)"
    - "~/.lumilab/secrets.enc (Cloudflare token)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# Deploy — Cloudflare Pages + 客户端加密 + 密码门

## 用途

把 venture 的 Studio 内容一键部署到公网 + 用密码门保护。

**核心特点**：
- 纯静态托管（Cloudflare Pages）
- 内容**真加密**（AES-GCM-256），连 Cloudflare 都读不到原文
- 密码门客户端验证（密码不通过网络传输）
- 默认密码预填（用户在 Setup Wizard 设的「常用密码」）
- 一键改密码（重新加密 + 推送）

## 命令

```bash
/lumilab deploy <venture>              # 部署
/lumilab deploy <venture> --public     # 公开（无密码）
/lumilab undeploy <venture>            # 删 Cloudflare 项目 + 归档 shares.json
/lumilab rotate-password <venture>     # 改密码 + 重新部署
/lumilab deploy:status [<venture>]     # 查看部署状态
```

## 部署流程

```
1. 读 data/ventures/<name>/studio/ 整个目录
2. 询问密码（默认预填 ~/.lumilab/config.json.deploy.default_password）
   ○ 使用默认 [回车]
   ○ 换一个
   ○ 改成随机
   ○ 改成公开（无密码）
3. 加密：
   - 取 PBKDF2(password, salt=16B random, iterations=1M, hash=SHA-256) → key
   - 取 iv = 12B random
   - AES-GCM-256 加密整个 HTML bundle → ciphertext
4. 生成 wrapper HTML（密码门 + Web Crypto API 解密 JS）
5. wrangler pages deploy ./encrypted-bundle/ --project-name=<auto-named>
6. 等待 Cloudflare build（20-40s）
7. 生成二维码（QR.png）
8. 更新 ~/.lumilab/shares.json
9. 输出 URL + 密码（提示用户单独告诉访问者）
```

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

## Dependencies

| 依赖 | 类型 | 是否付费 | 说明 |
|---|---|---|---|
| bun | CLI runtime | 免费 | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Outputs

`data/ventures/<slug>/deploy/manifest.json` · 远端 `<slug>.pages.dev`（AES-GCM + PBKDF2 加密）

## Example

`lumilab deploy <venture>` → 返回 URL + 密码

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。
