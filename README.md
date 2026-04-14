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
git clone https://github.com/zzturn/cf-pages-publisher.git /tmp/cf-pages-publisher-install
cp -r /tmp/cf-pages-publisher-install ~/.claude/skills/cf-pages-publisher
rm -rf /tmp/cf-pages-publisher-install
```

### Step 3: Verify Installation

```bash
ls ~/.claude/skills/cf-pages-publisher/SKILL.md
```

### Step 4: Collect Configuration from User

Before running setup, ask the user for these values through natural conversation:

1. **Project name** — lowercase alphanumeric with hyphens, determines `https://<name>.pages.dev`
2. **Authentication method:**
   - **API Token + Account ID** (recommended) — ask for both values
   - **API Token only** — only ask for the token (needs broad permissions)
   - **Browser login** — no credentials needed (user must be at a desktop)

> **Important:** If the user's API Token only has "Pages:Edit" permission, they MUST provide the Account ID. Without it, all commands will fail.

### Step 5: Run Setup (non-interactive)

Pass all collected values as CLI arguments — no stdin interaction needed:

```bash
# With API Token + Account ID (recommended)
node ~/.claude/skills/cf-pages-publisher/setup.mjs \
  --project <name> \
  --auth token \
  --token <api-token> \
  --account-id <account-id>

# With API Token only (needs broad permissions)
node ~/.claude/skills/cf-pages-publisher/setup.mjs \
  --project <name> \
  --auth token-only \
  --token <api-token>

# Optional: custom workspace path
node ~/.claude/skills/cf-pages-publisher/setup.mjs \
  --project <name> \
  --auth token \
  --token <api-token> \
  --account-id <account-id> \
  --workspace /path/to/workspace
```

The script exits with code 0 on success, non-zero on failure. Check stdout for the result.

### Step 6: Confirm to User

After successful setup, tell the user:

> Skill installed and configured! Project URL: `https://<name>.pages.dev`
> You can now ask me to publish pages. Example: "将以下内容发布为页面：# 我的文档 ..."

---

## Usage

After installation, the user can publish content with natural language:

```
"将以下内容发布为页面：# 我的标题 ..."
"部署这份文档：./doc.md"
"把这个 Markdown 文件发布为网页"
```

### Publishing Workflow (for AI Agents)

```bash
# 1. Read config from workspace
cat ~/.cf-pages-publisher/config.json

# 2. Save user content to a .md file in the workspace

# 3. Convert + deploy
cd ~/.cf-pages-publisher
set -a && [ -f .env ] && source .env && set +a
npm run publish-doc -- <filename.md> --base <baseUrl>
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

## Project Structure

```
cf-pages-publisher/
├── SKILL.md                       # Skill manifest (read by AI agent)
├── setup.mjs                      # Setup script (supports CLI args)
├── agents/openai.yaml             # Codex agent config
├── references/troubleshooting.md  # Troubleshooting guide
└── templates/                     # Workspace template
    ├── package.json
    ├── .gitignore
    ├── scripts/publish-doc.mjs    # Core publish script
    └── public/index.html          # Placeholder homepage
```

## Safety Rules

- **DO NOT modify `public/index.html`** — it is the auto-generated welcome page
- **DO NOT delete old `public/<hash>/` directories** — old links must stay alive
- **HTML is escaped by default** — only use `--allow-html` when explicitly requested

## Troubleshooting

See [`references/troubleshooting.md`](references/troubleshooting.md) for detailed debugging steps.

## License

MIT
