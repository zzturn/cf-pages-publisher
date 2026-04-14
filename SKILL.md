---
name: cf-pages-publisher
description: >
  Publish Markdown/HTML as a styled static page to Cloudflare Pages via Wrangler
  Direct Upload. Produces a content-hash permalink. TRIGGER when user wants to
  publish content as a web page, get a public URL for a document, or deploy a
  page without Git.
---

## Trigger

User asks to publish, deploy, or share content as a web page. Examples:
- "把这个内容发布为网页"
- "Publish this as a page"
- "给我一个永久链接"
- "将这个 Markdown 文件部署为网页"

## Setup (first-time only)

If `<workspace>/config.json` does not exist, run setup before publishing.

### 1. Collect from user

Ask the user through conversation:
- **Project name** — lowercase alphanumeric + hyphens, min 3 chars, determines `https://<name>.pages.dev`
- **Cloudflare API Token** — from https://dash.cloudflare.com/profile/api-tokens (needs "Cloudflare Pages:Edit")
- **Cloudflare Account ID** — required if token lacks "Account Settings:Read" permission. Find at: Cloudflare Dashboard → select domain → right sidebar.

### 2. Run setup script

```bash
# With token + account ID (recommended)
node <skill-dir>/setup.mjs --project <name> --auth token --token <TOKEN> --account-id <ID>

# With token only (needs Account Settings:Read permission)
node <skill-dir>/setup.mjs --project <name> --auth token-only --token <TOKEN>

# Optional: custom workspace path
node <skill-dir>/setup.mjs --project <name> --workspace <path> --auth token --token <TOKEN> --account-id <ID>
```

Default workspace: `~/.cf-pages-publisher/`

Exit code 0 = success. On failure, read stdout for error details.

### 3. Verify

```bash
cat <workspace>/config.json
```

Must contain `projectName`, `baseUrl`, `workspacePath`. If missing, setup failed — check errors and retry.

## Publish

### 1. Read config

```bash
cat <workspace>/config.json
```

### 2. Prepare content

If user provides text (not a file), write it to a `.md` file inside `<workspace>/`:
```bash
cat > <workspace>/<filename>.md << 'CONTENT'
<user content>
CONTENT
```

Ensure the content starts with a `# Title` heading.

### 3. Convert + Deploy

```bash
cd <workspace>
set -a && [ -f .env ] && source .env && set +a
npm run publish-doc -- <filename> --base <baseUrl>
npx wrangler pages deploy public --project-name=<projectName> --commit-dirty=true
```

### 4. Return URL

The last command outputs the deployment URL. Reply to the user with:
`<baseUrl>/<hash>/`

## publish-doc flags

| Flag | Effect |
|------|--------|
| `--base <url>` | Base URL for permalink (required) |
| `--len <N>` | Hash length, default 12, range 8-64 |
| `--with-time` | Include timestamp in hash (changes on each run) |
| `--allow-html` | Allow raw HTML in Markdown. ONLY use when user explicitly requests it |

## Safety rules

- NEVER modify `<workspace>/public/index.html` — it is the auto-generated welcome page
- NEVER delete any `<workspace>/public/<hash>/` directory — old links must stay alive
- NEVER clean or overwrite the `public/` directory before deploy — always append only
- NEVER use `--allow-html` unless the user explicitly requests it — HTML is escaped by default for safety

## Error recovery

| Error | Fix |
|-------|-----|
| `EPERM` on macOS | Set `HOME="$(pwd)/.home"` before wrangler commands |
| `ENOTFOUND registry.npmjs.org` | Re-run with network access |
| "No such project" | Project not created — re-run setup |
| "already taken" | Project name is globally unique — ask user for a different name |
| Token verification failed | Token may lack Account Settings:Read — use `--auth token --account-id <ID>` |
| Deploy fails | Credentials in `.env` may be wrong — verify `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` |

For more details, read `references/troubleshooting.md`.
