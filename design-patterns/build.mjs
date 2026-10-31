// Builds design-patterns/index.html, the module page, from catalog.mjs.
// Run: node build.mjs   (after adding a pattern page, set `ready: true` in the catalog)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GROUPS, PATTERNS } from "./catalog.mjs";
import { ICONS } from "./_shared/page.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const stars = (n) => `<span class="stars" role="img" aria-label="Mức phổ biến ${n} trên 3">${"★".repeat(n)}<span class="off">${"★".repeat(3 - n)}</span></span>`;

const ready = PATTERNS.filter((p) => p.ready);
const later = PATTERNS.length - ready.length;
const WORDS = ["Không", "Một", "Hai", "Ba", "Bốn", "Năm", "Sáu", "Bảy", "Tám", "Chín", "Mười"];

function card(pattern) {
  const file = join(HERE, pattern.slug, "preview.png");
  const png = existsSync(file) ? readFileSync(file) : null;
  const size = png ? [png.readUInt32BE(16), png.readUInt32BE(20)] : null;
  return `<li class="card"><a href="./${pattern.slug}/">
        <span class="thumb">${size ? `<img src="./${pattern.slug}/preview.png" alt="" loading="lazy" width="${size[0]}" height="${size[1]}">` : ""}</span>
        <span class="body">
          <span class="head"><span class="name">${esc(pattern.name)}</span>${stars(pattern.stars)}</span>
          <span class="summary">${esc(pattern.summary)}</span>
          <span class="go">Mở bài<span aria-hidden="true"> →</span></span>
        </span>
      </a></li>`;
}

const upcoming = (pattern) => `<li><span class="head"><span class="name">${esc(pattern.name)}</span>${stars(pattern.stars)}</span><span class="summary">${esc(pattern.summary)}</span></li>`;

const sections = GROUPS.map((group) => {
  const done = PATTERNS.filter((p) => p.group === group.id && p.ready);
  const rest = PATTERNS.filter((p) => p.group === group.id && !p.ready);
  return `<section id="${group.id}" aria-labelledby="${group.id}-title">
    <div class="group-head">
      <h2 id="${group.id}-title">${group.name} <span>${esc(group.title)}</span></h2>
      <p class="count">${done.length} bài</p>
    </div>
    <p class="blurb">${esc(group.blurb)}</p>
    <ul class="cards">${done.map(card).join("")}</ul>
    ${rest.length ? `<div class="later"><p class="later-title">Sắp có</p><ul>${rest.map(upcoming).join("")}</ul></div>` : ""}
  </section>`;
}).join("\n    ");

const tabs = [
  { href: "../", icon: ICONS.home, label: "Trang chủ" },
  ...GROUPS.map((group) => ({ href: `#${group.id}`, icon: ICONS[group.id], label: group.name, section: group.id })),
];

const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Design patterns · Anatomy Docs</title>
<meta name="description" content="Các design pattern kinh điển, chia ba nhóm Creational, Structural và Behavioral. Mỗi bài là một cỗ máy tương tác, kèm một bài toán backend và code Python, TypeScript chạy được.">
<style>
:root {
  color-scheme: light;
  --page: #f2f2ef; --card: #fbfbfa; --thumb: #fbfbfa; --text: #57575a; --strong: #18181a; --muted: #8c8c90;
  --line: #dcdcde; --mid: #8a8a8f; --lo: #b4b4b8; --hi: #26262a;
  --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --tabbar: 0px;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
body { margin: 0; background: var(--page); color: var(--text); font: 16px/1.6 var(--sans); padding-bottom: var(--tabbar); }
a { color: inherit; }
.wrap { max-width: 1040px; margin: 0 auto; padding: 0 16px; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 22px 0; font-size: 12.5px; letter-spacing: .1em; text-transform: uppercase; }
.top .mark { color: var(--strong); text-decoration: none; font: 12px/1 var(--mono); letter-spacing: .1em; }
.top nav { display: flex; gap: 20px; }
.top nav a { color: var(--muted); text-decoration: none; }
.top nav a:hover, .top nav a:focus-visible { color: var(--strong); }
.intro { padding: 28px 0 4px; max-width: 700px; }
.eyebrow { margin: 0 0 14px; color: var(--muted); font-size: 12.5px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; }
h1 { margin: 0 0 16px; color: var(--strong); font-size: clamp(30px, 6vw, 44px); line-height: 1.12; font-weight: 600; letter-spacing: -.02em; }
.intro p { margin: 0 0 12px; font-size: 17px; text-wrap: pretty; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 16px 0 0; padding: 0; list-style: none; font-size: 13.5px; color: var(--muted); }
section { padding: 48px 0 0; scroll-margin-top: 12px; }
.group-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--line); padding-bottom: 10px; margin-bottom: 12px; }
h2 { margin: 0; color: var(--strong); font-size: 22px; font-weight: 600; letter-spacing: -.01em; }
h2 span { color: var(--muted); font-weight: 400; font-size: 16px; margin-left: 6px; }
.count { margin: 0; font-size: 13px; color: var(--muted); white-space: nowrap; }
.blurb { margin: 0 0 20px; font-size: 15px; max-width: 70ch; text-wrap: pretty; }
.cards { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 18px; }
.card a { display: flex; flex-direction: column; height: 100%; background: var(--card); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; text-decoration: none; transition: border-color .2s ease, box-shadow .2s ease; }
.card a:hover { border-color: var(--mid); box-shadow: 0 6px 18px -12px rgba(0,0,0,.35); }
.card a:focus-visible { outline: 2px solid var(--hi); outline-offset: 2px; }
.thumb { display: block; aspect-ratio: 3 / 2; background: var(--thumb); border-bottom: 1px solid var(--line); overflow: hidden; }
.thumb img { display: block; width: 100%; height: 100%; object-fit: contain; padding: 6% 4%; }
.body { display: flex; flex-direction: column; gap: 6px; flex: 1; padding: 14px 16px 16px; }
.head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.name { color: var(--strong); font-weight: 600; font-size: 16px; line-height: 1.3; }
.summary { font-size: 14.5px; line-height: 1.55; text-wrap: pretty; }
.go { margin-top: auto; padding-top: 6px; font-size: 13.5px; font-weight: 500; color: var(--strong); }
.stars { flex: none; font: 12px/1 var(--mono); letter-spacing: .1em; color: var(--hi); white-space: nowrap; }
.stars .off { color: var(--line); }
.later { margin-top: 18px; border: 1px dashed var(--lo); border-radius: 12px; padding: 4px 16px; }
.later-title { margin: 10px 0 2px; font-size: 12px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.later ul { list-style: none; margin: 0; padding: 0; }
.later li { display: flex; flex-direction: column; gap: 2px; padding: 10px 0; border-top: 1px solid var(--line); }
.later li:first-child { border-top: 0; }
.later .name { font-size: 15px; color: var(--text); }
.later .summary { font-size: 14px; color: var(--muted); }
footer { margin-top: 64px; padding: 22px 0 40px; border-top: 1px solid var(--line); color: var(--muted); font-size: 13px; display: flex; justify-content: space-between; gap: 16px; }
footer a { color: var(--text); }
.tabbar { display: none; }
@media (max-width: 760px) {
  :root { --tabbar: calc(62px + env(safe-area-inset-bottom)); }
  .top nav { display: none; }
  .top { padding: 16px 0; }
  .intro { padding-top: 12px; }
  .intro p { font-size: 16px; }
  section { padding-top: 40px; }
  .tabbar { display: grid; grid-template-columns: repeat(${tabs.length}, 1fr); position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; padding: 0 6px env(safe-area-inset-bottom); background: rgba(251, 251, 250, .94); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); border-top: 1px solid var(--line); }
  .tabbar a { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; min-height: 62px; color: var(--muted); text-decoration: none; font-size: 11px; font-weight: 500; letter-spacing: .01em; -webkit-tap-highlight-color: transparent; }
  .tabbar svg { width: 22px; height: 22px; }
  .tabbar a[aria-current] { color: var(--strong); }
  .tabbar a[aria-current]::before { content: ""; position: absolute; top: 0; left: 28%; right: 28%; height: 2px; border-radius: 0 0 2px 2px; background: var(--hi); }
  footer { margin-top: 48px; }
}
@media (max-width: 600px) {
  .cards { grid-template-columns: 1fr; gap: 10px; }
  .card a { flex-direction: row; align-items: stretch; }
  .card a::after { content: "›"; align-self: center; padding: 0 14px 0 2px; font-size: 22px; line-height: 1; color: var(--lo); }
  .thumb { flex: none; width: 112px; aspect-ratio: auto; border-bottom: 0; border-right: 1px solid var(--line); }
  .thumb img { object-fit: cover; padding: 0; transform: scale(1.18); }
  .body { gap: 4px; padding: 12px 4px 12px 14px; justify-content: center; }
  .name { font-size: 15.5px; }
  .summary { font-size: 13.5px; line-height: 1.5; }
  .go { display: none; }
}
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
      <p>Các pattern kinh điển của nhóm Gang of Four, chia thành ba nhóm theo loại vấn đề chúng giải quyết. Mỗi bài mở đầu bằng một cỗ máy nhỏ, và cách cỗ máy chạy cũng chính là cách pattern vận hành. Tiếp theo là một bài toán backend quen thuộc, với code Python và TypeScript trước và sau khi áp dụng pattern, chạy được ngay.</p>
      <p>${later ? `Hiện đã có ${ready.length} bài, đủ những pattern hay gặp nhất. ${WORDS[later] ?? later} pattern còn lại sẽ có ở đợt sau.` : `Đã có đủ ${ready.length} bài, từ những pattern gặp hằng ngày tới những pattern ít dùng hơn. Mỗi bài kết thúc bằng vài câu hỏi ngắn để bạn tự kiểm tra.`}</p>
      <ul class="legend">
        <li>${stars(3)} rất hay gặp trong backend</li>
        <li>${stars(1)} ít gặp hơn</li>
      </ul>
    </div>
    ${sections}
  </main>
  <footer><a href="../">← Trang chủ</a><span>Vẽ bằng <a href="https://github.com/wheresryan22/anatomy">Anatomy</a></span></footer>
</div>
<nav class="tabbar" aria-label="Điều hướng nhanh">
  ${tabs.map((t) => `<a href="${t.href}"${t.section ? ` data-section="${t.section}"` : ""}>${t.icon}<span>${esc(t.label)}</span></a>`).join("\n  ")}
</nav>
<script>
(() => {
  // Marks the tab of the group being read.
  const links = [...document.querySelectorAll(".tabbar [data-section]")];
  const mark = (id) => links.forEach((a) => (a.dataset.section === id ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")));
  const seen = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
    const first = links.map((a) => a.dataset.section).find((id) => seen.get(id));
    mark(first);
  }, { rootMargin: "-35% 0px -55% 0px" });
  document.querySelectorAll("main section").forEach((s) => io.observe(s));
})();
</script>
</body>
</html>
`;

writeFileSync(join(HERE, "index.html"), html);
console.log(`wrote index.html (${ready.length} ready of ${PATTERNS.length})`);
