/**
 * calculatrice.js — Mathenlarge
 * Calculatrice flottante (simple + scientifique) à injecter une seule fois.
 * Usage : <script src="calculatrice.js" defer></script>
 */
(function () {
  // ── Styles ──────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Nunito:wght@600;700;800&display=swap');

    :root {
      --calc-bg: #0f1117;
      --calc-surface: #181c27;
      --calc-border: #2a2f42;
      --calc-accent: #6c8aff;
      --calc-accent2: #a78bfa;
      --calc-text: #e8eaf6;
      --calc-muted: #7b82a0;
      --calc-btn: #1e2235;
      --calc-btn-hover: #252b42;
      --calc-btn-op: #1a2040;
      --calc-btn-op-hover: #1f2850;
      --calc-btn-eq: #6c8aff;
      --calc-btn-eq-hover: #8ba3ff;
      --calc-btn-sci: #14183a;
      --calc-btn-sci-hover: #1c2350;
      --calc-danger: #ff6b8a;
      --calc-radius: 16px;
      --calc-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(108,138,255,0.15);
    }

    #calc-fab {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 99998;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--calc-accent), var(--calc-accent2));
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      box-shadow: 0 8px 32px rgba(108,138,255,0.45), 0 2px 8px rgba(0,0,0,0.4);
      transition: transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s;
      user-select: none;
    }
    #calc-fab:hover {
      transform: scale(1.12) rotate(-8deg);
      box-shadow: 0 12px 40px rgba(108,138,255,0.6), 0 2px 8px rgba(0,0,0,0.4);
    }
    #calc-fab.calc-open {
      transform: scale(0.9) rotate(45deg);
    }

    #calc-panel {
      position: fixed;
      bottom: 96px;
      right: 28px;
      z-index: 99997;
      width: 320px;
      max-height: calc(100vh - 110px);
      background: var(--calc-bg);
      border: 1px solid var(--calc-border);
      border-radius: var(--calc-radius);
      box-shadow: var(--calc-shadow);
      font-family: 'Nunito', sans-serif;
      overflow-y: auto;
      overflow-x: hidden;
      transform-origin: bottom right;
      transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), opacity 0.18s;
      transform: scale(0.85) translateY(8px);
      opacity: 0;
      pointer-events: none;
    }
    #calc-panel.calc-visible {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }
    #calc-panel.calc-sci {
      width: 380px;
    }

    /* Header */
    .calc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 10px;
      background: var(--calc-surface);
      border-bottom: 1px solid var(--calc-border);
    }
    .calc-title {
      font-size: 13px;
      font-weight: 800;
      color: var(--calc-muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .calc-mode-toggle {
      display: flex;
      gap: 4px;
    }
    .calc-mode-btn {
      padding: 4px 10px;
      border-radius: 8px;
      border: 1px solid var(--calc-border);
      background: transparent;
      color: var(--calc-muted);
      font-size: 11px;
      font-weight: 700;
      font-family: 'Nunito', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }
    .calc-mode-btn.active {
      background: var(--calc-accent);
      border-color: var(--calc-accent);
      color: #fff;
    }

    /* Display */
    .calc-display {
      padding: 14px 18px 10px;
      background: var(--calc-bg);
      min-height: 72px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }
    .calc-expr {
      font-family: 'DM Mono', monospace;
      font-size: 12px;
      color: var(--calc-muted);
      min-height: 16px;
      word-break: break-all;
      text-align: right;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .calc-result {
      font-family: 'DM Mono', monospace;
      font-size: 28px;
      font-weight: 500;
      color: var(--calc-text);
      word-break: break-all;
      text-align: right;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color 0.1s;
    }
    .calc-result.calc-error { color: var(--calc-danger); font-size: 18px; }

    /* Buttons grid */
    .calc-btns {
      display: grid;
      gap: 6px;
      padding: 10px 12px 14px;
      background: var(--calc-bg);
    }
    .calc-btns.simple { grid-template-columns: repeat(4, 1fr); }
    .calc-btns.sci    { grid-template-columns: repeat(5, 1fr); }

    .calc-btn {
      height: 46px;
      border-radius: 10px;
      border: 1px solid var(--calc-border);
      background: var(--calc-btn);
      color: var(--calc-text);
      font-size: 15px;
      font-weight: 700;
      font-family: 'Nunito', sans-serif;
      cursor: pointer;
      transition: background 0.12s, transform 0.08s, border-color 0.12s;
      user-select: none;
      position: relative;
      overflow: hidden;
    }
    .calc-btn:hover  { background: var(--calc-btn-hover); }
    .calc-btn:active { transform: scale(0.93); }

    .calc-btn.op {
      background: var(--calc-btn-op);
      color: var(--calc-accent);
      border-color: #2a3860;
    }
    .calc-btn.op:hover { background: var(--calc-btn-op-hover); }

    .calc-btn.eq {
      background: var(--calc-btn-eq);
      border-color: var(--calc-btn-eq);
      color: #fff;
      font-size: 18px;
    }
    .calc-btn.eq:hover { background: var(--calc-btn-eq-hover); border-color: var(--calc-btn-eq-hover); }

    .calc-btn.clear {
      background: rgba(255,107,138,0.12);
      color: var(--calc-danger);
      border-color: rgba(255,107,138,0.25);
    }
    .calc-btn.clear:hover { background: rgba(255,107,138,0.22); }

    .calc-btn.sci-fn {
      background: var(--calc-btn-sci);
      color: var(--calc-accent2);
      border-color: #22275a;
      font-size: 12px;
      font-weight: 800;
    }
    .calc-btn.sci-fn:hover { background: var(--calc-btn-sci-hover); }

    .calc-btn.span2 { grid-column: span 2; }

    /* ripple */
    .calc-btn::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.06);
      opacity: 0;
      transition: opacity 0.1s;
      border-radius: inherit;
    }
    .calc-btn:active::after { opacity: 1; }
  `;
  document.head.appendChild(style);

  // ── State ────────────────────────────────────────────────────────────────
  let expression = "";
  let displayExpr = "";
  let mode = "simple"; // "simple" | "sci"
  let justEvaled = false;

  // ── DOM ──────────────────────────────────────────────────────────────────
  const fab = document.createElement("button");
  fab.id = "calc-fab";
  fab.title = "Calculatrice";
  fab.setAttribute("aria-label", "Ouvrir la calculatrice");
  fab.innerHTML = "🧮";

  const panel = document.createElement("div");
  panel.id = "calc-panel";

  document.body.appendChild(panel);
  document.body.appendChild(fab);

  // ── Build UI ─────────────────────────────────────────────────────────────
  function buildPanel() {
    panel.className = "calc-panel" + (mode === "sci" ? " calc-sci" : "");

    const simpleButtons = [
      { label: "AC",   cls: "clear",       action: "clear" },
      { label: "±",    cls: "op",          action: "sign" },
      { label: "%",    cls: "op",          action: "pct" },
      { label: "÷",    cls: "op",          action: "op", val: "/" },
      { label: "7",    cls: "",            action: "digit", val: "7" },
      { label: "8",    cls: "",            action: "digit", val: "8" },
      { label: "9",    cls: "",            action: "digit", val: "9" },
      { label: "×",    cls: "op",          action: "op",   val: "*" },
      { label: "4",    cls: "",            action: "digit", val: "4" },
      { label: "5",    cls: "",            action: "digit", val: "5" },
      { label: "6",    cls: "",            action: "digit", val: "6" },
      { label: "−",    cls: "op",          action: "op",   val: "-" },
      { label: "1",    cls: "",            action: "digit", val: "1" },
      { label: "2",    cls: "",            action: "digit", val: "2" },
      { label: "3",    cls: "",            action: "digit", val: "3" },
      { label: "+",    cls: "op",          action: "op",   val: "+" },
      { label: "0",    cls: "span2",       action: "digit", val: "0" },
      { label: ".",    cls: "",            action: "dot" },
      { label: "=",    cls: "eq",          action: "eval" },
    ];

    const sciBtns = [
      { label: "sin",  cls: "sci-fn",  action: "fn", val: "Math.sin(" },
      { label: "cos",  cls: "sci-fn",  action: "fn", val: "Math.cos(" },
      { label: "tan",  cls: "sci-fn",  action: "fn", val: "Math.tan(" },
      { label: "π",    cls: "sci-fn",  action: "const", val: String(Math.PI) },
      { label: "e",    cls: "sci-fn",  action: "const", val: String(Math.E) },
      { label: "√",    cls: "sci-fn",  action: "fn",  val: "Math.sqrt(" },
      { label: "x²",   cls: "sci-fn",  action: "pow2" },
      { label: "xⁿ",   cls: "sci-fn",  action: "op",  val: "**" },
      { label: "log",  cls: "sci-fn",  action: "fn",  val: "Math.log10(" },
      { label: "ln",   cls: "sci-fn",  action: "fn",  val: "Math.log(" },
      { label: "(",    cls: "sci-fn",  action: "digit", val: "(" },
      { label: ")",    cls: "sci-fn",  action: "digit", val: ")" },
      { label: "1/x",  cls: "sci-fn",  action: "inv" },
      { label: "|x|",  cls: "sci-fn",  action: "abs" },
      { label: "⌫",    cls: "sci-fn clear",  action: "back" },
    ];

    const sciSimple = [
      { label: "AC",   cls: "clear",   action: "clear" },
      { label: "±",    cls: "op",      action: "sign" },
      { label: "%",    cls: "op",      action: "pct" },
      { label: "÷",    cls: "op",      action: "op",   val: "/" },
      { label: "×",    cls: "op",      action: "op",   val: "*" },
      { label: "7",    cls: "",        action: "digit", val: "7" },
      { label: "8",    cls: "",        action: "digit", val: "8" },
      { label: "9",    cls: "",        action: "digit", val: "9" },
      { label: "−",    cls: "op",      action: "op",   val: "-" },
      { label: "+",    cls: "op",      action: "op",   val: "+" },
      { label: "4",    cls: "",        action: "digit", val: "4" },
      { label: "5",    cls: "",        action: "digit", val: "5" },
      { label: "6",    cls: "",        action: "digit", val: "6" },
      { label: "1",    cls: "",        action: "digit", val: "1" },
      { label: "2",    cls: "",        action: "digit", val: "2" },
      { label: "3",    cls: "",        action: "digit", val: "3" },
      { label: "0",    cls: "span2",   action: "digit", val: "0" },
      { label: ".",    cls: "",        action: "dot" },
      { label: "=",    cls: "eq span2", action: "eval" },
    ];

    panel.innerHTML = `
      <div class="calc-header">
        <span class="calc-title">Calculatrice</span>
        <div class="calc-mode-toggle">
          <button class="calc-mode-btn ${mode === 'simple' ? 'active' : ''}" data-mode="simple">Simple</button>
          <button class="calc-mode-btn ${mode === 'sci' ? 'active' : ''}" data-mode="sci">Sci</button>
        </div>
      </div>
      <div class="calc-display">
        <div class="calc-expr" id="calc-expr-display">${displayExpr || ""}</div>
        <div class="calc-result" id="calc-result-display">0</div>
      </div>
      <div class="calc-btns ${mode === 'simple' ? 'simple' : 'sci'}" id="calc-btns-grid"></div>
    `;

    const grid = panel.querySelector("#calc-btns-grid");
    const buttons = mode === "simple" ? simpleButtons : [...sciBtns, ...sciSimple];

    buttons.forEach(b => {
      const btn = document.createElement("button");
      btn.className = "calc-btn " + b.cls;
      btn.textContent = b.label;
      btn.dataset.action = b.action;
      if (b.val !== undefined) btn.dataset.val = b.val;
      btn.addEventListener("click", handleBtn);
      grid.appendChild(btn);
    });

    // Mode buttons
    panel.querySelectorAll(".calc-mode-btn").forEach(b => {
      b.addEventListener("click", () => {
        mode = b.dataset.mode;
        buildPanel();
        panel.classList.add("calc-visible");
      });
    });

    updateDisplay();
  }

  // ── Logic ────────────────────────────────────────────────────────────────
  function updateDisplay() {
    const exprEl   = panel.querySelector("#calc-expr-display");
    const resultEl = panel.querySelector("#calc-result-display");
    if (!exprEl || !resultEl) return;

    // Pretty-print expression
    const pretty = displayExpr
      .replace(/Math\.sin\(/g, "sin(")
      .replace(/Math\.cos\(/g, "cos(")
      .replace(/Math\.tan\(/g, "tan(")
      .replace(/Math\.sqrt\(/g, "√(")
      .replace(/Math\.log10\(/g, "log(")
      .replace(/Math\.log\(/g, "ln(")
      .replace(/\*/g, "×")
      .replace(/\//g, "÷");

    exprEl.textContent = pretty;

    if (expression === "") {
      resultEl.textContent = "0";
      resultEl.classList.remove("calc-error");
      return;
    }
    try {
      // Safe eval: allow only math chars
      const safe = expression.replace(/[^0-9+\-*/.()%Math\.sincotagqrtloe\s\*\*]/g, "");
      // eslint-disable-next-line no-new-func
      const res = Function('"use strict"; return (' + expression + ')')();
      if (!isFinite(res)) throw new Error();
      const str = parseFloat(res.toPrecision(12)).toString();
      resultEl.textContent = str;
      resultEl.classList.remove("calc-error");
    } catch {
      resultEl.textContent = expression === "" ? "0" : "...";
      resultEl.classList.remove("calc-error");
    }
  }

  function evalExpression() {
    const exprEl   = panel.querySelector("#calc-expr-display");
    const resultEl = panel.querySelector("#calc-result-display");
    if (!resultEl) return;
    try {
      // eslint-disable-next-line no-new-func
      const res = Function('"use strict"; return (' + expression + ')')();
      if (!isFinite(res)) throw new Error("Division par zéro");
      const str = parseFloat(res.toPrecision(12)).toString();
      if (exprEl) exprEl.textContent = resultEl.textContent + " =";
      expression = str;
      displayExpr = str;
      resultEl.textContent = str;
      resultEl.classList.remove("calc-error");
      justEvaled = true;
    } catch (err) {
      resultEl.textContent = "Erreur";
      resultEl.classList.add("calc-error");
      expression = "";
      displayExpr = "";
    }
  }

  function handleBtn(e) {
    const action = e.currentTarget.dataset.action;
    const val    = e.currentTarget.dataset.val;

    if (action === "clear") {
      expression = ""; displayExpr = ""; justEvaled = false;
    } else if (action === "back") {
      expression  = expression.slice(0, -1);
      displayExpr = displayExpr.slice(0, -1);
    } else if (action === "eval") {
      evalExpression(); return;
    } else if (action === "digit" || action === "op" || action === "fn" || action === "const") {
      if (justEvaled && action === "digit") { expression = ""; displayExpr = ""; }
      justEvaled = false;
      expression  += val;
      displayExpr += val;
    } else if (action === "dot") {
      // Avoid double dot in last number
      const parts = expression.split(/[\+\-\*\/]/);
      const last  = parts[parts.length - 1];
      if (!last.includes(".")) { expression += "."; displayExpr += "."; }
    } else if (action === "pct") {
      try {
        // eslint-disable-next-line no-new-func
        const r = Function('"use strict"; return (' + expression + ')')();
        expression  = String(r / 100);
        displayExpr = expression;
        justEvaled  = true;
      } catch {}
    } else if (action === "sign") {
      if (expression.startsWith("-")) { expression = expression.slice(1); displayExpr = displayExpr.slice(1); }
      else { expression = "-" + expression; displayExpr = "-" + displayExpr; }
    } else if (action === "pow2") {
      expression  += "**2";
      displayExpr += "²";
    } else if (action === "inv") {
      expression  = "1/(" + expression + ")";
      displayExpr = "1/(" + displayExpr + ")";
    } else if (action === "abs") {
      expression  = "Math.abs(" + expression + ")";
      displayExpr = "|" + displayExpr + "|";
    }

    updateDisplay();
  }

  // ── Toggle ───────────────────────────────────────────────────────────────
  let open = false;
  fab.addEventListener("click", () => {
    open = !open;
    fab.classList.toggle("calc-open", open);
    if (open) {
      buildPanel();
      requestAnimationFrame(() => panel.classList.add("calc-visible"));
    } else {
      panel.classList.remove("calc-visible");
    }
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (open && !panel.contains(e.target) && e.target !== fab && !fab.contains(e.target)) {
      open = false;
      fab.classList.remove("calc-open");
      panel.classList.remove("calc-visible");
    }
  }, true);

  // Keyboard support
  document.addEventListener("keydown", (e) => {
    if (!open) return;
    const map = {
      "0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",
      "+":"+","-":"-","*":"*","/":"/","(":"(",")":")",".":"."
    };
    if (map[e.key]) { expression += map[e.key]; displayExpr += map[e.key]; updateDisplay(); }
    else if (e.key === "Enter" || e.key === "=") { evalExpression(); }
    else if (e.key === "Backspace") { expression = expression.slice(0,-1); displayExpr = displayExpr.slice(0,-1); updateDisplay(); }
    else if (e.key === "Escape") { expression = ""; displayExpr = ""; updateDisplay(); }
  });

  // Initial build (hidden)
  buildPanel();
})();
