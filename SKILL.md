---
name: cf-pages-publisher
description: >
  Publish Markdown/HTML as a styled static page and deploy to Cloudflare Pages via
  Wrangler Direct Upload, producing a content-hash permalink. Use when a user wants
  a public URL for a chat-generated document, wants one-link-per-output (hash URL),
  or wants CLI deploy without Git integration. Supports both interactive (human)
  and non-interactive (AI agent) setup modes.
---

# CF Pages Publisher

## Prerequisites

- Node.js >= 18
- A Cloudflare account (free tier works)
- Either a **Cloudflare API Token** (recommended) or a browser for `wrangler login`

## First-Time Setup

### Non-Interactive Mode (for AI Agents)

When running as an AI agent, use CLI arguments instead of interactive prompts:

```bash
# Method 1: Token + Account ID (recommended for scoped tokens)
node <skill-dir>/setup.mjs --project <name> --auth token --token <CLOUDFLARE_API_TOKEN> --account-id <CLOUDFLARE_ACCOUNT_ID>

# Method 2: Token only (token must have Account Settings:Read permission)
node <skill-dir>/setup.mjs --project <name> --auth token-only --token <CLOUDFLARE_API_TOKEN>

# Optional: specify custom workspace
node <skill-dir>/setup.mjs --project <name> --workspace <path> --auth token --token <TOKEN> --account-id <ID>
```

**Before running setup, collect from the user:**
1. Cloudflare Pages project name (lowercase, hyphens allowed, min 3 chars)
2. Cloudflare API Token (from https://dash.cloudflare.com/profile/api-tokens)
3. Cloudflare Account ID (if using scoped tokens without Account Settings:Read)

The script will create workspace, install deps, authenticate, create the CF Pages project, and deploy a welcome page — all in one run.

### Interactive Mode (for Humans)

Run without arguments for guided setup:

```bash
node <skill-dir>/setup.mjs
```

The script will:

1. Ask for workspace path (default `~/.cf-pages-publisher/`).
2. Ask for a Cloudflare Pages **project name** (determines `https://<name>.pages.dev`).
3. Create workspace from templates and install dependencies.
4. Authenticate with Cloudflare (API Token or browser login).
5. Create the CF Pages project (if it doesn't exist).
6. Save `config.json` in the workspace directory.

### Authentication

| Method | CLI flag | When to use | Account ID |
|--------|----------|-------------|------------|
| **Token + Account ID** | `--auth token` | Scoped tokens, CI/CD, AI agents | **Required** via `--account-id` |
| **Token only** | `--auth token-only` | Token has broad permissions | Auto-detected via `wrangler whoami` |
| **Browser login** | _(interactive only)_ | Personal desktop, has browser access | Auto-detected |

**Important:** If your API token only has "Cloudflare Pages:Edit" permission (no Account Settings:Read), you MUST provide the Account ID. Without it, wrangler cannot determine which account to use and all commands will fail.

Find your Account ID: Cloudflare Dashboard → select your domain → right sidebar.

Credentials are saved to `<workspace>/.env` (gitignored) so they persist across sessions.

After setup completes, you are ready to publish.

## Configuration (`config.json`)

Saved automatically by `setup.mjs` inside the workspace directory. Edit manually to change values.

```json
{
  "projectName": "my-docs",
  "baseUrl": "https://my-docs.pages.dev",
  "workspacePath": "~/.cf-pages-publisher"
}
```

To reconfigure: delete the workspace's `config.json` and re-run `setup.mjs` (interactive) or run with `--project` flag (non-interactive).

## Publishing Workflow

### From a Markdown file

```bash
cd <workspacePath>
set -a && [ -f .env ] && source .env && set +a
npm run publish-doc -- <input.(md|html|txt)> --base <baseUrl>
npx wrangler pages deploy public --project-name=<projectName> --commit-dirty=true
```

### From chat text (no file)

1. Create a new `.md` file inside `<workspacePath>/` (include a `# Title` heading).
2. Load credentials: `set -a && [ -f .env ] && source .env && set +a`
3. Run `npm run publish-doc -- <file> --base <baseUrl>`.
4. Run `npx wrangler pages deploy public --project-name=<projectName> --commit-dirty=true`.
5. Reply with the final URL: `<baseUrl>/<hash>/`.

## publish-doc Options

| Flag | Description |
|------|-------------|
| `--base <url>` | Base URL for the printed permalink |
| `--len <N>` | Hash length (default 12, range 8–64) |
| `--with-time` | Include timestamp in hash (changes on each run) |
| `--allow-html` | Allow raw HTML inside Markdown (disabled by default for safety) |

## Safety & Gotchas

- **DO NOT modify `public/index.html`**: this is the auto-generated welcome/landing page created during setup. Never edit, rebuild, or replace it — it serves as the site root and is not part of the publish flow.
- **Old URLs stay alive**: do not delete old `public/<hash>/` folders before deploying.
- **HTML is escaped by default**: raw HTML in Markdown is escaped unless `--allow-html` is passed. Only use `--allow-html` when the user explicitly requests it.
- **EPERM errors on macOS**: if wrangler fails with permission errors, set `HOME="$(pwd)/.home"` before running. The setup script handles this automatically.
- **Network in sandbox**: if `npm install` fails with `ENOTFOUND`, re-run with escalated permissions.

## Reference

- Read `references/troubleshooting.md` for detailed debugging steps.
- The workspace template lives in `templates/` inside this skill directory.
