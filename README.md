# CF Pages Publisher

一个 AI Skill，让 Claude Code / OpenAI Codex 自动将 Markdown/HTML 内容发布为带内容哈希永久链接的 Cloudflare Pages 静态网页。

## 特性

- **内容哈希 URL** — 每次发布自动生成 `https://<project>.pages.dev/<hash>/` 形式的永久链接
- **一键配置** — AI 助手自动完成所有初始化和认证
- **三种认证方式** — 浏览器登录 / API Token + Account ID / API Token only
- **安全默认值** — Markdown 中的原始 HTML 默认转义
- **增量部署** — 旧哈希目录保留，已有链接永不失效
- **双平台支持** — Claude Code (`~/.claude/skills/`) 和 OpenAI Codex (`~/.codex/skills/`)

---

## Installation (for AI Agents)

> This section is written for AI agents (Claude Code, Codex, etc.) to follow when a user asks to install this skill.

### Prerequisites

- Node.js >= 18
- A Cloudflare account (free tier works)
- Either a Cloudflare API Token (recommended) or a browser for `wrangler login`

### Step 1: Detect Platform

Determine the skill installation directory based on the current AI platform:

| Platform | Skill Directory |
|----------|----------------|
| Claude Code | `~/.claude/skills/` |
| OpenAI Codex | `~/.codex/skills/` |

### Step 2: Download & Install

```bash
# Clone to a temp directory
git clone https://github.com/zzturn/cf-pages-publisher.git /tmp/cf-pages-publisher-install

# Copy to skill directory (adjust path for your platform)
cp -r /tmp/cf-pages-publisher-install ~/.claude/skills/cf-pages-publisher

# Clean up
rm -rf /tmp/cf-pages-publisher-install
```

### Step 3: Verify Installation

Confirm the skill is correctly installed:

```bash
ls ~/.claude/skills/cf-pages-publisher/SKILL.md
# Should output the path — if it exists, installation succeeded
```

### Step 4: First-Time Setup

Run the interactive setup script. This requires user interaction (choosing auth method, entering credentials):

```bash
node ~/.claude/skills/cf-pages-publisher/setup.mjs
```

The setup script will guide the user through:

1. **Workspace path** — where to store published pages (default `~/.cf-pages-publisher/`)
2. **Project name** — determines the public URL (`https://<name>.pages.dev`)
3. **Authentication** — three options:

| # | Method | When to use | Account ID |
|---|--------|-------------|------------|
| 1 | Browser login | Personal desktop | Auto-detected |
| 2 | API Token + Account ID | CI/sandbox, scoped tokens | User must provide |
| 3 | API Token only | Broad permissions | Auto-detected via whoami |

> **Note for agents:** If the user provides an API Token, ask whether they also have an Account ID. Scoped tokens (Pages:Edit only) **require** the Account ID — without it, all wrangler commands will fail.

4. **Project creation** — automatically creates the CF Pages project
5. **Welcome page** — deploys a Chinese-language confirmation page

After setup, `config.json` and `.env` are saved in the **workspace directory** (not the skill directory).

### Step 5: Confirm to User

After installation and setup, tell the user:

> Skill installed and configured! You can now ask me to publish pages.
> Example: "将以下内容发布为页面：# 我的文档 ..."

---

## Usage

After installation, the user can publish content with natural language:

```
"将以下内容发布为页面：# 我的标题 ..."
"部署这份文档：./doc.md"
"把这个 Markdown 文件发布为网页"
```

### Publishing Workflow (for AI Agents)

When the user asks to publish content, follow these steps:

```bash
# 1. Read config from workspace
cat ~/.cf-pages-publisher/config.json

# 2. Save user content to a .md file in the workspace
# (create the file with the user's content)

# 3. Convert Markdown to HTML with content hash
cd ~/.cf-pages-publisher
set -a && [ -f .env ] && source .env && set +a
npm run publish-doc -- <filename.md> --base <baseUrl>

# 4. Deploy to Cloudflare Pages
npx wrangler pages deploy public --project-name=<projectName> --commit-dirty=true
```

Reply with the final URL: `<baseUrl>/<hash>/`

### publish-doc Options

| Flag | Description |
|------|-------------|
| `--base <url>` | Base URL for the permalink (required) |
| `--len <N>` | Hash length (default 12, range 8–64) |
| `--with-time` | Include timestamp in hash (changes on each run) |
| `--allow-html` | Allow raw HTML in Markdown (disabled by default) |

---

## How It Works

```
User: "发布这个内容"
    ↓ AI agent executes automatically
Markdown → HTML conversion + SHA-256 content hash
    ↓
public/<hash>/index.html
    ↓ Wrangler Direct Upload
https://<project>.pages.dev/<hash>/
```

- The AI agent calls `publish-doc` to convert Markdown to styled HTML
- SHA-256 content hash serves as the URL path (same content = same URL)
- Wrangler uploads the entire `public/` directory to Cloudflare
- Old pages are never deleted — existing links remain valid permanently

## Project Structure

```
cf-pages-publisher/
├── SKILL.md                       # Skill manifest (read by AI agent)
├── setup.mjs                      # Setup script (called by AI agent)
├── agents/openai.yaml             # Codex agent config
├── references/troubleshooting.md  # Troubleshooting guide (for AI agent)
└── templates/                     # Workspace template (copied during setup)
    ├── package.json
    ├── .gitignore
    ├── scripts/publish-doc.mjs    # Core publish script
    └── public/index.html          # Placeholder homepage
```

## Safety Rules

- **DO NOT modify `public/index.html`** — it is the auto-generated welcome page, not part of the publish flow
- **DO NOT delete old `public/<hash>/` directories** — old links must stay alive
- **HTML is escaped by default** — only use `--allow-html` when the user explicitly requests it

## Troubleshooting

See [`references/troubleshooting.md`](references/troubleshooting.md) for detailed debugging steps. The AI agent should consult this file when encountering errors.

## License

MIT
