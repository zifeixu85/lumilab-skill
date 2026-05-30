# 小红书封面 HTML 模板库

默认走 **HTML 渲染 → Puppeteer/Playwright 截图（3:4）**：中文字 100% 可靠、0 崩字、0 成本、可程序化。
AI 出图（EvoLink gpt-image-2 / Seedream）只在需要氛围/视觉丰富时作第二步增强 —— 文字仍留在这层。

## 为什么是这几个（按 Lumi Lab 调性精选，不全搬）

产品调性 = 独立开发者 / 一人公司的**验证工具**：编辑 / 瑞士 / 工业纸感 / 终端，反 slop，OKLCH，distinctive。

**本批已建（3 个）**
| 模板 | 风格 | 最适合 | 来源 |
|---|---|---|---|
| `editorial` | 编辑杂志 | 产品思考 / AI 随笔 / 复盘 | 原创（guizang Editorial 启发） |
| `swiss-data` | 瑞士数据 | 验证数据 / 红蓝海 / 产品更新 | 原创（guizang Swiss 启发） |
| `terminal` | 终端 | 开发者向 / CLI / release note | 改编自 lieflat（MIT） |

**已入围、下一批再加**：`consulting-report`（严肃报告，贴验证）· `dot-matrix`（干净极客）· `clean-review`（极简评测）—— 均 lieflat MIT。

**已排除**：`sunrise`（太软）· `shiny-tiles`（太花/AI slop）· `rain-notes`（生活方式低频）· `story-field`（电影感，lieflat 自己标低频）· `pixel-report`（复古游戏感）· `geek-report`（与 terminal 重叠）。

## License（重要 —— 决定怎么用）

- **lieflat = MIT** ✅ 可直接改用，保留署名（见各模板头部注释）。本库 `terminal` 即改编自
  `larashero3-dotcom/lieflat-html-design`（MIT）。
- **guizang = AGPL-3.0** ⚠️ 强传染 copyleft，**不抄其代码/模板**。我们只**借设计原则**（editorial/swiss 双模式、
  "越大越细"排版、反 slop 规则 —— 本就是我们 deck skill 的同源 DNA），`editorial` / `swiss-data` 为**原创**实现。

## 从两库借来的特性

- **截图管线**：CSS 画布 600×800 → 导出 **1080×1440 @2x**（lieflat `capture-xhs-card.mjs` 思路）。
- **小红书安全区**：side 72–96 / top 72–112 / bottom 80–120 px（guizang `platform-specs`）—— 模板已留 96/80/100。
- **排版纪律**：display weight 500–600 + 宽字距；小字 mono 大写 + 宽字距。**全用系统字体**（PingFang/Noto Sans + 等宽），**不托管/不依赖衬线字体**。**禁** 700–900 重体大标题配过紧负字距（会塌成廉价 banner）。
- **反 slop**：无 blob / bokeh / 装饰渐变 / 随机 SVG 圆 / 贴纸（guizang style-system，与我们既有 anti-slop 一致）。
- **标题压缩 + 缩略图可读性 QA**：长 topic 缩成可读封面标题；导出后按拇指大小自检。

## Lumi Lab 独有增强（参考库没有）

**配色继承**：每个模板的 `:root` 用 OKLCH 变量（`--accent` / `--paper` / `--ink`…）。渲染前用 venture 的
`design_direction.json` 覆盖这几个变量 → **小红书封面与 landing 视觉一致**。不覆盖则用 Lumi Lab 默认暖陶土。

## 安全边界 & 密度自适应（每个模板都内置，新模板必须遵守）

固定 600×800 画布 + 变长内容 = 必须防两头：**长内容溢出** / **短内容发空**。每个模板已内置：

1. **`.card { overflow:hidden }`** —— 硬裁切，任何东西都escape不出卡片（兜底）。
2. **`data-fit` 自适应字号**（内联脚本，二分缩放）：标了 `data-fit` 的元素（标题、hero 数字）会缩放到**不溢出**其容器（宽 + 可选 `data-fit-maxh` 高）。
   - `data-fit-max` / `data-fit-min` = 字号上下限。**短内容放大到 max（填充）、长内容缩小到 min（不溢出）** —— 一招同时解决两头。
   - hero 数字额外 `white-space:nowrap` + 容器定宽，确保 `¥128,400` 这类长值能被测量并缩小。
3. **居中内容块**：`kicker 顶 / .stage 居中(flex:1, justify-center) / footer 底`。内容稀疏时居中、上下留白均衡（不发空）；密集时填满。
4. **副标题 line-clamp**：`-webkit-line-clamp` 限行 + 省略号，超长不会顶破布局。
5. **标签/值防溢出**：长标签 `overflow-wrap:anywhere` 换行；数值/footer/kicker `text-overflow:ellipsis` 省略；网格用 `minmax(0,1fr)` 防撑破。
6. **小红书安全区**：padding 96/80/100，关键元素不进底部 UI 遮挡区。

> 新增模板务必带：`overflow:hidden` 的 card + 给主标题/大数字加 `data-fit` + 副文本 line-clamp + 居中 `.stage`。
> 占位用极端长串 + 极短串各跑一次截图自检（见下「怎么渲染」第 5 步）。

## 怎么渲染

1. 复制模板 → 替换 `{{...}}` 占位为真实文案（先让用户**确认文案准确**，这是两步流程的第一步）。
2. （可选）注入 design_direction 配色：把 `:root` 里的 `--accent`/`--paper`/`--ink` 改成 venture 选定值。
3. 截图（视口 600×800，deviceScaleFactor=2 → 1080×1440 PNG，落 `~/.lumilab/data/ventures/<slug>/content/xhs/card-<n>.png`）：
   - **必须先等字体加载 + 自适应脚本跑完再截**，否则 data-fit 用错误字宽测量：
     `await page.evaluate(()=>document.fonts.ready); await page.waitForSelector('[data-fitted]');`
   - 复用 bundle 里的 Playwright（research-platforms 已依赖）；或 headless Chrome `--screenshot`（脚本是同步的，load 后即生效）。
4. 内容画廊展示卡片 + 复制文案 + 下载图片（批量 zip）。
5. **自检（必做）**：每个模板用**极长**和**极短**两组文案各截一次，确认①无任何文字溢出卡片 ②稀疏内容不发空。这是上线前的硬门。

## 怎么扩展（加下一批）

- 加模板：放一个 `<id>.html`（自带 OKLCH `:root` + 安全区 padding + `{{占位}}`）→ 在 `catalog.json.templates` 登记。
- lieflat MIT 模板可继续改编（保留头部 MIT 署名）；guizang 只借思路、自己写。
- 占位命名保持一致（`{{TITLE}}`/`{{SUBTITLE}}`/`{{META}}`/`{{TAG}}`…），下游填充逻辑 0 改动。
