/**
 * publish-doc.mjs — Convert a Markdown/HTML/TXT file to a styled page
 * with a content-hash permalink directory.
 *
 * Usage:
 *   npm run publish-doc -- <input.(md|html|txt)> [--base <url>] [--len <N>]
 *                        [--with-time] [--allow-html]
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { marked } from "marked";

function usage(exitCode = 1) {
  const msg = `
Usage:
  npm run publish-doc -- <input.(md|html|txt)> [--base <https://xxx.pages.dev>] [--len <12|16|...>] [--with-time] [--allow-html]

What it does:
  - Writes: public/<hash>/index.html
  - Ensures shared CSS: public/assets/markdown.css

Notes:
  - By default, raw HTML inside Markdown is escaped (safer for public links). Use --allow-html to keep it.
  - If --with-time is set, the hash will change on each run (even for identical content).
`.trim();
  // eslint-disable-next-line no-console
  console.error(msg);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { input: null, base: "", len: 12, withTime: false, allowHtml: false };
  const rest = [...argv];

  while (rest.length) {
    const token = rest.shift();
    if (!token) break;
    if (!args.input && !token.startsWith("--")) {
      args.input = token;
      continue;
    }
    if (token === "--base") {
      args.base = String(rest.shift() ?? "");
      continue;
    }
    if (token === "--len") {
      const value = Number(rest.shift());
      if (!Number.isFinite(value) || value < 8 || value > 64) usage(1);
      args.len = value;
      continue;
    }
    if (token === "--with-time") {
      args.withTime = true;
      continue;
    }
    if (token === "--allow-html") {
      args.allowHtml = true;
      continue;
    }
    if (token === "-h" || token === "--help") usage(0);
    usage(1);
  }

  if (!args.input) usage(1);
  return args;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function inferTitle({ inputPath, markdownText }) {
  if (markdownText) {
    const lines = markdownText.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^#\s+(.+?)\s*$/);
      if (match?.[1]) return match[1];
    }
  }
  const base = path.basename(inputPath);
  return base.replace(path.extname(base), "");
}

function markdownCss() {
  return `
:root {
  color-scheme: light dark;
  --page-w: 920px;
  /* Cool-blue brand temperature — every neutral carries a trace of hue */
  --bg-base: #f6f8fc;
  --surface: #fefefe;
  --surface-alpha: rgba(240,245,255,0.65);
  --border: rgba(200,215,240,0.55);
  --border-strong: rgba(180,200,235,0.70);
  --text-primary: #0f1520;
  --text-secondary: #3a4560;
  --text-muted: #7a8ba0;
  --shadow-sm: 0 1px 3px rgba(30,50,100,0.06), 0 0 0 1px rgba(30,50,100,0.03);
  --shadow-md: 0 4px 20px rgba(30,50,100,0.08), 0 1px 4px rgba(30,50,100,0.04);
  --code-bg: rgba(235,242,255,0.70);
  --code-border: rgba(200,220,250,0.50);
  --brand-glow-blue: rgba(60,90,255,0.10);
  --brand-glow-green: rgba(0,170,90,0.08);
}

html, body { min-height: 100vh; }
body {
  margin: 0;
  font: 16px/1.7 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  background:
    radial-gradient(1200px 800px at 20% -10%, var(--brand-glow-blue), transparent 65%),
    radial-gradient(1000px 600px at 85% -5%, var(--brand-glow-green), transparent 60%),
    linear-gradient(180deg, var(--bg-base) 0%, #f0f3f9 100%);
  color: var(--text-primary);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-base: #0e111a;
    --surface: rgba(20,26,40,0.72);
    --surface-alpha: rgba(18,24,38,0.65);
    --border: rgba(60,80,120,0.28);
    --border-strong: rgba(80,105,150,0.38);
    --text-primary: #e8ecf5;
    --text-secondary: #98a4bc;
    --text-muted: #5a6a85;
    --shadow-sm: 0 0 0 1px rgba(80,120,220,0.08);
    --shadow-md: 0 4px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(80,120,220,0.06);
    --code-bg: rgba(20,28,45,0.65);
    --code-border: rgba(50,70,110,0.30);
    --brand-glow-blue: rgba(80,100,220,0.12);
    --brand-glow-green: rgba(40,160,100,0.08);
  }
  body {
    background:
      radial-gradient(1200px 800px at 20% -10%, var(--brand-glow-blue), transparent 65%),
      radial-gradient(1000px 600px at 85% -5%, var(--brand-glow-green), transparent 60%),
      linear-gradient(180deg, var(--bg-base) 0%, #0a0d14 100%);
    color: var(--text-primary);
  }
}

.page {
  max-width: var(--page-w);
  margin: 0 auto;
  padding: 48px 20px min(12vh, 80px);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.shell {
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--surface-alpha);
  box-shadow: var(--shadow-md);
  padding: 32px 28px;
  backdrop-filter: blur(12px) saturate(1.2);
  position: relative;
}
.shell::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 16px;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%);
}
@media (max-width: 520px) {
  .page { padding: 32px 14px min(8vh, 56px); }
  .shell { padding: 22px 18px; border-radius: 12px; }
}

/* "Markdown body" typography */
.markdown-body { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; position: relative; z-index: 1; }
.markdown-body :where(h1,h2,h3,h4) { line-height: 1.22; margin: 1.1em 0 0.55em; color: var(--text-primary); }
.markdown-body h1 { font-size: 2.0em; }
.markdown-body h2 { font-size: 1.55em; }
.markdown-body h3 { font-size: 1.25em; }
.markdown-body p { margin: 0.75em 0; color: var(--text-secondary); }
.markdown-body :where(ul,ol) { padding-left: 1.25em; margin: 0.7em 0; }
.markdown-body li { margin: 0.25em 0; color: var(--text-secondary); }
.markdown-body a { color: var(--text-secondary); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
.markdown-body a:hover { color: var(--text-primary); opacity: 1; }
.markdown-body hr { border: 0; border-top: 1px solid var(--border); margin: 1.3em 0; }
.markdown-body blockquote {
  margin: 0.9em 0;
  padding: 0.25em 0 0.25em 14px;
  border-left: 4px solid var(--border-strong);
  color: var(--text-muted);
}
.markdown-body code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.95em;
}
.markdown-body :not(pre) > code {
  padding: 0.15em 0.35em;
  border-radius: 8px;
  background: var(--code-bg);
  border: 1px solid var(--code-border);
  color: var(--text-primary);
}
.markdown-body pre {
  overflow: auto;
  padding: 14px;
  border-radius: 12px;
  background: var(--code-bg);
  border: 1px solid var(--code-border);
}
.markdown-body pre code { background: transparent; border: 0; padding: 0; color: inherit; }
.markdown-body img { max-width: 100%; height: auto; border-radius: 12px; }
.markdown-body table { border-collapse: collapse; width: 100%; overflow: auto; display: block; }
.markdown-body th, .markdown-body td { border: 1px solid var(--border); padding: 8px 10px; }
`.trimStart();
}

async function ensureSharedAssets({ projectRoot }) {
  const outDir = path.resolve(projectRoot, "public", "assets");
  await mkdir(outDir, { recursive: true });
  await writeFile(path.resolve(outDir, "markdown.css"), markdownCss(), "utf8");
}

function wrapHtml({ title, bodyHtml }) {
  const safeTitle = escapeHtml(title);
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <link rel="stylesheet" href="/assets/markdown.css" />
  </head>
  <body>
    <div class="page">
      <article class="shell markdown-body">
${bodyHtml}
      </article>
    </div>
  </body>
</html>`;
}

function computeHashSlug({ html, withTime, len }) {
  const timePart = withTime ? `\n<!-- generated_at:${new Date().toISOString()} -->\n` : "";
  const hash = createHash("sha256").update(html + timePart, "utf8").digest("hex");
  return hash.slice(0, len);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = process.cwd();
  await ensureSharedAssets({ projectRoot });

  const inputPath = path.resolve(projectRoot, args.input);
  const ext = path.extname(inputPath).toLowerCase();
  const raw = await readFile(inputPath, "utf8");

  let finalHtml;
  if (ext === ".html" || ext === ".htm") {
    finalHtml = raw;
  } else if (ext === ".md" || ext === ".markdown") {
    const renderer = new marked.Renderer();
    if (!args.allowHtml) renderer.html = (html) => escapeHtml(html);

    const title = inferTitle({ inputPath, markdownText: raw });
    marked.setOptions({ gfm: true, mangle: false, headerIds: true, renderer });
    const bodyHtml = marked.parse(raw);
    finalHtml = wrapHtml({ title, bodyHtml });
  } else {
    const title = inferTitle({ inputPath, markdownText: null });
    const bodyHtml = `<pre><code>${escapeHtml(raw)}</code></pre>`;
    finalHtml = wrapHtml({ title, bodyHtml });
  }

  const slug = computeHashSlug({ html: finalHtml, withTime: args.withTime, len: args.len });
  const outDir = path.resolve(projectRoot, "public", slug);
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, "index.html");
  await writeFile(outFile, finalHtml, "utf8");

  const base = args.base || process.env.PAGES_BASE_URL || "";
  const url = base ? `${base.replace(/\/$/, "")}/${slug}/` : `/<project>/${slug}/`;

  // eslint-disable-next-line no-console
  console.log(`Wrote: ${outFile}`);
  // eslint-disable-next-line no-console
  console.log(`URL:   ${url}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
