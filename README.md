# CF Pages Publisher

一个 AI Skill，让 Claude Code / OpenAI Codex 自动将 Markdown/HTML 内容发布为带内容哈希永久链接的 Cloudflare Pages 静态网页。

## 特性

- **内容哈希 URL** — 每次发布自动生成 `https://<project>.pages.dev/<hash>/` 形式的永久链接
- **一键配置** — AI 助手自动完成所有初始化和认证
- **三种认证方式** — 浏览器登录 / API Token + Account ID / API Token only
- **安全默认值** — Markdown 中的原始 HTML 默认转义
- **增量部署** — 旧哈希目录保留，已有链接永不失效
- **双平台支持** — Claude Code (`~/.claude/skills/`) 和 OpenAI Codex (`~/.codex/skills/`)

## 安装

将整个目录复制到对应平台的 skills 目录下即可：

```
# Claude Code
cp -r cf-pages-publisher ~/.claude/skills/

# OpenAI Codex
cp -r cf-pages-publisher ~/.codex/skills/
```

安装完成后，AI 助手会在首次使用时自动引导你完成 Cloudflare Pages 的配置，包括：
- 选择工作区路径
- 输入项目名（决定 `https://<name>.pages.dev`）
- 选择认证方式并验证
- 创建项目并部署欢迎页

## 使用

安装后直接向 AI 助手发送指令，一切由 AI 自动完成：

```
"将以下内容发布为页面：# 我的标题 ..."
"部署这份文档：./doc.md"
"把这个 Markdown 文件发布为网页"
```

AI 助手会自动：读取配置 → 生成 HTML → 计算哈希 → 部署 → 返回永久链接。

### 认证方式

首次使用时，AI 助手会让你选择认证方式：

| 方式 | 适用场景 | Account ID |
|------|---------|------------|
| 浏览器登录 | 个人桌面 | 自动检测 |
| API Token + Account ID | CI/sandbox、权限受限的 token | 需手动提供 |
| API Token only | token 具有广泛权限 | 自动检测 |

> **重要：** 如果 API Token 仅有 "Pages:Edit" 权限，需选择方式 2 并提供 Account ID。

## 工作原理

```
用户指令："发布这个内容"
    ↓ AI 助手自动执行
Markdown → HTML 转换 + SHA-256 内容哈希
    ↓
public/<hash>/index.html
    ↓ Wrangler Direct Upload
https://<project>.pages.dev/<hash>/
```

- AI 调用 `publish-doc` 将 Markdown 转为带样式的 HTML
- 通过 SHA-256 计算内容哈希作为 URL 路径（相同内容 = 相同 URL）
- 通过 Wrangler 上传整个 `public/` 目录到 Cloudflare
- 旧页面不会被删除，已有链接永久有效

## 项目结构

```
cf-pages-publisher/
├── SKILL.md                       # Skill 主文档（AI agent 读取）
├── setup.mjs                      # 配置脚本（AI 自动调用）
├── agents/openai.yaml             # Codex agent 配置
├── references/troubleshooting.md  # 故障排查（AI 参考）
└── templates/                     # 工作区模板
    ├── package.json
    ├── .gitignore
    ├── scripts/publish-doc.mjs    # 核心发布脚本
    └── public/index.html          # 占位首页
```

## publish-doc 选项

AI 助手可根据需求使用以下参数：

| 参数 | 说明 |
|------|------|
| `--base <url>` | Base URL（用于生成永久链接） |
| `--len <N>` | 哈希长度（默认 12，范围 8-64） |
| `--with-time` | 在哈希中包含时间戳（每次运行不同） |
| `--allow-html` | 允许 Markdown 中的原始 HTML（默认禁用） |

## Requirements

- Node.js >= 18
- Cloudflare 账户（免费版即可）

## License

MIT
