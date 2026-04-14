# CF Pages Publisher — AI Agent Installation Guide

> This document is an installation guide for AI agents. When a user asks to install this skill, follow the steps below.
> For the human-facing guide, see [README_USER.md](README_USER.md).

## What This Skill Does

Publishes Markdown/HTML content as styled static pages to Cloudflare Pages via Wrangler Direct Upload. Each page gets a content-hash permalink: `https://<project>.pages.dev/<hash>/`.

## Prerequisites

- Node.js >= 18
- User needs a Cloudflare account (free tier works)

## Step 1: Detect Platform

| Platform | Skill Directory |
|----------|----------------|
| Claude Code | `~/.claude/skills/` |
| OpenAI Codex | `~/.codex/skills/` |

## Step 2: Download & Install

```bash
git clone https://github.com/zzturn/cf-pages-publisher.git /tmp/cf-pages-publisher-install
cp -r /tmp/cf-pages-publisher-install <skill-dir>/cf-pages-publisher
rm -rf /tmp/cf-pages-publisher-install
```

## Step 3: Verify Installation

```bash
ls <skill-dir>/cf-pages-publisher/SKILL.md
```

## Step 4: Collect Configuration from User

> **STOP HERE. Do NOT proceed to Step 5 until you have collected all required information from the user.**
> You MUST ask the user the questions below and WAIT for their response before continuing.

### 4.1 Ask for project name

Ask the user:
> 请为你的 Cloudflare Pages 项目起一个名字（小写字母、数字、连字符，至少3个字符），这将决定你的网址：`https://<名字>.pages.dev`

**Wait for the user's response.** Save the project name.

### 4.2 Ask for authentication credentials

Ask the user:
> 请前往 https://dash.cloudflare.com/profile/api-tokens 创建一个 API Token：
> - 权限设置：Account → Cloudflare Pages → Edit
> - （可选）添加 Account Settings → Read，这样可以自动检测 Account ID
>
> 创建后请提供：
> 1. **API Token** — 创建完成后页面显示的令牌
> 2. **Account ID** — 在 Cloudflare Dashboard 选择你的域名，右侧栏 "API" 区域可见
>
> 或者，你也可以将凭据写入 `~/.cf-pages-publisher/.env` 文件：
> ```
> CLOUDFLARE_API_TOKEN=你的Token
> CLOUDFLARE_ACCOUNT_ID=你的AccountID
> ```

**Wait for the user's response.** Determine which method they chose:

- If they created a `.env` file → use **Method A**
- If they provided token + account ID in conversation → use **Method B-1**
- If they provided only a token → use **Method B-2**

### 4.3 Confirmation

Before proceeding, confirm the collected values with the user:

> 确认配置信息：
> - 项目名称：`<name>`
> - 认证方式：`<method>`
> - 项目 URL：`https://<name>.pages.dev`
>
> 是否开始安装？

**Wait for user confirmation before proceeding to Step 5.**

## Step 5: Run Setup

> **Do NOT execute this step until Step 4 is fully completed and the user has confirmed.**

Run ONE of the following commands based on the method chosen in Step 4:

```bash
# Method A: user created .env file
node <skill-dir>/cf-pages-publisher/setup.mjs --project <name> --auth env

# Method B-1: user provided token + account ID
node <skill-dir>/cf-pages-publisher/setup.mjs --project <name> --auth token --token <TOKEN> --account-id <ID>

# Method B-2: user provided token only
node <skill-dir>/cf-pages-publisher/setup.mjs --project <name> --auth token-only --token <TOKEN>

# Optional: custom workspace (add to any method)
node <skill-dir>/cf-pages-publisher/setup.mjs --project <name> --workspace <path> --auth env
```

Replace `<skill-dir>` with the actual path detected in Step 1. Replace `<name>`, `<TOKEN>`, `<ID>`, `<path>` with the actual values collected in Step 4.

Exit code 0 = success. On failure, read stdout for error details and report to user.

## Step 6: Confirm to User

After successful setup:

> 安装完成！项目 URL：`https://<name>.pages.dev`
> 你现在可以让我发布页面了。例如："将以下内容发布为页面：# 我的文档 ..."

## After Installation

The skill is now active. When user asks to publish content, follow the instructions in `SKILL.md` (loaded automatically).
