# 简历维护说明

本文件记录 `阴文喻-前端开发工程师.html` 与 kami 纸模板（`assets/templates/resume.html`）的差异及原因，供后续 AI 或人工改动时参考，避免误改已确认的偏差。

## 模板来源

- 模板：kami 纸 `resume.html`（parchment 背景 + ink-blue 强调色 + TsangerJinKai02 serif）
- 字号体系基准见 kami `CHEATSHEET.md` 的 Type 表与 resume 字号表（第 323-330 行）

## 与模板的差异

### 1. 页数：3 页（模板为 2 页）

模板默认 2 页（第一页项目、第二页开源/影响力/教育）。本简历内容量大，扩为 3 页：

- **第一页**：header + 指标 + 个人简介 + 核心能力 + 工作经历 + 资金管理门户项目
- **第二页**：云治理中心、网络方舟运营中心、金融指挥塔、运营平台、数字管理平台、凤凰数媒、考务平台 共 7 个项目
- **第三页**：AI 工程实践 + 团队协作与工程规范 + 教育背景

第一页只放 1 个项目是为控制溢出——若第一页放 2 个项目会撑到第 4 页。

### 2. 字号：正文上调到 9.5pt（模板 9.2pt）

模板 body 9.2pt，本简历正文统一上调到 9.5pt，为的是整体更舒展。**这是有意偏离标准档位**，不要回改到 9.2pt。

### 3. 行距：主正文 1.50（模板 1.42）

模板 body 行距 1.42（dense 档），本简历主正文用 1.50（reading 档下限）。原因：字号上调后 1.42 偏紧，1.50 更舒展且能塞进 3 页。**临界值**——再高会溢出第 4 页，不要再往上加。

### 4. 主/次正文两级层级

模板正文分两档（主 9.2 / 次 9），本简历沿用此层级，值调整为：

| 档位   | 字号 / 行距  | 涉及 class                              | 颜色       |
| ------ | ------------ | --------------------------------------- | ---------- |
| 主正文 | 9.5pt / 1.50 | `body` `summary` `os-intro` `proj-text` | near-black |
| 次正文 | 9pt / 1.40   | `exp-body` `conv-body`                  | olive      |

`proj-text` 曾是次正文（9pt），后应作者要求提为主正文（9.5pt）。**不要回退**。

### 5. 指标：3 项（模板 4 项）

模板 metrics 为 4 列，本简历精简为 3 项（grid 改 `repeat(3, ...)`）。原因：第 4 项「1h→0 周会文档」不够亮眼，作者要求删掉。

### 6. header 布局重排

模板 header 为 `flex-end` 对齐，联系方式在右侧 contact 块。本简历改为：

- 联系方式（电话/邮箱/语雀/GitHub）移到**姓名下方** `contact-links` 行
- 右侧 contact 块只留「前端开发工程师 · 6 年经验」+「成都 · 期望 14-16K」
- `.header` 用 `align-items: stretch`，`.contact` 用 `flex column + space-between`，使 role 顶部对齐姓名、contact-loc 底部对齐联系方式行

### 7. 工作经历：列表形式（模板为 timeline）

模板工作经历用 `.timeline` 三步时间线。本简历改为 4 公司列表（`.exp-list` / `.exp-item`），保留公司全名 + 精确时间 + 一句职责。原 `.timeline` / `.tl-*` CSS 已删除。

### 8. 删除的 section

模板有「开源项目 & 独立开发者」「对外影响力」两个 section，本简历无对应内容，已删除。对应的 `.os-grid` / `.os-item` / `.handle-strip` / `.impact-grid` / `.art-*` / `.talk-*` 等 CSS **保留未删**（作为模板基座，备复用）。

`team-culture` 块（页脚总结）已删除——内容与 summary 重复且属包装语。对应 CSS 已删。

### 9. 内容真实性修正（勿回改）

以下为作者明确要求修正的表述，**不要改回更夸张的版本**：

- 「核心业务线」→「中后台业务线」（项目不属于大厂核心业务）
- 「源码级类型设计能力」→「熟练运用泛型与内置类型等高级特性」
- 「6 年驻场」→「4 年驻场」（第一份工作非驻场，驻场段数为 3）
- 教育背景标注学习形式：本科非全日制（已拿学位证，突出「双证齐全」）、大专全日制
- AI 工程实践按年份降序排列

### 10. 未加 GitHub 仓库板块

作者 GitHub 仓库（8 个）全 0 star，不值得单开 os-item 板块，仅在联系方式行加 GitHub 链接。

## 渲染方式

```bash
# WeasyPrint 渲染（macOS SIP 环境用 venv）
/tmp/kami-venv/bin/python3 -c "from weasyprint import HTML; doc=HTML('阴文喻-前端开发工程师.html').render(); print('页数:', len(doc.pages)); doc.write_pdf('阴文喻-前端开发工程师.pdf'); print('---OK---')"
```

venv 路径 `/tmp/kami-venv/` 可能被系统清理，重建：

```bash
/opt/homebrew/bin/python3.14 -m venv /tmp/kami-venv
/tmp/kami-venv/bin/pip install -q weasyprint
```

## 改动注意事项

1. **字号行距勿轻易回退**：9.5pt / 1.50 是反复折中的结果，回退会破坏舒展度或导致溢出
2. **改完必须验证 3 页**：渲染命令见上，页数变化需重新审视布局
3. **保留模板通用 CSS**：os-grid / handle-strip / impact-grid / table / dense 等未使用样式属模板基座，勿删
4. **内容真实性优先**：定性词（核心/源码级/6年驻场）和时间已修正，勿改回夸大版本
5. **同步 md 源文件**：时间等事实性改动需同步到 `阴文喻-前端开发工程师.md`
