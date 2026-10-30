// Builds design-patterns/index.html, the module page, from catalog.mjs.
// Run: node build.mjs   (after adding a pattern page, set `ready: true` in the catalog)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GROUPS, PATTERNS } from "./catalog.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const stars = (n) => `<span class="stars" aria-label="Mức phổ biến ${n} trên 3">${"★".repeat(n)}<span class="off">${"★".repeat(3 - n)}</span></span>`;

const firstWave = PATTERNS.filter((p) => p.wave === 1);
const readyCount = PATTERNS.filter((p) => p.ready).length;

function card(pattern) {
  if (pattern.ready) {
    const file = join(HERE, pattern.slug, "preview.png");
    const png = existsSync(file) ? readFileSync(file) : null;
    const size = png ? [png.readUInt32BE(16), png.readUInt32BE(20)] : null;
    return `<li class="card ready"><a href="./${pattern.slug}/">
      <div class="plate">
        <span class="corner title">${esc(pattern.name)}</span>
        ${size ? `<img src="./${pattern.slug}/preview.png" alt="Hình tương tác của ${esc(pattern.name)}" loading="lazy" width="${size[0]}" height="${size[1]}">` : ""}
        <span class="corner hint">Mở bài</span>
        <span class="corner readout">${stars(pattern.stars)}</span>
      </div></a>
      <p>${esc(pattern.summary)}</p></li>`;
  }
  return `<li class="card planned">
      <div class="head"><span class="name">${esc(pattern.name)}</span>${stars(pattern.stars)}</div>
      <p>${esc(pattern.summary)}</p>
      <span class="status">${pattern.wave === 1 ? "Đợt 1 · sắp có" : "Đợt 2"}</span></li>`;
}

const sections = GROUPS.map((group) => {
  const list = PATTERNS.filter((p) => p.group === group.id).sort((a, b) => (b.ready ? 1 : 0) - (a.ready ? 1 : 0) || a.wave - b.wave || b.stars - a.stars);
  return `<section id="${group.id}" aria-labelledby="${group.id}-title">
    <h2 id="${group.id}-title">${group.name} <span>${esc(group.title)}</span></h2>
    <p class="blurb">${esc(group.blurb)}</p>
    <ul class="cards">${list.map(card).join("")}</ul>
  </section>`;
}).join("");

const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Design patterns · Anatomy Docs</title>
<meta name="description" content="23 design pattern kinh điển chia ba nhóm Creational, Structural, Behavioral. Mỗi bài là một hình tương tác kèm bài toán backend và code Python, TypeScript.">
<style>
:root {
  color-scheme: light;
  --page: #f2f2ef; --card: #fbfbfa; --text: #57575a; --strong: #18181a; --muted: #8c8c90;
  --line: #d4d4d6; --mid: #8a8a8f; --lo: #b4b4b8; --hi: #26262a;
  --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--page); color: var(--text); font: 16px/1.6 var(--sans); }
a { color: inherit; }
.wrap { max-width: 1040px; margin: 0 auto; padding: 0 16px; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 22px 0; font-size: 12.5px; letter-spacing: .1em; text-transform: uppercase; }
.top .mark { color: var(--strong); text-decoration: none; font: 12px/1 var(--mono); letter-spacing: .1em; }
.top nav { display: flex; gap: 20px; }
.top nav a { color: var(--muted); text-decoration: none; }
.top nav a:hover, .top nav a:focus-visible { color: var(--strong); }
.intro { padding: 32px 0 8px; max-width: 700px; }
.eyebrow { margin: 0 0 16px; color: var(--muted); font-size: 12.5px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; }
h1 { margin: 0 0 18px; color: var(--strong); font-size: clamp(30px, 5vw, 44px); line-height: 1.12; font-weight: 600; letter-spacing: -.02em; }
.intro p { margin: 0 0 12px; font-size: 17px; text-wrap: pretty; }
.progress { display: flex; flex-wrap: wrap; gap: 8px 22px; margin: 18px 0 0; padding: 0; list-style: none; font-size: 14px; color: var(--muted); }
.progress strong { color: var(--strong); font-weight: 600; }
section { padding: 52px 0 4px; scroll-margin-top: 8px; }
h2 { margin: 0 0 6px; color: var(--strong); font-size: 22px; font-weight: 600; letter-spacing: -.01em; }
h2 span { color: var(--muted); font-weight: 400; font-size: 17px; margin-left: 6px; }
.blurb { margin: 0 0 22px; font-size: 15px; max-width: 70ch; }
.cards { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 22px 22px; align-items: start; }
.card p { margin: 10px 2px 0; font-size: 14px; line-height: 1.55; }
.card.ready a { display: block; text-decoration: none; }
.plate { position: relative; background: var(--card); box-shadow: 0 0 0 1px var(--mid); padding: 40px 14px 40px; transition: box-shadow .2s ease; }
.card.ready a:hover .plate, .card.ready a:focus-visible .plate { box-shadow: 0 0 0 1px var(--hi); }
.card.ready a:focus-visible { outline: none; }
.plate img { display: block; width: 100%; height: auto; }
.corner { position: absolute; color: var(--muted); font-size: 11px; line-height: 1; white-space: nowrap; }
.corner.title { top: 16px; right: 16px; letter-spacing: .1em; text-transform: uppercase; }
.corner.hint { bottom: 16px; left: 16px; letter-spacing: .1em; text-transform: uppercase; }
.corner.readout { bottom: 16px; right: 16px; }
.stars { font: 12px/1 var(--mono); letter-spacing: .1em; color: var(--hi); white-space: nowrap; }
.stars .off { color: var(--line); }
.card.planned { border: 1px dashed var(--lo); padding: 16px 16px 14px; }
.card.planned .head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.card.planned .name { color: var(--strong); font-weight: 600; font-size: 15px; }
.card.planned p { margin: 8px 0 10px; }
.status { display: inline-block; font-size: 12px; color: var(--muted); letter-spacing: .02em; }
footer { margin-top: 72px; padding: 22px 0 40px; border-top: 1px solid var(--line); color: var(--muted); font-size: 13px; display: flex; justify-content: space-between; gap: 16px; }
footer a { color: var(--text); }
</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <a class="mark" href="../">Anatomy Docs</a>
    <nav aria-label="Các nhóm">
      ${GROUPS.map((g) => `<a href="#${g.id}">${g.name}</a>`).join("\n      ")}
    </nav>
  </header>
  <main>
    <div class="intro">
      <p class="eyebrow">Module</p>
      <h1>Design patterns</h1>
      <p>23 pattern kinh điển của nhóm Gang of Four, chia ba nhóm theo việc chúng giải quyết. Mỗi bài là một cỗ máy tương tác mà cách nó chạy chính là pattern, kèm một bài toán backend quen thuộc, phiên bản code trước và sau khi áp dụng, viết bằng Python và TypeScript, chạy được.</p>
      <ul class="progress">
        <li><strong>${readyCount}</strong> / ${firstWave.length} bài của đợt 1 đã có</li>
        <li>${stars(3)} hay gặp trong backend</li>
        <li>${stars(1)} ít gặp</li>
      </ul>
    </div>
    ${sections}
  </main>
  <footer><a href="../">← Trang chủ</a><span>Vẽ bằng <a href="https://github.com/wheresryan22/anatomy">Anatomy</a></span></footer>
</div>
</body>
</html>
`;

writeFileSync(join(HERE, "index.html"), html);
console.log(`wrote index.html (${readyCount} ready of ${PATTERNS.length})`);
