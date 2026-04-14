# CF Pages Publisher — 用户指南

将 Markdown/HTML 内容一键发布为 Cloudflare Pages 静态网页，自动生成永久链接。

## 功能特性

- **内容哈希 URL** — 每次发布自动生成 `https://<project>.pages.dev/<hash>/` 形式的永久链接，内容不变链接不变
- **增量部署** — 旧哈希目录保留，已有链接永不失效
- **安全默认值** — Markdown 中的原始 HTML 默认转义，防止 XSS
- **多种认证方式** — 支持 .env 文件、API Token、浏览器登录

## 前置条件

- Node.js >= 18
- 一个 Cloudflare 账号（免费版即可）

## 快速开始

### 1. 告诉 AI 助手安装这个 Skill

直接在 Claude Code 终端中输入：

```
https://github.com/zzturn/cf-pages-publisher 请帮我安装这个 skill
```

AI 会自动完成下载、安装和配置。

### 2. 提供认证信息

AI 会向你询问以下信息：

**你需要准备：**
- **Cloudflare API Token** — 在 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) 创建，需要 "Cloudflare Pages:Edit" 权限
- **Cloudflare Account ID** — 在 Cloudflare Dashboard 中选择你的域名，右侧栏可见

**两种提供方式：**

**方式 A（推荐）：提前创建 .env 文件**

在 `~/.cf-pages-publisher/.env` 中写入：
```
CLOUDFLARE_API_TOKEN=你的API令牌
CLOUDFLARE_ACCOUNT_ID=你的账户ID
```
Account ID 可选 — 如果你的 Token 有 "Account Settings:Read" 权限，会自动检测。

**方式 B：在对话中直接告诉 AI**

AI 会引导你提供 Project name、API Token 和 Account ID。

### 3. 开始使用

安装完成后，用自然语言发布内容：

```
"将以下内容发布为页面：# 我的文档 ..."
"部署这份文档：./doc.md"
"把这个 Markdown 文件发布为网页"
```

## 工作原理

```
你的内容 → Markdown 转 HTML + SHA-256 内容哈希
    ↓
生成 public/<hash>/index.html
    ↓
通过 Wrangler Direct Upload 部署到 Cloudflare Pages
    ↓
获得永久链接：https://<project>.pages.dev/<hash>/
```

## 项目结构

```
cf-pages-publisher/
├── SKILL.md                       # Skill 指令文件（AI agent 读取）
├── README.md                      # 安装指南（AI agent 读取）
├── USER_GUIDE.md                  # 本文件 — 用户指南
├── setup.mjs                      # 配置脚本（支持非交互模式）
├── agents/openai.yaml             # Codex agent 配置
├── references/troubleshooting.md  # 故障排除
└── templates/                     # 工作空间模板
    ├── package.json
    ├── scripts/publish-doc.mjs    # 核心发布脚本
    └── public/index.html          # 欢迎页占位
```

## 支持的文件格式

| 格式 | 说明 |
|------|------|
| `.md` / `.markdown` | Markdown 转 HTML，支持 GFM |
| `.html` / `.htm` | 直接使用原始 HTML |
| `.txt` | 纯文本，以代码块形式展示 |

## 常见问题

### Token 权限不足

如果 API Token 只有 "Pages:Edit" 权限（没有 "Account Settings:Read"），必须手动提供 Account ID，否则所有命令都会失败。

### 项目名称冲突

Cloudflare Pages 项目名称全局唯一。如果提示 "already taken"，请换一个名字。

### macOS 权限错误

如果 wrangler 遇到 `EPERM` 错误，setup 脚本会自动处理。手动部署时需要设置 `HOME="$(pwd)/.home"`。

### 旧链接是否有效

是的。每次发布只会新增 `public/<hash>/` 目录，不会删除旧内容。所有历史链接永久有效。

## 故障排除

详见 [`references/troubleshooting.md`](references/troubleshooting.md)。

## License

MIT
