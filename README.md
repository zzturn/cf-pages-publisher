# CF Pages Publisher

一个用于 Claude Code / OpenAI Codex 的 skill，将 Markdown/HTML 内容一键发布为带内容哈希永久链接的 Cloudflare Pages 静态网页。

## 特性

- **内容哈希 URL** — 每次发布生成 `https://<project>.pages.dev/<hash>/` 形式的永久链接
- **一键配置** — 交互式 `setup.mjs` 完成所有初始化
- **三种认证方式** — 浏览器登录 / API Token + Account ID / API Token only
- **安全默认值** — Markdown 中的原始 HTML 默认转义
- **增量部署** — 旧哈希目录保留，已有链接永不失效
- **双平台支持** — Claude Code (`~/.claude/skills/`) 和 OpenAI Codex (`~/.codex/skills/`)

## 安装

```bash
# Claude Code
cp -r cf-pages-publisher ~/.claude/skills/

# OpenAI Codex
cp -r cf-pages-publisher ~/.codex/skills/
```

## 首次配置

```bash
node ~/.claude/skills/cf-pages-publisher/setup.mjs
```

交互式脚本会引导你完成：

1. 选择工作区路径（默认 `~/.cf-pages-publisher/`）
2. 输入 Cloudflare Pages 项目名（决定 `https://<name>.pages.dev`）
3. 创建工作区并安装依赖
4. 选择认证方式并验证
5. 创建 CF Pages 项目
6. 部署欢迎页

### 认证方式

| 方式 | 适用场景 | Account ID |
|------|---------|----------|
| 浏览器登录 | 个人桌面 | 自动检测 |
| API Token + Account ID | CI/sandbox、权限受限的 token | 手动输入 |
| API Token only | token 具有广泛权限 | 自动检测 |

> **重要：** 如果 API Token 仅有 "Pages:Edit" 权限，必须选择方式 2 并手动提供 Account ID。

## 使用

安装并配置完成后，直接向 AI 助手发送指令：

```
"将以下内容发布为页面：# 我的标题 ..."
"部署这份文档：./doc.md"
```

AI 助手会自动：读取配置 → 生成 HTML → 计算哈希 → 部署 → 返回永久链接。

### 手动发布

```bash
cd ~/.cf-pages-publisher
set -a && [ -f .env ] && source .env && set +a
npm run publish-doc -- ./doc.md --base https://<project>.pages.dev
npx wrangler pages deploy public --project-name=<project> --commit-dirty=true
```

### publish-doc 选项

| 参数 | 说明 |
|------|------|
| `--base <url>` | Base URL（用于生成永久链接） |
| `--len <N>` | 哈希长度（默认 12，范围 8-64） |
| `--with-time` | 在哈希中包含时间戳（每次运行不同） |
| `--allow-html` | 允许 Markdown 中的原始 HTML（默认禁用） |

## 项目结构

```
cf-pages-publisher/
├── SKILL.md                       # Skill 主文档（AI agent 读取）
├── setup.mjs                      # 交互式配置脚本
├── agents/openai.yaml             # Codex agent 配置
├── references/troubleshooting.md  # 故障排查手册
└── templates/                     # 工作区模板（setup 时复制）
    ├── package.json
    ├── .gitignore
    ├── scripts/publish-doc.mjs    # 核心发布脚本
    └── public/index.html          # 占位首页
```

配置完成后，工作区目录结构：

```
~/.cf-pages-publisher/
├── .env                          # API Token + Account ID
├── config.json                   # 项目名、Base URL、工作区路径
├── package.json                  # 已安装的依赖
├── scripts/
│   └── publish-doc.mjs
└── public/
    ├── index.html                # 自动生成的欢迎页
    ├── assets/
    │   └── markdown.css          # 共享样式
    └── <hash>/                   # 已发布的页面
        └── index.html
```

## 工作原理

```
Markdown 文件
    ↓ publish-doc.mjs（marked 转换 + 内容哈希）
public/<hash>/index.html
    ↓ wrangler pages deploy
https://<project>.pages.dev/<hash>/
```

- `publish-doc.mjs` 使用 `marked` 将 Markdown 转为带样式的 HTML
- 通过 SHA-256 计算内容哈希作为 URL 路径
- `wrangler pages deploy` 上传整个 `public/` 目录到 Cloudflare
- 旧页面不会被删除，已有链接永久有效

## 配置文件

所有用户数据保存在工作区目录中（不在 skill 目录内）：

| 文件 | 说明 |
|------|------|
| `config.json` | 项目名、Base URL、工作区路径 |
| `.env` | API Token 和 Account ID（gitignored） |

## Requirements

- Node.js >= 18
- Cloudflare 账户（免费版即可）

## License

MIT
