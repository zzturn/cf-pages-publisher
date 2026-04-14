# Troubleshooting

## Setup Issues

### `wrangler login` fails with `listen EPERM`

The login callback needs to open a local port. If running in a sandboxed environment:

1. Re-run with escalated permissions (allow network/port access).
2. Or use an API token instead:
   ```bash
   export CLOUDFLARE_API_TOKEN="<your-token>"
   ```
   Create a token at: https://dash.cloudflare.com/profile/api-tokens
   Required permissions: **Cloudflare Pages** (Edit).

### `npm install` fails with `ENOTFOUND registry.npmjs.org`

Network is sandboxed. Re-run with network access allowed.

### Project creation fails with "already taken"

The project name is globally unique across all Cloudflare users. Pick a different name:

```bash
node setup.mjs   # Enter a different project name
```

Or delete the existing config and re-run:

```bash
rm config.json
node setup.mjs
```

## Deployment Issues

### EPERM errors when running wrangler

On macOS, wrangler may try to write to `~/Library/Preferences/.wrangler/`. Workaround:

```bash
cd <workspace>
HOME="$(pwd)/.home" npx wrangler pages deploy public --project-name=<name> --commit-dirty=true
```

The setup script creates `.home/` and `.npm-cache/` directories for this purpose.

### "No such project" error

Either:
1. The project hasn't been created yet — re-run `setup.mjs`.
2. The project name in `config.json` doesn't match — edit it or re-run setup.

### Old pages disappear after deploy

Make sure you are NOT cleaning the `public/` directory between deploys. Each publish adds a new `public/<hash>/` folder; deploy uploads the entire `public/` directory.

```bash
# WRONG — deletes old pages
rm -rf public/* && npm run publish-doc -- ...

# CORRECT — only adds new pages
npm run publish-doc -- ...
```

## Reconfiguration

To change project name, workspace path, or re-authenticate:

```bash
cd <skill-directory>
rm config.json
node setup.mjs
```

The workspace is preserved. Only the config is reset.

## Manual Setup

If the interactive setup doesn't work, you can configure manually:

1. Create workspace:
   ```bash
   mkdir -p ~/.cf-pages-publisher
   cp -r <skill-dir>/templates/* ~/.cf-pages-publisher/
   cd ~/.cf-pages-publisher && npm install
   ```

2. Authenticate wrangler:
   ```bash
   npx wrangler login
   ```
   Or set up API token in `.env`:
   ```bash
   # Get your Account ID from: npx wrangler whoami
   cat > ~/.cf-pages-publisher/.env << 'EOF'
   CLOUDFLARE_API_TOKEN=<your-token>
   CLOUDFLARE_ACCOUNT_ID=<your-account-id>
   EOF
   ```

3. Create project:
   ```bash
   npx wrangler pages project create <name> --production-branch=main
   ```

4. Create `config.json` in the workspace:
   ```json
   {
     "projectName": "<name>",
     "baseUrl": "https://<name>.pages.dev",
     "workspacePath": "~/.cf-pages-publisher"
   }
   ```
