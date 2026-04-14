#!/usr/bin/env node
// @ts-check
/**
 * cf-pages-publisher — Interactive one-time setup.
 *
 * Creates a workspace, installs deps, authenticates wrangler,
 * creates (or reuses) a CF Pages project, and writes config.json.
 *
 * Usage:  node setup.mjs
 */

import { createInterface } from "node:readline/promises";
import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  cpSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

// ── Paths ────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_DIR = __dirname;
const TEMPLATES = resolve(SKILL_DIR, "templates");
const CONFIG_FILENAME = "config.json";
const DEFAULT_WORKSPACE = resolve(homedir(), ".cf-pages-publisher");

// ── Helpers ──────────────────────────────────────────────
const rl = createInterface({ input: process.stdin, output: process.stdout });

function log(msg) {
  // eslint-disable-next-line no-console
  console.log(msg);
}

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: "utf8", stdio: "pipe", ...opts }).trim();
}

/** Build env object from .env file for wrangler commands. */
function getEnvFromFile(envPath) {
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, "utf8");
  const token = content.match(/CLOUDFLARE_API_TOKEN=(.+)/)?.[1]?.trim();
  const accountId = content.match(/CLOUDFLARE_ACCOUNT_ID=(.+)/)?.[1]?.trim();
  const env = {};
  if (token) env.CLOUDFLARE_API_TOKEN = token;
  if (accountId) env.CLOUDFLARE_ACCOUNT_ID = accountId;
  return env;
}

/** Build env object from explicit values. */
function buildEnv(token, accountId) {
  const env = { CLOUDFLARE_API_TOKEN: token };
  if (accountId) env.CLOUDFLARE_ACCOUNT_ID = accountId;
  return env;
}

/** Run a command with merged env (process.env + extra env vars). */
function runWithEnv(cmd, extraEnv, opts = {}) {
  return run(cmd, { ...opts, env: { ...process.env, ...extraEnv } });
}

/** Read a key from .env file. */
function getEnvValue(envPath, key) {
  if (!existsSync(envPath)) return null;
  return readFileSync(envPath, "utf8").match(new RegExp(`${key}=(.+)`))?.[1]?.trim() ?? null;
}

/** Upsert a key=value line in .env file. */
function upsertEnvLine(envPath, key, value) {
  const content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const updated = content.includes(`${key}=`)
    ? content.replace(new RegExp(`${key}=.*`), `${key}=${value}`)
    : content.trimEnd() + `\n${key}=${value}\n`;
  writeFileSync(envPath, updated, "utf8");
}

function validateProjectName(name) {
  if (!name || name.length < 3) return "Project name must be at least 3 characters.";
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name)) {
    return "Project name must be lowercase alphanumeric with hyphens (no leading/trailing hyphens).";
  }
  return null;
}

function generateWelcomePage({ projectName, baseUrl }) {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CF Pages Publisher — 已就绪</title>
    <style>
      :root { color-scheme: light dark; --page-w: 720px; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font: 16px/1.7 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        background: radial-gradient(1000px 600px at 20% 0%, rgba(120,120,255,0.12), transparent 50%),
                    radial-gradient(1000px 600px at 80% 0%, rgba(120,255,180,0.10), transparent 55%),
                    #0b0c0f;
        color: #e8e8ea;
      }
      @media (prefers-color-scheme: light) {
        body {
          background: radial-gradient(1000px 600px at 20% 0%, rgba(60,90,255,0.10), transparent 55%),
                      radial-gradient(1000px 600px at 80% 0%, rgba(0,160,80,0.10), transparent 55%),
                      #ffffff;
          color: #0b0c0f;
        }
      }
      .page { max-width: var(--page-w); margin: 0 auto; padding: 48px 18px 64px; }
      .card {
        border-radius: 16px;
        border: 1px solid rgba(127,127,127,0.18);
        background: rgba(127,127,127,0.06);
        padding: 32px 28px;
        backdrop-filter: blur(6px);
      }
      h1 { font-size: 1.8em; line-height: 1.2; margin: 0 0 0.3em; }
      .badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 8px;
        font-size: 0.82em;
        font-weight: 600;
        background: rgba(52,211,153,0.15);
        color: #34d399;
        border: 1px solid rgba(52,211,153,0.25);
        vertical-align: middle;
        margin-left: 8px;
      }
      @media (prefers-color-scheme: light) {
        .badge { background: rgba(16,150,80,0.12); color: #0a7a42; border-color: rgba(16,150,80,0.25); }
      }
      .meta { color: rgba(127,127,127,0.7); font-size: 0.88em; margin: 0.3em 0 1.2em; }
      h2 { font-size: 1.25em; margin: 1.4em 0 0.5em; line-height: 1.3; }
      p { margin: 0.6em 0; }
      ul, ol { padding-left: 1.2em; margin: 0.5em 0; }
      li { margin: 0.3em 0; }
      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.92em;
        padding: 0.12em 0.32em;
        border-radius: 6px;
        background: rgba(127,127,127,0.12);
        border: 1px solid rgba(127,127,127,0.15);
      }
      pre {
        overflow-x: auto;
        padding: 14px;
        border-radius: 12px;
        background: rgba(127,127,127,0.08);
        border: 1px solid rgba(127,127,127,0.14);
        font-size: 0.9em;
        line-height: 1.5;
      }
      pre code { background: transparent; border: 0; padding: 0; }
      hr { border: 0; border-top: 1px solid rgba(127,127,127,0.22); margin: 1.4em 0; }
      a { color: inherit; text-decoration: underline; text-underline-offset: 3px; }
      a:hover { opacity: 0.85; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="card">
        <h1>CF Pages Publisher <span class="badge">已就绪</span></h1>
        <p class="meta">项目：${projectName} · 配置时间：${now}</p>

        <p>此页面确认你的 Cloudflare Pages 发布服务已配置完成。
        你发布的每篇文档都会获得一个唯一的永久链接，格式为：</p>
        <pre><code>${baseUrl}/&lt;内容哈希&gt;/</code></pre>

        <h2>如何发布文档</h2>
        <p>直接向 AI 助手发送指令即可，示例：</p>
        <ul>
          <li><code>"将以下内容发布为页面：..."</code></li>
          <li><code>"部署这份文档：..."</code></li>
          <li><code>"将这个 Markdown 文件发布为网页：./doc.md"</code></li>
        </ul>

        <h2>发布流程</h2>
        <ol>
          <li>你的内容被转换为带样式的 HTML 页面。</li>
          <li>根据内容计算哈希值（例如 <code>a1b2c3d4e5f6</code>）。</li>
          <li>页面保存为 <code>public/&lt;哈希&gt;/index.html</code>。</li>
          <li>整个 <code>public/</code> 目录通过 Wrangler Direct Upload 部署。</li>
          <li>你获得永久链接 URL。</li>
        </ol>

        <hr />
        <p>历史页面不会被删除 —— 新发布后，旧链接依然可以正常访问。</p>
      </div>
    </div>
  </body>
</html>`;
}

// ── Main ─────────────────────────────────────────────────
async function main() {
  log("\n╔══════════════════════════════════════════╗");
  log("║   CF Pages Publisher — First-Time Setup  ║");
  log("╚══════════════════════════════════════════╝\n");

  // 1. Workspace path (needed first to locate config)
  const wsInput = await rl.question(`\nWorkspace directory [${DEFAULT_WORKSPACE}]: `);
  const workspacePath = wsInput.trim() || DEFAULT_WORKSPACE;
  const configPath = resolve(workspacePath, CONFIG_FILENAME);

  // 2. Check for existing config in workspace
  let existingProjectName = null;
  if (existsSync(configPath)) {
    const existing = JSON.parse(readFileSync(configPath, "utf8"));
    log(`Found existing config: project "${existing.projectName}"`);
    const overwrite = await rl.question("Reconfigure? [y/N] ");
    if (!/^y(es)?$/i.test(overwrite.trim())) {
      log("Setup cancelled. Existing config unchanged.");
      rl.close();
      return;
    }
    existingProjectName = existing.projectName;
  }

  // 3. Project name
  let projectName;
  while (true) {
    const prompt = existingProjectName
      ? `\nCloudflare Pages project name [${existingProjectName}]: `
      : "\nCloudflare Pages project name: ";
    const input = await rl.question(prompt);
    projectName = input.trim() || existingProjectName;
    const err = validateProjectName(projectName);
    if (!err) break;
    log(`  ✗ ${err}`);
  }
  const baseUrl = `https://${projectName}.pages.dev`;
  log(`  → Pages URL will be: ${baseUrl}`);

  // 4. Confirm
  log("\n── Summary ──────────────────────────");
  log(`  Project:  ${projectName}`);
  log(`  Base URL: ${baseUrl}`);
  log(`  Workspace: ${workspacePath}`);
  log("─────────────────────────────────────");
  const confirm = await rl.question("\nProceed? [Y/n] ");
  if (/^n(o)?$/i.test(confirm.trim())) {
    log("Setup cancelled.");
    rl.close();
    return;
  }

  // 5. Create workspace from templates
  log("\n[1/5] Creating workspace...");
  if (existsSync(workspacePath)) {
    log(`  Workspace already exists at ${workspacePath}`);
  } else {
    mkdirSync(workspacePath, { recursive: true });
    cpSync(TEMPLATES, workspacePath, { recursive: true });
    log(`  ✓ Workspace created at ${workspacePath}`);
  }

  // Ensure .home and .npm-cache directories exist (for sandbox-safe runs)
  mkdirSync(resolve(workspacePath, ".home"), { recursive: true });
  mkdirSync(resolve(workspacePath, ".npm-cache"), { recursive: true });

  // 6. Install dependencies
  log("\n[2/5] Installing dependencies...");
  try {
    run("npm install", { cwd: workspacePath });
    log("  ✓ Dependencies installed");
  } catch {
    log("  ⚠ npm install failed. You may need to re-run with network access:");
    log(`    cd ${workspacePath} && npm install`);
  }

  // 7. Wrangler authentication
  log("\n[3/5] Cloudflare Authentication");
  log("  ─────────────────────────────────────────────────────");
  log("  Choose your authentication method:\n");
  log("  1) Browser login (wrangler login)");
  log("     → Opens browser for OAuth, full permissions");
  log("     → Account ID auto-detected");
  log("     → Best for: personal desktop use\n");
  log("  2) API Token + Account ID (recommended for CI/sandbox)");
  log("     → Token: Cloudflare Pages (Edit) permission");
  log("     → Account ID: Dashboard → domain → right sidebar");
  log("     → Best for: scoped tokens, CI/CD, sandboxed environments");
  log("     → Note: scoped tokens CANNOT auto-detect Account ID,");
  log("       so you must provide it — otherwise all wrangler");
  log("       commands will fail with authentication errors\n");
  log("  3) API Token only (broad permissions)");
  log("     → Token needs Account Settings:Read permission too");
  log("     → Account ID auto-detected via wrangler whoami");
  log("     → Best for: tokens with broad permissions already");
  log("  ─────────────────────────────────────────────────────");

  const envPath = resolve(workspacePath, ".env");

  const authChoice = await rl.question("\n  Choose [1/2/3, default=1]: ");
  const authMethod = authChoice.trim() || "1";

  if (authMethod === "1") {
    // ── Browser login ──────────────────────────────────────
    log("  Opening browser for Cloudflare login...");
    try {
      run("npx wrangler login", { cwd: workspacePath, stdio: "inherit" });
      log("  ✓ Browser login complete");
      // Extract Account ID from OAuth session
      const whoami = run("npx wrangler whoami", { cwd: workspacePath });
      const match = whoami.match(/Account ID:\s*(\S+)/);
      if (match?.[1]) {
        upsertEnvLine(envPath, "CLOUDFLARE_ACCOUNT_ID", match[1]);
        log(`  ✓ Account ID saved: ${match[1]}`);
      }
    } catch {
      log("  ⚠ wrangler login failed or was cancelled.");
      log("    Run manually: cd " + workspacePath + " && npx wrangler login");
      log("    Then re-run this setup script.");
      rl.close();
      return;
    }

  } else if (authMethod === "2") {
    // ── API Token + Account ID ─────────────────────────────
    const token = await rl.question("  API Token: ");
    if (!token.trim()) { log("  ✗ No token provided. Setup cancelled."); rl.close(); return; }

    const accountId = await rl.question("  Account ID: ");
    if (!accountId.trim()) { log("  ✗ Account ID is required for this method."); rl.close(); return; }

    upsertEnvLine(envPath, "CLOUDFLARE_API_TOKEN", token.trim());
    upsertEnvLine(envPath, "CLOUDFLARE_ACCOUNT_ID", accountId.trim());
    log("  ✓ Credentials saved to .env");

    // Verify: try whoami with both values (may still fail for scoped tokens, which is OK)
    try {
      runWithEnv("npx wrangler whoami", buildEnv(token.trim(), accountId.trim()), { cwd: workspacePath });
      log("  ✓ Token verified successfully");
    } catch {
      log("  ⚠ wrangler whoami returned an error (common for scoped tokens).");
      log("    Credentials saved anyway — Pages deploy commands should still work.");
    }

  } else {
    // ── API Token only (broad permissions) ─────────────────
    const token = await rl.question("  API Token: ");
    if (!token.trim()) { log("  ✗ No token provided. Setup cancelled."); rl.close(); return; }

    try {
      const whoami = runWithEnv(
        "npx wrangler whoami",
        { CLOUDFLARE_API_TOKEN: token.trim() },
        { cwd: workspacePath },
      );
      const match = whoami.match(/Account ID:\s*(\S+)/);
      if (!match?.[1]) throw new Error("Could not extract Account ID from whoami output");
      upsertEnvLine(envPath, "CLOUDFLARE_API_TOKEN", token.trim());
      upsertEnvLine(envPath, "CLOUDFLARE_ACCOUNT_ID", match[1]);
      log(`  ✓ Token verified, Account ID: ${match[1]}`);
    } catch {
      log("  ✗ Token verification failed.");
      log("    Your token may lack Account Settings:Read permission.");
      log("    Try option 2 (Token + Account ID) instead.");
      rl.close();
      return;
    }
  }

  // 8. Create CF Pages project
  log("\n[4/5] Creating Cloudflare Pages project...");
  const cfEnv = getEnvFromFile(envPath);
  try {
    runWithEnv(`npx wrangler pages project create ${projectName} --production-branch=main`, cfEnv, {
      cwd: workspacePath,
    });
    log(`  ✓ Project "${projectName}" created`);
  } catch (err) {
    const msg = err.stdout || err.message || "";
    if (msg.includes("already exists") || msg.includes("already taken")) {
      log(`  ✓ Project "${projectName}" already exists — reusing`);
    } else {
      log(`  ⚠ Could not create project: ${msg.trim()}`);
      log("    You can create it manually in the Cloudflare dashboard.");
    }
  }

  // 9. Save config to workspace
  log("\n[5/6] Saving configuration...");
  const config = { projectName, baseUrl, workspacePath };
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  log(`  ✓ config.json saved to ${configPath}`);

  // 10. Generate & deploy welcome page
  log("\n[6/6] Deploying welcome page...");
  try {
    const welcomeHtml = generateWelcomePage({ projectName, baseUrl });
    const publicDir = resolve(workspacePath, "public");
    mkdirSync(publicDir, { recursive: true });
    writeFileSync(resolve(publicDir, "index.html"), welcomeHtml, "utf8");
    log("  ✓ Welcome page generated");

    const deployEnv = getEnvFromFile(resolve(workspacePath, ".env"));
    runWithEnv(
      `npx wrangler pages deploy public --project-name=${projectName} --commit-dirty=true`,
      deployEnv,
      { cwd: workspacePath },
    );
    log(`  ✓ Deployed to ${baseUrl}`);
  } catch (err) {
    const msg = err.stdout || err.message || "";
    log(`  ⚠ Deploy skipped: ${msg.trim().split("\n").pop()}`);
    log("    You can deploy manually later:");
    log(`      cd ${workspacePath}`);
    log("      set -a && source .env && set +a");
    log(`      npx wrangler pages deploy public --project-name=${projectName} --commit-dirty=true`);
  }

  // Done
  log("\n╔══════════════════════════════════════════╗");
  log("║          Setup Complete! ✓               ║");
  log("╠══════════════════════════════════════════╣");
  log(`║  Project:  ${projectName.padEnd(29)}║`);
  log(`║  URL:      ${baseUrl.padEnd(29)}║`);
  log(`║  Workspace: ${workspacePath.padEnd(28)}║`);
  log("╚══════════════════════════════════════════╝\n");
  log(`Open ${baseUrl} to see the welcome page.\n`);
  log("You can now ask your AI agent to publish documents.");
  log('Example: "Publish this as a page: <your content>"\n');

  rl.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Setup failed:", err.message);
  process.exit(1);
});
