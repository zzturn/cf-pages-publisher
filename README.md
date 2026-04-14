# CF Pages Publisher — AI Agent Installation Guide

> This document is an installation guide for AI agents. When a user asks to install this skill, follow the steps below.

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

Ask the user for a **project name** through conversation (lowercase alphanumeric + hyphens, min 3 chars, determines `https://<name>.pages.dev`).

Then choose ONE authentication method:

**Method A — .env file (preferred):**
Ask user to create `~/.cf-pages-publisher/.env` (or custom workspace path):
```
CLOUDFLARE_API_TOKEN=<token>
CLOUDFLARE_ACCOUNT_ID=<account-id>
```
Account ID is optional — auto-detected if token has Account Settings:Read permission.

**Method B — credentials in conversation:**
- Ask for Cloudflare API Token (from https://dash.cloudflare.com/profile/api-tokens, needs "Pages:Edit")
- Ask for Account ID (required if token lacks "Account Settings:Read"). Found at: Cloudflare Dashboard → select domain → right sidebar.

## Step 5: Run Setup

```bash
# Method A: read from .env file (preferred)
node <skill-dir>/cf-pages-publisher/setup.mjs --project <name> --auth env

# Method B-1: token + account ID
node <skill-dir>/cf-pages-publisher/setup.mjs --project <name> --auth token --token <TOKEN> --account-id <ID>

# Method B-2: token only (needs Account Settings:Read)
node <skill-dir>/cf-pages-publisher/setup.mjs --project <name> --auth token-only --token <TOKEN>

# Optional: custom workspace (any method)
node <skill-dir>/cf-pages-publisher/setup.mjs --project <name> --workspace <path> --auth env
```

Exit code 0 = success. On failure, read stdout for error details.

## Step 6: Confirm to User

After successful setup:

> Skill installed and configured! Project URL: `https://<name>.pages.dev`
> You can now ask me to publish pages. Example: "将以下内容发布为页面：# 我的文档 ..."

## After Installation

The skill is now active. When user asks to publish content, follow the instructions in `SKILL.md` (loaded automatically).
