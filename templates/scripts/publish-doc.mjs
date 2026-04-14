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
:root { color-scheme: light dark; --page-w: 920px; }
body {
  margin: 0;
  font: 16px/1.7 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
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
.page { max-width: var(--page-w); margin: 0 auto; padding: 36px 18px 64px; }
.shell {
  border-radius: 16px;
  border: 1px solid rgba(127,127,127,0.18);
  background: rgba(127,127,127,0.06);
  padding: 26px 24px;
  backdrop-filter: blur(6px);
}
@media (max-width: 520px) { .shell { padding: 20px 16px; } }

/* "Markdown body" typography */
.markdown-body { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
.markdown-body :where(h1,h2,h3,h4) { line-height: 1.22; margin: 1.1em 0 0.55em; }
.markdown-body h1 { font-size: 2.0em; }
.markdown-body h2 { font-size: 1.55em; }
.markdown-body h3 { font-size: 1.25em; }
.markdown-body p { margin: 0.75em 0; }
.markdown-body :where(ul,ol) { padding-left: 1.25em; margin: 0.7em 0; }
.markdown-body li { margin: 0.25em 0; }
.markdown-body a { color: inherit; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
.markdown-body a:hover { opacity: 0.9; }
.markdown-body hr { border: 0; border-top: 1px solid rgba(127,127,127,0.28); margin: 1.3em 0; }
.markdown-body blockquote {
  margin: 0.9em 0;
  padding: 0.25em 0 0.25em 14px;
  border-left: 4px solid rgba(127,127,127,0.35);
  opacity: 0.95;
}
.markdown-body code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.95em;
}
.markdown-body :not(pre) > code {
  padding: 0.15em 0.35em;
  border-radius: 8px;
  background: rgba(127,127,127,0.14);
  border: 1px solid rgba(127,127,127,0.18);
}
.markdown-body pre {
  overflow: auto;
  padding: 14px;
  border-radius: 12px;
  background: rgba(127,127,127,0.10);
  border: 1px solid rgba(127,127,127,0.16);
}
.markdown-body pre code { background: transparent; border: 0; padding: 0; }
.markdown-body img { max-width: 100%; height: auto; border-radius: 12px; }
.markdown-body table { border-collapse: collapse; width: 100%; overflow: auto; display: block; }
.markdown-body th, .markdown-body td { border: 1px solid rgba(127,127,127,0.22); padding: 8px 10px; }
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
