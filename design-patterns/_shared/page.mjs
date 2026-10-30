// Shared page shell for the design-patterns module: header, article styles,
// syntax highlighting and Python/TypeScript code tabs. Each pattern's build.mjs
// renders its figure with the anatomy kit and passes the rest of the page here.

import { readFileSync } from "node:fs";
import * as k from "/home/tuanpham/.claude/skills/anatomy/kit/iso-kit.mjs";
import { READING_ORDER } from "../catalog.mjs";

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
    <div class="dp-step-info"><div class="dp-step-text"><p class="dp-step-caption" aria-live="off"><span class="dp-step-count">Bước ${start + 1}/${steps.length}</span> ${steps[start].caption}</p>${steps.map((step, i) => `<p class="dp-step-caption dp-sizer" aria-hidden="true"><span class="dp-step-count">Bước ${i + 1}/${steps.length}</span> ${step.caption}</p>`).join("")}</div><button type="button" class="dp-play" data-play aria-pressed="true"><span aria-hidden="true" class="dp-play-icon">❚❚</span><span class="dp-play-text">Tạm dừng</span></button></div>
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
.dp-step-caption{margin:0;font-size:14.5px;line-height:1.6;color:var(--anatomy-text)}
/* Every caption sits in the same grid cell, the hidden ones only to hold the height of the longest, so the page below never jumps between steps. */
.dp-step-text{display:grid;flex:1;min-width:0}
.dp-step-text>p{grid-area:1/1}
.dp-sizer{visibility:hidden}
.dp-step-count{font:500 12px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--anatomy-muted);margin-right:6px}
.dp-steps .dp-play{flex:none;display:inline-flex;align-items:center;gap:7px;min-height:36px;padding:6px 12px}
.dp-play-icon{font-size:10px;letter-spacing:-1px}
@media (max-width:520px){.dp-long{display:none}.dp-short{display:inline}.dp-step-info{flex-direction:column;gap:8px}.dp-steps .dp-play{align-self:flex-start}}
.dp-footer{display:flex;justify-content:space-between;gap:16px;margin-top:64px;padding-top:20px;border-top:1px solid var(--anatomy-faint);font-size:14px}
.dp-footer a{color:var(--anatomy-text);text-decoration:none}
.dp-footer a:hover,.dp-footer a:focus-visible{color:var(--anatomy-strong);text-decoration:underline}
.iso-figure{margin:28px 0 8px}
/* Rounded like the cards on the module page. */
.iso-plate{border-radius:12px}
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
// Quiz at the end of a lesson: 4-7 questions, each with 3-4 options, one right
// answer and a short explanation that shows once the reader picks an option.
const COUNT_WORDS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười"];

export function quizHtml(questions, name) {
  if (!Array.isArray(questions) || questions.length < 4 || questions.length > 7) throw new Error(`quiz for ${name}: needs 4-7 questions, got ${questions?.length}`);
  questions.forEach((item, i) => {
    if (!item.q || !item.why || !Array.isArray(item.options) || item.options.length < 3 || item.options.length > 4) throw new Error(`quiz for ${name}, question ${i + 1}: needs q, why and 3-4 options`);
    if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= item.options.length) throw new Error(`quiz for ${name}, question ${i + 1}: answer out of range`);
  });
  const most = Math.max(...[0, 1, 2, 3].map((k) => questions.filter((item) => item.answer === k).length));
  if (most > Math.ceil(questions.length / 2)) throw new Error(`quiz for ${name}: too many answers in the same position`);
  const items = questions.map((item, i) => `<li class="dp-q" data-answer="${item.answer}">
      <p class="dp-q-text" id="dp-q${i + 1}"><span class="dp-q-num">Câu ${i + 1}</span> ${item.q}</p>
      <div class="dp-opts" role="group" aria-labelledby="dp-q${i + 1}">${item.options.map((option, j) => `<button type="button" class="dp-opt" aria-pressed="false"><span class="dp-key" aria-hidden="true">${"ABCD"[j]}</span><span>${option}</span></button>`).join("")}</div>
      <div class="dp-why" hidden><strong class="dp-verdict"></strong> ${item.why}</div>
    </li>`).join("\n    ");
  const count = COUNT_WORDS[questions.length];
  return `<section class="dp-quiz" aria-labelledby="dp-quiz-title">
  <h2 id="dp-quiz-title">Kiểm tra nhanh</h2>
  <p>${count[0].toUpperCase() + count.slice(1)} câu hỏi ngắn để xem bạn đã nắm ${esc(name)} tới đâu. Chọn một đáp án, lời giải thích sẽ hiện ngay bên dưới.</p>
  <ol class="dp-qs">
    ${items}
  </ol>
  <div class="dp-quiz-foot"><p class="dp-quiz-status" aria-live="polite"></p><button type="button" class="dp-reset" hidden>Làm lại</button></div>
</section>`;
}

const QUIZ_CSS = `
.dp-quiz{margin-top:56px}
.dp-qs{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:14px}
.dp-q{border:1px solid var(--anatomy-faint);border-radius:12px;background:var(--anatomy-card);padding:16px 16px 14px}
.dp-article .dp-q-text{margin:0 0 12px;font-size:15.5px;line-height:1.6;color:var(--anatomy-strong);max-width:none}
.dp-q-num{display:block;margin-bottom:4px;font:500 12px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--anatomy-muted)}
.dp-opts{display:grid;gap:8px}
.dp-opt{display:flex;align-items:flex-start;gap:10px;width:100%;min-height:46px;padding:10px 12px;border:1px solid var(--anatomy-faint);border-radius:8px;background:transparent;color:var(--anatomy-text);font:inherit;font-size:15px;line-height:1.5;text-align:left;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.dp-opt:hover:not(:disabled){border-color:var(--anatomy-lo);color:var(--anatomy-strong)}
.dp-opt:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:2px}
.dp-opt:disabled{cursor:default}
.dp-key{flex:none;display:inline-grid;place-items:center;width:24px;height:24px;margin-top:-1px;border:1px solid var(--anatomy-lo);border-radius:50%;font:500 12px/1 ui-sans-serif,system-ui,sans-serif;color:var(--anatomy-muted)}
.dp-opt[data-state="right"]{border-color:#2f7a52;background:rgba(47,122,82,.07);color:var(--anatomy-strong)}
.dp-opt[data-state="right"] .dp-key{border-color:#2f7a52;background:#2f7a52;color:#fff}
.dp-opt[data-state="wrong"]{border-color:#b4442f;background:rgba(180,68,47,.06)}
.dp-opt[data-state="wrong"] .dp-key{border-color:#b4442f;background:#b4442f;color:#fff}
.dp-opt:disabled:not([data-state]){opacity:.6}
.dp-why{margin-top:12px;padding:10px 12px;border-left:2px solid var(--anatomy-lo);font-size:14.5px;line-height:1.65;color:var(--anatomy-text)}
.dp-q[data-result="right"] .dp-why{border-left-color:#2f7a52}
.dp-q[data-result="wrong"] .dp-why{border-left-color:#b4442f}
.dp-quiz-foot{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:16px}
.dp-article .dp-quiz-status{margin:0;font-size:14.5px;color:var(--anatomy-text)}
.dp-reset{flex:none;min-height:40px;padding:8px 16px;border:1px solid var(--anatomy-faint);border-radius:8px;background:var(--anatomy-card);color:var(--anatomy-strong);font:500 14px/1 ui-sans-serif,system-ui,sans-serif;cursor:pointer}
.dp-reset:hover{border-color:var(--anatomy-lo)}
`;

export const QUIZ_SCRIPT = `
(() => {
  for (const quiz of document.querySelectorAll(".dp-quiz")) {
    const items = [...quiz.querySelectorAll(".dp-q")];
    const status = quiz.querySelector(".dp-quiz-status");
    const reset = quiz.querySelector(".dp-reset");
    const show = (last) => {
      const done = items.filter((q) => q.dataset.result);
      const right = done.filter((q) => q.dataset.result === "right").length;
      const head = last ? last + " " : "";
      status.textContent = done.length < items.length
        ? head + "Đã trả lời " + done.length + "/" + items.length + " câu, đúng " + right + " câu."
        : head + "Xong! Bạn trả lời đúng " + right + "/" + items.length + " câu." + (right === items.length ? " Rất tốt." : " Hãy đọc lại lời giải thích ở những câu chưa đúng.");
      reset.hidden = done.length === 0;
    };
    items.forEach((q, n) => {
      const options = [...q.querySelectorAll(".dp-opt")];
      options.forEach((button, i) => button.addEventListener("click", () => {
        if (q.dataset.result) return;
        const ok = String(i) === q.dataset.answer;
        q.dataset.result = ok ? "right" : "wrong";
        options.forEach((b, j) => {
          b.disabled = true;
          if (String(j) === q.dataset.answer) b.dataset.state = "right";
          else if (j === i) b.dataset.state = "wrong";
        });
        button.setAttribute("aria-pressed", "true");
        q.querySelector(".dp-verdict").textContent = ok ? "Đúng rồi." : "Chưa đúng.";
        q.querySelector(".dp-why").hidden = false;
        show("Câu " + (n + 1) + ": " + (ok ? "đúng." : "chưa đúng."));
      }));
    });
    reset.addEventListener("click", () => {
      for (const q of items) {
        delete q.dataset.result;
        for (const b of q.querySelectorAll(".dp-opt")) { b.disabled = false; delete b.dataset.state; b.setAttribute("aria-pressed", "false"); }
        q.querySelector(".dp-why").hidden = true;
      }
      show("");
      quiz.scrollIntoView({ block: "start" });
      items[0].querySelector(".dp-opt").focus({ preventScroll: true });
    });
    show("");
  }
})();
`;

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap">';

// The whole page: breadcrumbs, the article, and the footer link back to the module.
// Line icons for the phone tab bars (24-unit box, drawn in currentColor).
const icon = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
export const ICONS = {
  home: icon('<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9h11v-9"/><path d="M10 19v-5h4v5"/>'),
  creational: icon('<rect x="4.5" y="4.5" width="15" height="15" rx="3"/><path d="M12 8.5v7M8.5 12h7"/>'),
  structural: icon('<rect x="4" y="4" width="9.5" height="9.5" rx="2"/><rect x="10.5" y="10.5" width="9.5" height="9.5" rx="2"/>'),
  behavioral: icon('<path d="M5 8.5h12.5M14.5 5.5l3 3-3 3"/><path d="M19 15.5H6.5M9.5 12.5l-3 3 3 3"/>'),
  list: icon('<rect x="4.5" y="4.5" width="6" height="6" rx="1.5"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.5"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.5"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.5"/>'),
  prev: icon('<path d="M14.5 6 8.5 12l6 6"/>'),
  next: icon('<path d="M9.5 6l6 6-6 6"/>'),
};

// Previous and next lesson: two cards at the end of the article, and a tab bar
// fixed to the bottom of the screen on phones.
const NAV_CSS = `
.dp-pager{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:56px}
.dp-pager a{display:flex;flex-direction:column;gap:3px;padding:12px 16px;border:1px solid var(--anatomy-faint);border-radius:10px;background:var(--anatomy-card);color:var(--anatomy-text);text-decoration:none;min-width:0}
.dp-pager a:hover,.dp-pager a:focus-visible{border-color:var(--anatomy-lo)}
.dp-pager span{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--anatomy-muted)}
.dp-pager strong{font-size:15.5px;font-weight:600;color:var(--anatomy-strong)}
.dp-pager .next{grid-column:2;text-align:right}
.dp-pager+.dp-footer{margin-top:28px}
.dp-tabbar{display:none}
@media (max-width:760px){
body{padding-bottom:calc(62px + env(safe-area-inset-bottom))}
.dp-tabbar{display:grid;grid-template-columns:1fr auto 1fr;position:fixed;left:0;right:0;bottom:0;z-index:10;padding:0 6px env(safe-area-inset-bottom);background:var(--anatomy-card);background:color-mix(in srgb,var(--anatomy-card) 94%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-top:1px solid var(--anatomy-faint)}
.dp-tabbar a,.dp-tabbar .off{display:flex;align-items:center;gap:4px;min-width:0;min-height:62px;padding:0 8px;color:var(--anatomy-text);text-decoration:none;font:500 13px/1.25 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-tap-highlight-color:transparent}
.dp-tabbar .next{justify-content:flex-end;text-align:right}
.dp-tabbar .list{flex-direction:column;justify-content:center;gap:3px;padding:0 16px;font-size:11px;color:var(--anatomy-strong)}
.dp-tabbar .nm{display:flex;flex-direction:column;min-width:0}
.dp-tabbar .nm small{font-size:11px;color:var(--anatomy-muted)}
.dp-tabbar .nm b{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dp-tabbar svg{flex:none;width:22px;height:22px}
.dp-tabbar .off{visibility:hidden}
.dp-pager{margin-top:44px}
}
`;

function pager(title) {
  const at = READING_ORDER.findIndex((p) => p.name === title);
  if (at < 0) throw new Error(`patternPage: "${title}" is not a ready pattern in catalog.mjs`);
  const prev = READING_ORDER[at - 1];
  const next = READING_ORDER[at + 1];
  const cards = `<nav class="dp-pager" aria-label="Bài trước và bài sau">${prev ? `<a class="prev" href="../${prev.slug}/" rel="prev"><span>← Bài trước</span><strong>${esc(prev.name)}</strong></a>` : ""}${next ? `<a class="next" href="../${next.slug}/" rel="next"><span>Bài sau →</span><strong>${esc(next.name)}</strong></a>` : ""}</nav>`;
  const side = (p, dir) => p
    ? `<a class="${dir}" href="../${p.slug}/" aria-label="${dir === "prev" ? "Bài trước" : "Bài sau"}: ${esc(p.name)}">${dir === "prev" ? ICONS.prev : ""}<span class="nm"><small>${dir === "prev" ? "Bài trước" : "Bài sau"}</small><b>${esc(p.name)}</b></span>${dir === "next" ? ICONS.next : ""}</a>`
    : `<span class="off ${dir}" aria-hidden="true"></span>`;
  const bar = `<nav class="dp-tabbar" aria-label="Chuyển bài">${side(prev, "prev")}<a class="list" href="../">${ICONS.list}<span>Tất cả bài</span></a>${side(next, "next")}</nav>`;
  return { cards, bar };
}

// Keeps a number and its unit on one line ("860.000 ₫", "3,5 kg") everywhere
// outside code, which stays byte-exact so copied examples still run.
function keepUnits(html) {
  return html
    .split(/(<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>|<script[\s\S]*?<\/script>)/)
    .map((part, i) => (i % 2 ? part : part.replace(/(\d) (₫|kg|km)(?![\p{L}])/gu, "$1&nbsp;$2")))
    .join("");
}

export function patternPage({ title, description, group, body, quiz, figureCss = "", script = "" }) {
  const nav = pager(title);
  const head = `<style>${ARTICLE_CSS}${NAV_CSS}${QUIZ_CSS}${figureCss}</style>
<nav class="dp-crumbs" aria-label="Đường dẫn"><a href="../../">Anatomy Docs</a><span aria-hidden="true">/</span><a href="../">Design patterns</a><span aria-hidden="true">/</span><span>${esc(group)}</span></nav>`;
  const footer = `${nav.cards}<footer class="dp-footer"><a href="../">← Tất cả design pattern</a><a href="../../">Trang chủ</a></footer>`;
  return k
    .pageHtml({ title: `${title} · Design patterns`, theme: "light", width: 760, body: `${head}<article class="dp-article">${keepUnits(body + (quiz ? quizHtml(quiz, title) : ""))}</article>${footer}`, script: `${STEPS_SCRIPT}\n${script}\n${TABS_SCRIPT}\n${QUIZ_SCRIPT}` })
    .replace('<html lang="en">', '<html lang="vi">')
    .replace('<meta name="viewport" content="width=device-width, initial-scale=1">', '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">')
    .replace("</main>", `</main>${nav.bar}`)
    .replace("</title>", `</title><meta name="description" content="${esc(description)}">${FONTS}`);
}
