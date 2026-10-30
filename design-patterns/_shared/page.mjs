// Shared page shell for the design-patterns module: header, article styles,
// syntax highlighting and Python/TypeScript code tabs. Each pattern's build.mjs
// renders its figure with the anatomy kit and passes the rest of the page here.

import { readFileSync } from "node:fs";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";

const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const KEYWORDS = {
  python: "and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return self True try while with yield",
  typescript: "as async await break case catch class const constructor continue default delete do else enum export extends false finally for from function if implements import in instanceof interface let new null of private protected public readonly return static super switch this throw true try type typeof undefined var void while yield",
};
const BUILTINS = {
  python: "dict float int len list print range set str sum tuple",
  typescript: "Array Date Error JSON Math Number Object Promise Record String console number string boolean any unknown never",
};

// A small tokenizer: comments, strings, numbers, decorators, keywords, types.
export function highlight(code, lang) {
  const keywords = new Set(KEYWORDS[lang].split(" "));
  const builtins = new Set(BUILTINS[lang].split(" "));
  const rules = [
    ["c", lang === "python" ? /#[^\n]*/y : /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
    ["s", lang === "python" ? /("""[\s\S]*?"""|'''[\s\S]*?'''|f?"(?:\\.|[^"\\\n])*"|f?'(?:\\.|[^'\\\n])*')/y : /(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/y],
    ["d", lang === "python" ? /@[A-Za-z_][\w.]*/y : /@[A-Za-z_]\w*/y],
    ["n", /\b\d[\d_]*(?:\.\d+)?\b/y],
    ["w", /[A-Za-z_]\w*/y],
    ["o", /\s+|[^\sA-Za-z_\d"'`#/@]+|\//y],
  ];
  let out = "";
  let at = 0;
  while (at < code.length) {
    let matched = false;
    for (const [kind, re] of rules) {
      re.lastIndex = at;
      const m = re.exec(code);
      if (!m || m[0].length === 0) continue;
      const text = m[0];
      if (kind === "w") {
        const cls = keywords.has(text) ? "k" : builtins.has(text) ? "b" : /^[A-Z]/.test(text) ? "t" : "";
        out += cls ? `<span class="hl-${cls}">${esc(text)}</span>` : esc(text);
      } else if (kind === "o") {
        out += esc(text);
      } else {
        out += `<span class="hl-${kind}">${esc(text)}</span>`;
      }
      at += text.length;
      matched = true;
      break;
    }
    if (!matched) out += esc(code[at++]);
  }
  return out;
}

let codeCount = 0;

const LANGS = [
  ["python", "Python", "py"],
  ["typescript", "TypeScript", "ts"],
];

// Code in Python and TypeScript as tabs. `files` maps a language to a file path;
// the file is read at build time, so the page shows the code that was run.
export function codeTabs({ files, note = "" }) {
  const tabs = LANGS.filter(([lang]) => files[lang]);
  const id = `code-${++codeCount}`;
  const buttons = tabs.map(([lang, label], i) => `<button type="button" role="tab" id="${id}-${lang}-tab" aria-controls="${id}-${lang}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-lang="${lang}">${label}</button>`).join("");
  const panels = tabs.map(([lang, , ext], i) => {
    const source = readFileSync(files[lang], "utf8").replace(/\s+$/, "");
    const name = files[lang].split("/").pop();
    return `<div class="dp-panel" role="tabpanel" id="${id}-${lang}" aria-labelledby="${id}-${lang}-tab" data-lang="${lang}"${i === 0 ? "" : " hidden"}><div class="dp-file">${esc(name)}<span>${ext === "py" ? "python3 " : "node "}${esc(name)}</span></div><pre><code class="lang-${lang}">${highlight(source, lang)}</code></pre></div>`;
  }).join("");
  return `<div class="dp-code"><div class="dp-tabs" role="tablist" aria-label="Ngôn ngữ">${buttons}</div>${panels}${note ? `<p class="dp-note">${note}</p>` : ""}</div>`;
}

// Step controls under a figure, for touch screens and for anyone who wants to
// walk through the scenario: one button per step, previous/next, play/pause and
// the current step's explanation. The figure's live code and STEPS_SCRIPT talk
// through events on .iso-stage: the bar sends dp:select {index}, dp:play and
// dp:pause; the figure answers with dp:state {index, touring} whenever either changes.
export function stepsHtml({ label, steps, start = 0 }) {
  const buttons = steps.map((step, i) => `<button type="button" data-step="${i}" aria-pressed="${i === start}">${step.short ? `<span class="dp-long">${esc(step.label)}</span><span class="dp-short">${esc(step.short)}</span>` : esc(step.label)}</button>`).join("");
  return `<div class="dp-steps" role="group" aria-label="${esc(label)}" data-captions="${esc(JSON.stringify(steps.map((step) => step.caption)))}">
    <div class="dp-step-row"><button type="button" data-prev aria-label="Bước trước">‹</button>${buttons}<button type="button" data-next aria-label="Bước sau">›</button></div>
    <div class="dp-step-info"><p class="dp-step-caption" aria-live="off"><span class="dp-step-count">Bước ${start + 1}/${steps.length}</span> ${steps[start].caption}</p><button type="button" class="dp-play" data-play aria-pressed="true"><span aria-hidden="true" class="dp-play-icon">❚❚</span><span class="dp-play-text">Tạm dừng</span></button></div>
  </div>`;
}

// Puts the step controls between the card and its legend.
export const withSteps = (plate, steps) => plate.replace('<figcaption class="iso-legend">', `${steps}<figcaption class="iso-legend">`);

export const output = (text) => `<pre class="dp-output" aria-label="Kết quả khi chạy"><code>${esc(text)}</code></pre>`;

export const ARTICLE_CSS = `
.iso{--anatomy-mono:"JetBrains Mono","Liberation Mono",Consolas,ui-monospace,monospace}
.iso-page{margin-top:40px}
.dp-crumbs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 28px;font-size:13px;color:var(--anatomy-muted)}
.dp-crumbs a{color:var(--anatomy-text);text-decoration:none}
.dp-crumbs a:hover,.dp-crumbs a:focus-visible{color:var(--anatomy-strong);text-decoration:underline}
.dp-eyebrow{margin:0 0 10px;font-size:12.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--anatomy-muted)}
.dp-article h1{margin:0 0 14px;color:var(--anatomy-strong);font-size:clamp(30px,5vw,40px);line-height:1.12;font-weight:600;letter-spacing:-.02em}
.dp-lead{margin:0 0 8px;font-size:17px;line-height:1.65;color:var(--anatomy-text);max-width:68ch}
.dp-article h2{margin:52px 0 14px;color:var(--anatomy-strong);font-size:22px;font-weight:600;letter-spacing:-.01em}
.dp-article h3{margin:26px 0 8px;color:var(--anatomy-strong);font-size:15px;font-weight:600}
.dp-article p,.dp-article li{font-size:15.5px;line-height:1.7;color:var(--anatomy-text)}
.dp-article p{margin:0 0 12px;max-width:72ch}
.dp-article ul{margin:0 0 12px;padding-left:20px;max-width:72ch}
.dp-article li{margin:4px 0}
.dp-article strong{color:var(--anatomy-strong);font-weight:600}
.dp-article :not(pre)>code{font:13.5px/1.4 var(--anatomy-mono);background:var(--anatomy-card);border:1px solid var(--anatomy-faint);border-radius:4px;padding:1px 5px;color:var(--anatomy-strong);white-space:nowrap}
.dp-table{width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:14px}
.dp-table th,.dp-table td{text-align:left;vertical-align:top;padding:9px 12px 9px 0;border-bottom:1px solid var(--anatomy-faint)}
.dp-table th{color:var(--anatomy-strong);font-weight:600;font-size:12.5px;letter-spacing:.04em}
.dp-table td{color:var(--anatomy-text)}
.dp-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.dp-code{margin:12px 0 16px}
.dp-tabs{display:flex;gap:2px}
.dp-tabs button{font:500 13px/1 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;padding:9px 14px;border:1px solid var(--anatomy-faint);border-bottom:none;border-radius:6px 6px 0 0;background:transparent;color:var(--anatomy-muted);cursor:pointer}
.dp-tabs button[aria-selected="true"]{background:var(--anatomy-card);color:var(--anatomy-strong)}
.dp-tabs button:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:2px}
.dp-panel{border:1px solid var(--anatomy-faint);border-radius:0 6px 6px 6px;background:var(--anatomy-card);overflow:hidden}
.dp-file{display:flex;justify-content:space-between;gap:12px;padding:8px 14px;border-bottom:1px solid var(--anatomy-faint);font:12px/1.4 var(--anatomy-mono);color:var(--anatomy-text)}
.dp-file span{color:var(--anatomy-muted)}
.dp-panel pre,.dp-output{margin:0;padding:14px 16px;overflow-x:auto;font:13px/1.6 var(--anatomy-mono);color:var(--anatomy-strong);tab-size:2}
.dp-panel pre code,.dp-output code{font:inherit}
/* After every font shorthand, which resets ligatures: JetBrains Mono would draw -> and => as arrows. */
.dp-panel pre,.dp-output,.dp-article code,.dp-article :not(pre)>code{font-variant-ligatures:none;font-feature-settings:"liga" 0,"calt" 0}
/* Its own layer gives the drawing's text greyscale antialiasing, so captured previews have no colour fringes. */
.iso-stage svg{will-change:transform}
.dp-output{margin:0 0 16px;border:1px solid var(--anatomy-faint);border-radius:6px;background:transparent;color:var(--anatomy-text)}
.dp-note{margin:8px 0 0;font-size:13.5px;color:var(--anatomy-muted)}
.hl-c{color:#8c8c90;font-style:italic}
.hl-s{color:#2f7a52}
.hl-n{color:#a1551b}
.hl-k{color:#8b2f6b}
.hl-b{color:#2c5ea0}
.hl-t{color:#2c5ea0}
.hl-d{color:#7a4fc0}
.dp-steps{margin:14px 0 6px}
.dp-step-row{display:flex;gap:6px}
.dp-steps button{font:500 13.5px/1.2 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;min-height:42px;padding:8px 12px;border:1px solid var(--anatomy-faint);border-radius:6px;background:var(--anatomy-card);color:var(--anatomy-text);cursor:pointer;touch-action:manipulation}
.dp-steps button:hover{border-color:var(--anatomy-lo);color:var(--anatomy-strong)}
.dp-steps button:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:2px}
.dp-step-row [data-step]{flex:1 1 0;min-width:0}
.dp-step-row [data-step][aria-pressed="true"]{border-color:var(--anatomy-hi);box-shadow:inset 0 0 0 1px var(--anatomy-hi);color:var(--anatomy-strong)}
.dp-step-row [data-prev],.dp-step-row [data-next]{flex:none;width:42px;padding:0;font-size:18px}
.dp-short{display:none}
.dp-step-info{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;margin-top:10px}
.dp-step-caption{margin:0;font-size:14.5px;line-height:1.6;color:var(--anatomy-text);min-height:3.2em}
.dp-step-count{font:500 12px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--anatomy-muted);margin-right:6px}
.dp-steps .dp-play{flex:none;display:inline-flex;align-items:center;gap:7px;min-height:36px;padding:6px 12px}
.dp-play-icon{font-size:10px;letter-spacing:-1px}
@media (max-width:520px){.dp-long{display:none}.dp-short{display:inline}.dp-step-info{flex-direction:column;gap:8px}.dp-steps .dp-play{align-self:flex-start}}
.dp-footer{display:flex;justify-content:space-between;gap:16px;margin-top:64px;padding-top:20px;border-top:1px solid var(--anatomy-faint);font-size:14px}
.dp-footer a{color:var(--anatomy-text);text-decoration:none}
.dp-footer a:hover,.dp-footer a:focus-visible{color:var(--anatomy-strong);text-decoration:underline}
.iso-figure{margin:28px 0 8px}
@media (max-width:520px){.dp-article p,.dp-article li{font-size:15px}.dp-table{font-size:13px}.iso-plate{padding-left:6px;padding-right:6px}}
`;

// Step controls: see stepsHtml.
export const STEPS_SCRIPT = `
(() => {
  for (const bar of document.querySelectorAll(".dp-steps")) {
    const stage = bar.closest(".iso-figure")?.querySelector(".iso-stage");
    if (!stage) continue;
    const captions = JSON.parse(bar.dataset.captions);
    const choices = [...bar.querySelectorAll("[data-step]")];
    const caption = bar.querySelector(".dp-step-caption");
    const play = bar.querySelector("[data-play]");
    let index = 0, touring = true;
    const select = (i) => stage.dispatchEvent(new CustomEvent("dp:select", { detail: { index: i } }));
    choices.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.step))));
    bar.querySelector("[data-prev]").addEventListener("click", () => select((index - 1 + choices.length) % choices.length));
    bar.querySelector("[data-next]").addEventListener("click", () => select((index + 1) % choices.length));
    play.addEventListener("click", () => stage.dispatchEvent(new CustomEvent(touring ? "dp:pause" : "dp:play")));
    stage.addEventListener("dp:state", (event) => {
      const changed = event.detail.index !== index;
      index = event.detail.index;
      touring = event.detail.touring;
      choices.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
      // Announce steps the reader chose, not every step of the automatic run.
      caption.setAttribute("aria-live", touring ? "off" : "polite");
      if (changed || !caption.dataset.ready) {
        caption.dataset.ready = "1";
        caption.innerHTML = '<span class="dp-step-count">Bước ' + (index + 1) + "/" + choices.length + "</span> " + captions[index];
      }
      play.setAttribute("aria-pressed", String(touring));
      play.querySelector(".dp-play-icon").textContent = touring ? "❚❚" : "▶";
      play.querySelector(".dp-play-text").textContent = touring ? "Tạm dừng" : "Tự chạy";
    });
  }
})();
`;

// Tabs: one choice of language for every code block on the page, remembered per browser.
export const TABS_SCRIPT = `
(() => {
  const KEY = "dp-lang";
  const groups = [...document.querySelectorAll(".dp-code")];
  const show = (lang, focus) => {
    for (const group of groups) {
      const buttons = [...group.querySelectorAll('[role="tab"]')];
      if (!buttons.some((b) => b.dataset.lang === lang)) continue;
      for (const b of buttons) {
        const on = b.dataset.lang === lang;
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focus === b) b.focus();
      }
      for (const panel of group.querySelectorAll('[role="tabpanel"]')) panel.hidden = panel.dataset.lang !== lang;
    }
  };
  for (const group of groups) {
    const buttons = [...group.querySelectorAll('[role="tab"]')];
    buttons.forEach((button, i) => {
      button.addEventListener("click", () => { show(button.dataset.lang); try { localStorage.setItem(KEY, button.dataset.lang); } catch {} });
      button.addEventListener("keydown", (event) => {
        const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        const next = buttons[(i + step + buttons.length) % buttons.length];
        show(next.dataset.lang, next);
        try { localStorage.setItem(KEY, next.dataset.lang); } catch {}
      });
    });
  }
  try { const saved = localStorage.getItem(KEY); if (saved) show(saved); } catch {}
})();
`;

// JetBrains Mono carries every Vietnamese letter; the system monospace fonts on
// Linux (Ubuntu Mono, DejaVu Sans Mono) and Menlo miss the stacked-accent ones.
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap">';

// The whole page: breadcrumbs, the article, and the footer link back to the module.
export function patternPage({ title, description, group, body, figureCss = "", script = "" }) {
  const head = `<style>${ARTICLE_CSS}${figureCss}</style>
<nav class="dp-crumbs" aria-label="Đường dẫn"><a href="../../">Anatomy Docs</a><span aria-hidden="true">/</span><a href="../">Design patterns</a><span aria-hidden="true">/</span><span>${esc(group)}</span></nav>`;
  const footer = `<footer class="dp-footer"><a href="../">← Tất cả design pattern</a><a href="../../">Trang chủ</a></footer>`;
  return k
    .pageHtml({ title: `${title} · Design patterns`, theme: "light", width: 760, body: `${head}<article class="dp-article">${body}</article>${footer}`, script: `${STEPS_SCRIPT}\n${script}\n${TABS_SCRIPT}` })
    .replace('<html lang="en">', '<html lang="vi">')
    .replace("</title>", `</title><meta name="description" content="${esc(description)}">${FONTS}`);
}
