# CF Pages Publisher — AI Agent Installation Guide

> This document is an installation guide for AI agents. When a user asks to install this skill, follow the steps below.
> For the human-facing guide, see [README_USER.md](README_USER.md).

## ⚠️ CRITICAL RULES

1. **NEVER ask the user to run scripts manually.** You (the AI agent) must execute all commands yourself via Bash tool.
2. **NEVER run `setup.mjs` without CLI arguments.** The script supports interactive mode, but you CANNOT provide stdin interaction. Always use the non-interactive CLI mode with `--auth` flags.
3. **ALWAYS collect credentials from the user FIRST, then run the setup script yourself with those credentials as arguments.**

## What This Skill Does

Publishes Markdown/HTML content as styled static pages to Cloudflare Pages via Wrangler Direct Upload. Each page gets a content-hash permalink: `https://<project>.pages.dev/<hash>/`.

## Prerequisites

- Node.js >= 18
- User needs a Cloudflare account (free tier works)

## Step 1: Detect Platform & Install

| Platform | Skill Directory |
|----------|----------------|
| Claude Code | `~/.claude/skills/` |
| OpenAI Codex | `~/.codex/skills/` |

```bash
git clone https://github.com/zzturn/cf-pages-publisher.git /tmp/cf-pages-publisher-install
cp -r /tmp/cf-pages-publisher-install <skill-dir>/cf-pages-publisher
rm -rf /tmp/cf-pages-publisher-install
```

Verify:
```bash
ls <skill-dir>/cf-pages-publisher/SKILL.md
```

## Step 2: Collect Configuration from User

> **STOP. Do NOT run any setup command yet.**
> You MUST ask the user the questions below and WAIT for their response.

### 2.1 Ask for project name

Say to the user:
> 请为你的 Cloudflare Pages 项目起一个名字（小写字母、数字、连字符，至少3个字符），这将决定你的网址：`https://<名字>.pages.dev`

⏸ **Wait for response.** Save the project name.

### 2.2 Ask for credentials

Say to the user:
> 请前往 https://dash.cloudflare.com/profile/api-tokens 创建一个 API Token：
> - 权限：Account → Cloudflare Pages → Edit
> - （可选）添加 Account Settings → Read，可自动检测 Account ID
>
> 然后请提供：
> 1. **API Token**
> 2. **Account ID**（Dashboard → 选择域名 → 右侧栏 "API" 区域）
>
> 或者你也可以把凭据写入文件 `~/.cf-pages-publisher/.env`：
> ```
> CLOUDFLARE_API_TOKEN=你的Token
> CLOUDFLARE_ACCOUNT_ID=你的AccountID
> ```

⏸ **Wait for response.** Determine the method:
- User created `.env` file → **Method A** (`--auth env`)
- User provided token + account ID → **Method B** (`--auth token --token ... --account-id ...`)
- User provided token only → **Method C** (`--auth token-only --token ...`)

### 2.3 Confirm

Say to the user:
> 确认配置：项目名称 `<name>`，认证方式 `<method>`，URL：`https://<name>.pages.dev`。是否开始配置？

⏸ **Wait for confirmation.**

## Step 3: Run Setup Yourself

> **YOU run this command via Bash tool. Do NOT ask the user to run it.**

Based on the method from Step 2, execute ONE of:

```bash
# Method A: user created .env file
node <skill-dir>/cf-pages-publisher/setup.mjs --project <name> --auth env

# Method B: user provided token + account ID
node <skill-dir>/cf-pages-publisher/setup.mjs --project <name> --auth token --token <TOKEN> --account-id <ID>

# Method C: user provided token only
node <skill-dir>/cf-pages-publisher/setup.mjs --project <name> --auth token-only --token <TOKEN>

# Optional: custom workspace (add --workspace <path> to any method)
node <skill-dir>/cf-pages-publisher/setup.mjs --project <name> --workspace <path> --auth env
```

Replace `<skill-dir>` with actual path from Step 1. Replace `<name>`, `<TOKEN>`, `<ID>` with actual values from Step 2.

Exit code 0 = success. On failure, read stdout for error details.

## Step 4: Confirm to User

After successful setup, say:

> 安装完成！项目 URL：`https://<name>.pages.dev`
> 你现在可以让我发布页面了。例如："将以下内容发布为页面：# 我的文档 ..."

## After Installation

The skill is now active. When user asks to publish content, follow the instructions in `SKILL.md` (loaded automatically).
