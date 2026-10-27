/* =====================================================================
 *  V-Lab 도구 패널 — 단위 환산 · 공학용/화학 계산기 · 과목별 부록 자료
 *  상단 바의 '도구' 버튼으로 열고, 다시 누르거나 바깥을 누르면 닫힙니다.
 *  자료는 data/reference/*.js (window.VLAB_REF) 에서 읽습니다.
 * ===================================================================== */
(function () {
  "use strict";
  const REF = window.VLAB_REF || {};
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
  const sup = n => String(n).split("").map(d => SUP[+d]).join("");
  const fmt = x => {
    if (!isFinite(x)) return "—";
    if (x === 0) return "0";
    const a = Math.abs(x);
    if (a >= 1e7 || a < 1e-4) return x.toExponential(4).replace(/\.?0+e/, "e");
    return String(+x.toPrecision(7));
  };

  /* ================================================================
   * 원소 자료 (전자 배치 생성, 주기율표 위치)
   * ================================================================ */
  const ELEMENTS = (REF.elements || []).map(e => ({ z: e[0], sym: e[1], name: e[2], mass: e[3], en: e[4], ie: e[5] }));
  const ORDER = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s", "4d", "5p", "6s", "4f", "5d", "6p", "7s", "5f", "6d", "7p"];
  const CAP = { s: 2, p: 6, d: 10, f: 14 };
  const NOBLE = [2, 10, 18, 36, 54, 86];
  function fill(Z) { let rem = Z; const parts = []; for (const o of ORDER) { if (!rem) break; const n = Math.min(CAP[o[1]], rem); parts.push([o, n]); rem -= n; } return parts; }
  function econfig(Z) {
    if (REF.ecExceptions && REF.ecExceptions[Z]) return REF.ecExceptions[Z];
    const parts = fill(Z);
    const core = [...NOBLE].reverse().find(n => n < Z);
    const coreParts = core ? fill(core).length : 0;
    const L = { s: 0, p: 1, d: 2, f: 3 };
    const body = parts.slice(coreParts).sort((a, b) => (+a[0][0] - +b[0][0]) || (L[a[0][1]] - L[b[0][1]])).map(([o, n]) => o + sup(n)).join(" ");   // 표기는 주양자수 순
    return (core ? `[${ELEMENTS[core - 1].sym}] ` : "") + (body || parts.map(([o, n]) => o + sup(n)).join(" "));
  }
  function position(Z) {                                   // [주기, 족] (란타넘족·악티늄족은 별도 줄)
    const periods = [[1, 2], [3, 10], [11, 18], [19, 36], [37, 54], [55, 86], [87, 118]];
    const p = periods.findIndex(([a, b]) => Z >= a && Z <= b) + 1;
    const start = periods[p - 1][0];
    if (p === 1) return [1, Z === 1 ? 1 : 18];
    if (p <= 3) { const i = Z - start; return [p, i < 2 ? i + 1 : i + 11]; }
    if (p <= 5) return [p, Z - start + 1];
    const i = Z - start;                                    // 6, 7 주기
    if (i < 2) return [p, i + 1];
    if (i < 17) return [p === 6 ? "L" : "A", i - 1];        // f-블록: 열 index 1..15
    return [p, i - 14];
  }
  const block = Z => { const [p, g] = position(Z); if (p === "L" || p === "A") return "f"; if (g <= 2 || Z === 2) return "s"; if (g >= 13) return "p"; return "d"; };

  /* ================================================================
   * 단위 환산
   * ================================================================ */
  const CONV = {
    "압력": { atm: 1, mmHg: 1 / 760, kPa: 1 / 101.325, hPa: 1 / 1013.25, bar: 1 / 1.01325, Pa: 1 / 101325, psi: 1 / 14.6959 },
    "온도": "temp",
    "에너지": { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, eV: 1.602176634e-19, kWh: 3.6e6 },
    "몰당 에너지": { "kJ/mol": 1, "kcal/mol": 4.184, "J/mol": 0.001, "eV/입자": 96.485 },
    "부피": { L: 1, mL: 0.001, "m³": 1000, "cm³": 0.001, "dm³": 1, "μL": 1e-6 },
    "질량": { g: 1, kg: 1000, mg: 0.001, "μg": 1e-6, "u (원자 질량 단위)": 1.66053907e-24, lb: 453.592 },
    "길이": { m: 1, km: 1000, cm: 0.01, mm: 0.001, "μm": 1e-6, nm: 1e-9, "Å": 1e-10, pm: 1e-12 },
    "시간": { s: 1, min: 60, h: 3600, "일": 86400, "년": 3.156e7 },
    "속력": { "m/s": 1, "km/h": 1 / 3.6, "cm/s": 0.01, "km/s": 1000 },
    "힘": { N: 1, kN: 1000, dyn: 1e-5, kgf: 9.80665 },
    "농도": { "mol/L (M)": 1, "mmol/L": 1e-3, "μmol/L": 1e-6, "mol/m³": 1e-3 },
    "진동수·파장": "wave"
  };
  function renderConvert(body) {
    const cats = Object.keys(CONV);
    body.innerHTML = `<div class="tl-row"><select class="tl-sel" id="tlCat">${cats.map(c => `<option>${c}</option>`).join("")}</select><span class="tl-hint">한 칸에 값을 넣으면 나머지가 바뀝니다</span></div><div id="tlConv"></div>`;
    const sel = body.querySelector("#tlCat"), box = body.querySelector("#tlConv");
    const paint = () => {
      const cat = sel.value, def = CONV[cat];
      let units;
      if (def === "temp") units = ["°C", "K", "°F"];
      else if (def === "wave") units = ["진동수 f (Hz)", "파장 λ (m)", "파장 λ (nm)", "광자 에너지 E (eV)"];
      else units = Object.keys(def);
      box.innerHTML = units.map((u, i) => `<div class="tl-unit"><input type="text" inputmode="decimal" data-i="${i}" placeholder="0"><span>${esc(u)}</span></div>`).join("");
      const inputs = [...box.querySelectorAll("input")];
      inputs.forEach(inp => inp.addEventListener("input", () => {
        const v = parseFloat(inp.value.replace(/,/g, "")); const i = +inp.dataset.i;
        inputs.forEach(o => { if (o === inp) return; o.value = isNaN(v) ? "" : fmt(convert(cat, i, +o.dataset.i, v)); });
      }));
    };
    function convert(cat, from, to, v) {
      const def = CONV[cat];
      if (def === "temp") { const K = from === 0 ? v + 273.15 : from === 1 ? v : (v - 32) * 5 / 9 + 273.15; return to === 0 ? K - 273.15 : to === 1 ? K : (K - 273.15) * 9 / 5 + 32; }
      if (def === "wave") { const h = 6.62607015e-34, c = 2.99792458e8, eV = 1.602176634e-19; const f = from === 0 ? v : from === 1 ? c / v : from === 2 ? c / (v * 1e-9) : v * eV / h; return to === 0 ? f : to === 1 ? c / f : to === 2 ? c / f * 1e9 : h * f / eV; }
      const k = Object.values(def); return v * k[from] / k[to];
    }
    sel.addEventListener("change", paint); paint();
  }

  /* ================================================================
   * 계산기: 수식 파서 (안전, eval 사용 안 함)
   * ================================================================ */
  let angleDeg = true;
  const CONSTS = { pi: Math.PI, π: Math.PI, e: Math.E, R: 8.314462618, Ratm: 0.0820574, NA: 6.02214076e23, k: 1.380649e-23, h: 6.62607015e-34, c: 2.99792458e8, F: 96485.33212, g: 9.80665, qe: 1.602176634e-19, Kw: 1e-14 };
  const FUNCS = {
    sin: x => Math.sin(angleDeg ? x * Math.PI / 180 : x), cos: x => Math.cos(angleDeg ? x * Math.PI / 180 : x), tan: x => Math.tan(angleDeg ? x * Math.PI / 180 : x),
    asin: x => angleDeg ? Math.asin(x) * 180 / Math.PI : Math.asin(x), acos: x => angleDeg ? Math.acos(x) * 180 / Math.PI : Math.acos(x), atan: x => angleDeg ? Math.atan(x) * 180 / Math.PI : Math.atan(x),
    log: Math.log10, ln: Math.log, log2: Math.log2, exp: Math.exp, sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, fact: n => { if (n < 0 || n !== Math.floor(n) || n > 170) return NaN; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
  };
  function evaluate(src) {
    const s = src.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/\^/g, "^").replace(/√/g, "sqrt").replace(/π/g, "pi");
    let i = 0;
    const peek = () => s[i], skip = () => { while (s[i] === " ") i++; };
    function number() { skip(); const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(s.slice(i)); if (!m) throw 0; i += m[0].length; return parseFloat(m[0]); }
    function ident() { const m = /^[A-Za-zπ][A-Za-z0-9]*/.exec(s.slice(i)); if (!m) throw 0; i += m[0].length; return m[0]; }
    function primary() {
      skip(); const ch = peek();
      if (ch === "(") { i++; const v = expr(); skip(); if (peek() !== ")") throw 0; i++; return v; }
      if (ch === "-") { i++; return -unary(); }
      if (ch === "+") { i++; return unary(); }
      if (/[0-9.]/.test(ch)) return number();
      if (/[A-Za-zπ]/.test(ch)) {
        const id = ident(); skip();
        if (FUNCS[id]) { if (peek() !== "(") throw 0; i++; const v = expr(); skip(); if (peek() !== ")") throw 0; i++; return FUNCS[id](v); }
        if (id in CONSTS) return CONSTS[id];
        throw 0;
      }
      throw 0;
    }
    function postfix() { let v = primary(); skip(); while (peek() === "!") { i++; v = FUNCS.fact(v); skip(); } return v; }
    function unary() { skip(); if (peek() === "-") { i++; return -unary(); } return power(); }
    function power() { const b = postfix(); skip(); if (peek() === "^") { i++; return Math.pow(b, unary()); } return b; }
    function term() { let v = unary(); for (;;) { skip(); const ch = peek(); if (ch === "*") { i++; v *= unary(); } else if (ch === "/") { i++; v /= unary(); } else if (ch === "%") { i++; v %= unary(); } else return v; } }
    function expr() { let v = term(); for (;;) { skip(); const ch = peek(); if (ch === "+") { i++; v += term(); } else if (ch === "-") { i++; v -= term(); } else return v; } }
    const v = expr(); skip(); if (i < s.length) throw 0; return v;
  }

  /* 화학식 → 몰질량 (원소 기호·괄호·수화물 '·' 지원) */
  const MASS = Object.fromEntries(ELEMENTS.map(e => [e.sym, typeof e.mass === "number" ? e.mass : parseFloat(String(e.mass).replace(/[\[\]]/g, ""))]));
  function molarMass(formula) {
    const f = formula.replace(/[₀-₉]/g, d => "₀₁₂₃₄₅₆₇₈₉".indexOf(d)).replace(/\s+/g, "");
    const parts = f.split(/[·.•]/);
    let total = 0;
    for (const part of parts) {
      const m = /^(\d*)(.*)$/.exec(part); const mult = m[1] ? +m[1] : 1;
      total += mult * parsePart(m[2]);
    }
    return total;
    function parsePart(str) {
      let i = 0;
      function group() {
        let sum = 0;
        while (i < str.length) {
          const ch = str[i];
          if (ch === "(" || ch === "[") { i++; const inner = group(); const n = num(); sum += inner * n; }
          else if (ch === ")" || ch === "]") { i++; return sum; }
          else { const m = /^[A-Z][a-z]?/.exec(str.slice(i)); if (!m || !(m[0] in MASS)) throw new Error("알 수 없는 원소: " + (m ? m[0] : ch)); i += m[0].length; sum += MASS[m[0]] * num(); }
        }
        return sum;
      }
      function num() { const m = /^\d+/.exec(str.slice(i)); if (!m) return 1; i += m[0].length; return +m[0]; }
      const v = group(); if (i < str.length) throw new Error("괄호 오류"); return v;
    }
  }

  /* 공학용 계산기: 키패드 + 식 입력. Ans 는 직전 결과 */
  let lastAns = 0, shift = false, justEvaluated = false;
  const KEYS = [
    ["SHIFT", "shift", ""], ["DEG", "deg", ""], ["(", "(", ""], [")", ")", ""], ["DEL", "del", ""], ["AC", "ac", ""],
    ["sin", "sin(", "sin⁻¹"], ["cos", "cos(", "cos⁻¹"], ["tan", "tan(", "tan⁻¹"], ["log", "log(", "10ˣ"], ["ln", "ln(", "eˣ"], ["xʸ", "^", ""],
    ["√", "sqrt(", "∛"], ["x²", "^2", "x³"], ["x⁻¹", "^-1", ""], ["π", "π", ""], ["e", "e", ""], ["n!", "!", ""],
    ["7", "7", ""], ["8", "8", ""], ["9", "9", ""], ["÷", "/", ""], ["EXP", "exp10", ""], ["Ans", "Ans", ""],
    ["4", "4", ""], ["5", "5", ""], ["6", "6", ""], ["×", "*", ""], ["%", "/100", ""], ["R", "8.314", ""],
    ["1", "1", ""], ["2", "2", ""], ["3", "3", ""], ["−", "-", ""], ["Nₐ", "6.022e23", ""], ["k", "1.381e-23", ""],
    ["0", "0", ""], [".", ".", ""], ["±", "neg", ""], ["+", "+", ""], ["h", "6.626e-34", ""], ["=", "eq", ""]
  ];
  const SHIFT_INS = { "sin(": "asin(", "cos(": "acos(", "tan(": "atan(", "log(": "10^", "ln(": "exp(", "sqrt(": "cbrt(", "^2": "^3" };
  function renderCalc(body) {
    body.innerHTML = `
      <div class="tl-calc">
        <input class="tl-expr" id="tlExpr" placeholder="식을 입력하거나 아래 키를 누르세요" autocomplete="off" spellcheck="false">
        <div class="tl-result" id="tlRes"><span class="tl-ans">Ans = ${fmt(lastAns)}</span></div>
        <div class="tl-pad" id="tlPad">${KEYS.map(([lab, k, sl]) => `<button data-k="${esc(k)}" data-l="${esc(lab)}" data-s="${esc(sl)}" class="${/^[0-9.]$/.test(lab) ? "num" : ""} ${k === "eq" ? "eq" : ""} ${k === "ac" || k === "del" ? "ctl" : ""} ${["8.314", "6.022e23", "1.381e-23", "6.626e-34"].includes(k) ? "const" : ""}">${esc(lab)}</button>`).join("")}</div>
        <div class="tl-hint" style="margin-top:8px">SHIFT: 역삼각함수·10ˣ·eˣ·∛·x³ · DEG/RAD: 각도 단위 · EXP: ×10ˣ (예 1.8 EXP −5) · 상수 R = 8.314, Nₐ, k, h · 입력줄에 직접 타이핑해도 됩니다 (예: -log(1.8e-5))</div>
        <div class="tl-hist" id="tlHist"></div>
      </div>`;
    const $ = id => body.querySelector("#" + id);
    const expr = $("tlExpr"), res = $("tlRes"), hist = $("tlHist"), pad = $("tlPad");
    const paintShift = () => { pad.querySelectorAll("button").forEach(b => { if (b.dataset.s) b.textContent = shift ? b.dataset.s : b.dataset.l; }); pad.querySelector('[data-k="shift"]').classList.toggle("on", shift); pad.querySelector('[data-k="deg"]').textContent = angleDeg ? "DEG" : "RAD"; };
    const insert = t => { const st = expr.selectionStart ?? expr.value.length, en = expr.selectionEnd ?? st; expr.value = expr.value.slice(0, st) + t + expr.value.slice(en); expr.focus(); expr.selectionStart = expr.selectionEnd = st + t.length; };
    const run = () => {
      const src = expr.value.trim(); if (!src) return;
      try { CONSTS.Ans = lastAns; const v = evaluate(src); lastAns = v; res.innerHTML = `${fmt(v)}<span class="tl-ans">Ans</span>`; res.classList.remove("err"); justEvaluated = true;
        const d = document.createElement("div"); d.innerHTML = `<span>${esc(src)}</span><b>${fmt(v)}</b>`; d.addEventListener("click", () => { expr.value = src; expr.focus(); }); hist.prepend(d); while (hist.children.length > 8) hist.lastChild.remove();
      } catch (e) { res.textContent = "식을 확인하세요"; res.classList.add("err"); }
    };
    const press = k0 => {
      let k = k0;
      if (k === "shift") { shift = !shift; paintShift(); return; }
      if (k === "deg") { angleDeg = !angleDeg; paintShift(); return; }
      if (k === "ac") { expr.value = ""; res.innerHTML = `<span class="tl-ans">Ans = ${fmt(lastAns)}</span>`; res.classList.remove("err"); justEvaluated = false; expr.focus(); return; }
      if (k === "del") { const st = expr.selectionStart ?? expr.value.length; if (st > 0) { expr.value = expr.value.slice(0, st - 1) + expr.value.slice(st); expr.focus(); expr.selectionStart = expr.selectionEnd = st - 1; } return; }
      if (k === "eq") { run(); return; }
      if (k === "neg") { expr.value = expr.value.startsWith("-") ? expr.value.slice(1) : "-" + expr.value; expr.focus(); return; }
      if (k === "exp10") k = "e";
      if (shift && SHIFT_INS[k]) { k = SHIFT_INS[k]; shift = false; paintShift(); }
      if (justEvaluated) { justEvaluated = false; if (/^[+\-*/^!]|^\/100/.test(k)) expr.value = "Ans"; else expr.value = ""; }
      insert(k);
    };
    const flash = k => { const b = pad.querySelector(`[data-k="${CSS.escape(k)}"]`); if (!b) return; b.classList.add("press"); setTimeout(() => b.classList.remove("press"), 130); };
    pad.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; press(b.dataset.k); });
    /* 물리 키보드 ↔ 화면 키패드 연동: 숫자·연산자·Enter·Backspace 는 키패드 버튼을 누른 것과 같게 처리 */
    const KEYMAP = { Enter: "eq", "=": "eq", Backspace: "del", Delete: "ac", "*": "*", "/": "/", "+": "+", "-": "-", "^": "^", "!": "!", "%": "/100", "(": "(", ")": ")", ".": ".", ",": "." };
    const onKey = e => {
      if (!pad.isConnected) { document.removeEventListener("keydown", onKey); return; }
      if (!pad.closest(".tools").classList.contains("open")) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target; if (t !== expr && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      let k = /^[0-9]$/.test(e.key) ? e.key : KEYMAP[e.key];
      if (!k) { if (t !== expr && e.key.length === 1) { expr.focus(); } return; }
      e.preventDefault(); flash(k); press(k);
    };
    document.addEventListener("keydown", onKey);
    expr.addEventListener("input", () => { justEvaluated = false; });
    paintShift(); expr.focus();
  }

  /* 화학 계산기 (화학 자료 탭 상단) */
  function renderChemCalc() {
    return `<details class="tl-chem"><summary>화학 계산기</summary>
      <div class="tl-mini">
        <div class="tl-card"><b>몰질량</b><div class="tl-row"><input id="mmF" placeholder="화학식 예: Ca(OH)2, CuSO4·5H2O"><button class="tl-go" id="mmGo">=</button></div><div class="tl-out" id="mmOut"></div></div>
        <div class="tl-card"><b>pH ↔ [H⁺]</b><div class="tl-row"><input id="phIn" placeholder="pH"><span>⇄</span><input id="hIn" placeholder="[H⁺] M"></div><div class="tl-out" id="phOut"></div></div>
        <div class="tl-card"><b>몰 수 n = m / M</b><div class="tl-row"><input id="nM" placeholder="질량 g"><input id="nMM" placeholder="몰질량 g/mol"></div><div class="tl-out" id="nOut"></div></div>
        <div class="tl-card"><b>이상 기체 PV = nRT</b><span class="tl-hint">세 값을 넣으면 나머지를 구합니다 (atm · L · mol · K)</span><div class="tl-row"><input id="gP" placeholder="P atm"><input id="gV" placeholder="V L"><input id="gN" placeholder="n mol"><input id="gT" placeholder="T K"></div><div class="tl-out" id="gOut"></div></div>
        <div class="tl-card"><b>희석 M₁V₁ = M₂V₂</b><span class="tl-hint">세 값을 넣으면 나머지를 구합니다</span><div class="tl-row"><input id="dM1" placeholder="M₁"><input id="dV1" placeholder="V₁"><input id="dM2" placeholder="M₂"><input id="dV2" placeholder="V₂"></div><div class="tl-out" id="dOut"></div></div>
        <div class="tl-card"><b>농도 환산 (몰 농도 · 몰랄 농도 · 질량 %)</b><span class="tl-hint">용질 몰질량과 용액 밀도를 넣고, 셋 중 하나를 입력</span><div class="tl-row"><input id="cMM" placeholder="몰질량 g/mol"><input id="cD" placeholder="밀도 g/mL"></div><div class="tl-row"><input id="cM" placeholder="M (mol/L)"><input id="cm" placeholder="m (mol/kg)"><input id="cW" placeholder="질량 %"></div><div class="tl-out" id="cOut"></div></div>
      </div></details>`;
  }
  function bindChemCalc(body) {
    const $ = id => body.querySelector("#" + id); if (!$("mmF")) return;
    const num = id => { const v = parseFloat($(id).value); return isNaN(v) ? null : v; };
    const mm = () => { try { const v = molarMass($("mmF").value.trim()); $("mmOut").textContent = $("mmF").value.trim() ? `${fmt(v)} g/mol` : ""; } catch (e) { $("mmOut").textContent = e.message || "화학식을 확인하세요"; } };
    $("mmGo").addEventListener("click", mm); $("mmF").addEventListener("keydown", e => { if (e.key === "Enter") mm(); });
    $("phIn").addEventListener("input", () => { const p = num("phIn"); $("hIn").value = p == null ? "" : fmt(Math.pow(10, -p)); $("phOut").textContent = p == null ? "" : `pOH = ${fmt(14 - p)}, [OH⁻] = ${fmt(Math.pow(10, p - 14))} M (25 °C)`; });
    $("hIn").addEventListener("input", () => { const h = num("hIn"); $("phIn").value = h == null || h <= 0 ? "" : fmt(-Math.log10(h)); $("phOut").textContent = h == null || h <= 0 ? "" : `pH = ${fmt(-Math.log10(h))}, pOH = ${fmt(14 + Math.log10(h))}`; });
    const nCalc = () => { const m = num("nM"), M = num("nMM"); $("nOut").textContent = (m != null && M) ? `n = ${fmt(m / M)} mol = ${fmt(m / M * 6.02214076e23)} 개` : ""; };
    ["nM", "nMM"].forEach(id => $(id).addEventListener("input", nCalc));
    const gas = () => { const P = num("gP"), V = num("gV"), n = num("gN"), T = num("gT"), R = 0.0820574; const miss = [P, V, n, T].filter(x => x == null).length; if (miss !== 1) { $("gOut").textContent = miss === 0 ? `PV = ${fmt(P * V)}, nRT = ${fmt(n * R * T)}` : ""; return; }
      if (P == null) $("gOut").textContent = `P = nRT/V = ${fmt(n * R * T / V)} atm`; else if (V == null) $("gOut").textContent = `V = nRT/P = ${fmt(n * R * T / P)} L`; else if (n == null) $("gOut").textContent = `n = PV/RT = ${fmt(P * V / (R * T))} mol`; else $("gOut").textContent = `T = PV/nR = ${fmt(P * V / (n * R))} K = ${fmt(P * V / (n * R) - 273.15)} °C`; };
    ["gP", "gV", "gN", "gT"].forEach(id => $(id).addEventListener("input", gas));
    const dil = () => { const a = num("dM1"), b = num("dV1"), c = num("dM2"), d = num("dV2"); const miss = [a, b, c, d].filter(x => x == null).length; if (miss !== 1) { $("dOut").textContent = ""; return; }
      $("dOut").textContent = a == null ? `M₁ = ${fmt(c * d / b)}` : b == null ? `V₁ = ${fmt(c * d / a)}` : c == null ? `M₂ = ${fmt(a * b / d)}` : `V₂ = ${fmt(a * b / c)}`; };
    ["dM1", "dV1", "dM2", "dV2"].forEach(id => $(id).addEventListener("input", dil));
    const conc = src => () => { const MM = num("cMM"), D = num("cD"); if (!MM || !D) { $("cOut").textContent = "몰질량과 밀도를 먼저 입력하세요"; return; }
      let M, m, W; const v = num(src); if (v == null) { $("cOut").textContent = ""; return; }
      if (src === "cM") { M = v; const solute = M * MM, solvent = D * 1000 - solute; m = M / (solvent / 1000); W = solute / (D * 1000) * 100; }
      else if (src === "cm") { m = v; const solute = m * MM; W = solute / (1000 + solute) * 100; M = (W / 100) * D * 1000 / MM; }
      else { W = v; M = (W / 100) * D * 1000 / MM; m = (W / 100) / ((1 - W / 100) * MM / 1000); }
      if (src !== "cM") $("cM").value = fmt(M); if (src !== "cm") $("cm").value = fmt(m); if (src !== "cW") $("cW").value = fmt(W);
      $("cOut").textContent = `M = ${fmt(M)} mol/L · m = ${fmt(m)} mol/kg · ${fmt(W)} %  (용액 1 L = ${fmt(D * 1000)} g 기준)`; };
    ["cM", "cm", "cW"].forEach(id => $(id).addEventListener("input", conc(id)));
  }

  /* ================================================================
   * 부록 자료
   * ================================================================ */
  const CODON = { U: { U: ["Phe", "Phe", "Leu", "Leu"], C: ["Ser", "Ser", "Ser", "Ser"], A: ["Tyr", "Tyr", "종결", "종결"], G: ["Cys", "Cys", "종결", "Trp"] },
    C: { U: ["Leu", "Leu", "Leu", "Leu"], C: ["Pro", "Pro", "Pro", "Pro"], A: ["His", "His", "Gln", "Gln"], G: ["Arg", "Arg", "Arg", "Arg"] },
    A: { U: ["Ile", "Ile", "Ile", "Met(개시)"], C: ["Thr", "Thr", "Thr", "Thr"], A: ["Asn", "Asn", "Lys", "Lys"], G: ["Ser", "Ser", "Arg", "Arg"] },
    G: { U: ["Val", "Val", "Val", "Val"], C: ["Ala", "Ala", "Ala", "Ala"], A: ["Asp", "Asp", "Glu", "Glu"], G: ["Gly", "Gly", "Gly", "Gly"] } };

  function renderRef(body, key) {
    const data = REF[key];
    if (!data) { body.innerHTML = `<div class="tl-empty">자료가 아직 없습니다. data/reference/${esc(key)}.js 에 추가하면 여기에 표시됩니다.</div>`; return; }
    body.innerHTML = `<div class="tl-row"><input class="tl-search" id="tlQ" placeholder="${esc(data.name)} 자료 검색 (예: 아세트산, Ksp, 비열)"></div>
      ${key === "chemistry" ? renderChemCalc() : ""}
      <div id="tlSecs">${data.sections.map((sec, i) => renderSection(sec, SEC_COLORS[i % SEC_COLORS.length])).join("")}</div>`;
    bindChemCalc(body);
    const q = body.querySelector("#tlQ");
    q.addEventListener("input", () => {
      const v = q.value.trim().toLowerCase();
      body.querySelectorAll("[data-sec]").forEach(sec => {
        let any = false, n = 0;
        sec.querySelectorAll("tr[data-row], li[data-row], .pt-el").forEach(r => { const hit = !v || r.textContent.toLowerCase().includes(v) || (r.dataset.key || "").toLowerCase().includes(v); r.classList.toggle("tl-hide", !hit && !r.classList.contains("pt-el")); r.classList.toggle("pt-dim", !!v && !hit && r.classList.contains("pt-el")); if (hit) { any = true; n++; } });
        sec.classList.toggle("tl-hide", !!v && !any);
        sec.open = !!v && any;                       // 검색 중에는 일치하는 항목만 펼침, 지우면 모두 접음
        const cnt = sec.querySelector(".tl-cnt"); if (cnt) cnt.textContent = v && any ? `${n}건` : "";
      });
    });
    bindPeriodic(body);
  }
  const SEC_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16", "#06B6D4", "#A855F7"];
  function renderSection(sec, color) {
    let inner = "";
    if (sec.type === "table") inner = `<table class="tl-table"><thead><tr>${sec.cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${sec.rows.map(r => { const rowMulti = r.some((c, i) => i > 0 && String(c).length > 14 && String(c).includes(" / ")); return `<tr data-row>${r.map((c, i) => { c = String(c); const multi = rowMulti && i > 0 && c.includes(" / "); const cls = [c.length > 18 && !multi ? "wrap" : "", i > 0 && /[가-힣]/.test(c) ? "txt" : ""].filter(Boolean).join(" "); return `<td${cls ? ` class="${cls}"` : ""}>${multi ? c.split(" / ").map(esc).join("<br>") : esc(c)}</td>`; }).join("")}</tr>`; }).join("")}</tbody></table>`;
    else if (sec.type === "list") inner = `<ul class="tl-list">${sec.rows.map(r => `<li data-row>${esc(r)}</li>`).join("")}</ul>`;
    else if (sec.type === "codon") inner = renderCodon();
    else if (sec.type === "periodic") inner = renderPeriodic();
    return `<details class="tl-sec" data-sec="${esc(sec.id)}" style="--sc:${color || "var(--accent)"}"><summary><i></i><span>${esc(sec.title)}</span><em class="tl-cnt"></em></summary><div class="tl-sec-body">${sec.note ? `<p class="tl-note">${esc(sec.note)}</p>` : ""}${inner}</div></details>`;
  }
  function renderCodon() {
    const B = ["U", "C", "A", "G"];
    return `<table class="tl-table tl-codon"><thead><tr><th>1st＼2nd</th>${B.map(b => `<th>${b}</th>`).join("")}<th>3rd</th></tr></thead><tbody>${B.map(b1 => `<tr data-row><th>${b1}</th>${B.map(b2 => `<td>${CODON[b1][b2].map((aa, i) => `<div class="${aa === "종결" ? "stop" : aa.startsWith("Met") ? "start" : ""}">${b1}${b2}${B[i]} <b>${aa}</b></div>`).join("")}</td>`).join("")}<td class="tl-3rd">U<br>C<br>A<br>G</td></tr>`).join("")}</tbody></table>`;
  }
  function renderPeriodic() {
    const cells = [];
    ELEMENTS.forEach(e => {
      const [p, g] = position(e.z);
      let row, col;
      if (p === "L") { row = 9; col = g + 2; } else if (p === "A") { row = 10; col = g + 2; } else { row = p; col = g; }
      cells.push(`<button class="pt-el pt-${block(e.z)}" style="grid-row:${row};grid-column:${col}" data-z="${e.z}" data-key="${esc(e.name)} ${esc(e.sym)} ${e.z}"><span>${e.z}</span>${esc(e.sym)}</button>`);
    });
    return `<div class="pt-detail" id="ptDetail">원소를 누르면 정보가 표시됩니다.</div><div class="pt-grid">${cells.join("")}</div>
      <div class="pt-legend"><span class="pt-s">s-블록</span><span class="pt-p">p-블록</span><span class="pt-d">d-블록 (전이)</span><span class="pt-f">f-블록 (란타넘·악티늄족)</span></div>`;
  }
  function bindPeriodic(body) {
    const detail = body.querySelector("#ptDetail"); if (!detail) return;
    body.querySelectorAll(".pt-el").forEach(b => b.addEventListener("click", () => {
      body.querySelectorAll(".pt-el.on").forEach(x => x.classList.remove("on")); b.classList.add("on");
      const e = ELEMENTS[+b.dataset.z - 1], [p, g] = position(e.z);
      const grp = p === "L" ? "란타넘족" : p === "A" ? "악티늄족" : `${g}족`;
      const per = p === "L" ? 6 : p === "A" ? 7 : p;
      detail.innerHTML = `<div class="pt-head"><b>${esc(e.sym)}</b><div><div class="pt-name">${esc(e.name)} <small>원자 번호 ${e.z}</small></div><div class="pt-sub">${per}주기 · ${grp} · ${block(e.z)}-블록</div></div></div>
        <dl><dt>원자량</dt><dd>${esc(e.mass)}</dd><dt>전기음성도</dt><dd>${e.en == null ? "—" : e.en}</dd><dt>이온화 에너지</dt><dd>${e.ie == null ? "—" : e.ie + " kJ/mol"}</dd><dt>전자 배치</dt><dd>${esc(econfig(e.z))}</dd><dt>원자가 전자</dt><dd>${valence(e.z)}</dd></dl>`;
    }));
  }
  function valence(Z) { const [p, g] = position(Z); if (Z === 2) return "2"; if (p === "L" || p === "A") return "—"; if (g <= 2) return String(g); if (g >= 13) return String(g - 10); return "—(전이 원소)"; }

  /* ================================================================
   * 패널 틀, 열고 닫기
   * ================================================================ */
  const TABS = [["convert", "환산"], ["calc", "계산"], ["physics", "물리"], ["chemistry", "화학"], ["biology", "생명"], ["earth", "지구"]];
  let open = false, current = "convert";
  try { current = localStorage.getItem("vlab-tools-tab") || "convert"; } catch (e) { }
  function build() {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div class="tools-backdrop" id="toolsBackdrop"></div>
      <aside class="tools" id="tools" aria-label="도구">
        <div class="tools-hd"><div class="tools-tabs">${TABS.map(([k, n]) => `<button data-t="${k}" class="${k === current ? "on" : ""}">${n}</button>`).join("")}</div><button class="ic tools-close" id="toolsClose" aria-label="닫기"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
        <div class="tools-body" id="toolsBody"></div>
      </aside>`;
    document.body.append(...wrap.children);
    document.getElementById("toolsBackdrop").addEventListener("click", () => setOpen(false));
    document.getElementById("toolsClose").addEventListener("click", () => setOpen(false));
    document.querySelectorAll(".tools-tabs button").forEach(b => b.addEventListener("click", () => show(b.dataset.t)));
    window.addEventListener("keydown", e => { if (e.key === "Escape" && open) setOpen(false); });
    show(current);
  }
  function show(tab) {
    current = tab; try { localStorage.setItem("vlab-tools-tab", tab); } catch (e) { }
    document.querySelectorAll(".tools-tabs button").forEach(b => b.classList.toggle("on", b.dataset.t === tab));
    const body = document.getElementById("toolsBody"); body.scrollTop = 0;
    if (tab === "convert") renderConvert(body); else if (tab === "calc") renderCalc(body); else renderRef(body, tab);
  }
  function setOpen(v) {
    open = v;
    document.getElementById("tools").classList.toggle("open", v);
    document.getElementById("toolsBackdrop").classList.toggle("open", v);
    document.querySelectorAll("[data-tools-toggle]").forEach(b => b.classList.toggle("on", v));
  }
  function init() {
    if (!document.getElementById("tools")) build();
    document.querySelectorAll("[data-tools-toggle]").forEach(b => { if (!b._bound) { b._bound = true; b.addEventListener("click", e => { e.stopPropagation(); setOpen(!open); }); } });
  }
  window.VLTools = { init, open: () => setOpen(true), close: () => setOpen(false), molarMass, evaluate };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
