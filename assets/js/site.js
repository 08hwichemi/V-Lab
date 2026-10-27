/* =====================================================================
 *  V-Lab 공통 스크립트 — 등록부(data/labs.js) 읽기, 카드/헤더 렌더링, 테마, 최근 본 실험
 * ===================================================================== */
(function () {
  "use strict";
  const D = window.VLAB || { site: {}, subjects: [], labs: [] };
  const SUBJ = Object.fromEntries(D.subjects.map(s => [s.id, s]));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const I = {
    mark: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5l7 14 7-14"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    full: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    flask: '<svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v6l-5.5 9a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9V3"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  /* 카드 단위(item): 파일 하나에 실험이 여럿이면 실험마다 카드 하나 */
  function items(subject) {
    const out = [];
    D.labs.forEach(lab => {
      if (subject && lab.subject !== subject) return;
      const exps = lab.experiments;
      if (exps && exps.length) {
        exps.forEach((e, i) => out.push({
          key: lab.id + ":" + i, lab, exp: i, title: e.title, summary: e.summary || lab.summary,
          thumb: e.thumb || null, unit: e.unit || lab.unit, grade: lab.grade || [], subject: lab.subject,
          author: lab.author, tags: [...(lab.tags || []), ...(e.tags || [])], added: lab.added || "",
          count: (i + 1) + "/" + exps.length, featured: !!lab.featured
        }));
      } else {
        out.push({
          key: lab.id, lab, exp: null, title: lab.title, summary: lab.summary, thumb: lab.thumbnail || null,
          unit: lab.unit, grade: lab.grade || [], subject: lab.subject, author: lab.author, tags: lab.tags || [],
          added: lab.added || "", count: "", featured: !!lab.featured
        });
      }
    });
    return out;
  }
  const url = it => "lab.html?id=" + encodeURIComponent(it.lab.id) + (it.exp != null ? "&exp=" + it.exp : "");
  const find = key => items().find(it => it.key === key);

  function match(it, q) {
    q = (q || "").trim().toLowerCase();
    if (!q) return true;
    const s = SUBJ[it.subject] || {};
    const hay = [it.title, it.summary, it.unit, it.author, s.name, s.short, ...(it.tags || []), ...(it.grade || [])].join(" ").toLowerCase();
    return q.split(/\s+/).every(t => hay.includes(t));
  }

  function card(it) {
    const s = SUBJ[it.subject] || {};
    const meta = [it.unit, (it.grade || []).join("·")].filter(Boolean).join(" · ");
    const th = it.thumb ? `<img src="${esc(it.thumb)}" alt="" loading="lazy">` : `<div class="ph">${I.flask}</div>`;
    return `<a class="card" href="${url(it)}" data-subject="${esc(it.subject)}">
      <div class="th">${th}${it.count ? `<span class="no">${esc(it.count)}</span>` : ""}</div>
      <h3>${esc(it.title)}</h3>
      <p><i></i>${esc(meta || s.name || "")}</p>
    </a>`;
  }

  /* 상단 바 ------------------------------------------------------------ */
  function header(active, opts = {}) {
    const tabs = `<a href="index.html#/" class="${active === "all" ? "on" : ""}">전체</a>` +
      D.subjects.map(s => `<a href="index.html#/s/${esc(s.id)}" class="${active === s.id ? "on" : ""}">${esc(s.name)}</a>`).join("");
    const search = opts.search === false ? "" : `<form class="sr" id="sr" role="search" onsubmit="return false">${I.search}<input id="q" type="search" placeholder="검색" autocomplete="off"><kbd>⌘K</kbd></form>`;
    return `<header class="top">
      <a class="wm" href="index.html#/"><i>${I.mark}</i>${esc(D.site.name || "V-Lab")}<span>${esc(D.site.school || "가상 실험실")}</span></a>
      <nav class="tabs">${tabs}</nav>
      <div class="r">${search}<button class="ic" data-theme-toggle aria-label="테마 전환"></button>${opts.extra || ""}</div>
    </header>
    <nav class="mtabs">${tabs}</nav>`;
  }
  function footer() {
    const s = D.site, y = new Date().getFullYear();
    return `<footer class="foot"><span>© ${y} ${esc(s.fullName || "V-Lab")}${s.manager ? " · 운영 " + esc(s.manager) : ""}${s.contact ? " · " + esc(s.contact) : ""}</span>
      <span>${esc(s.tagline || "")}</span></footer>`;
  }
  function bindHeader() {
    document.querySelectorAll("[data-theme-toggle]").forEach(b => b.addEventListener("click", theme.toggle));
    theme.paint();
    const q = document.getElementById("q");
    if (q) {
      window.addEventListener("keydown", e => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); q.focus(); q.select(); }
        if (e.key === "Escape" && document.activeElement === q) { q.value = ""; q.dispatchEvent(new Event("input")); q.blur(); }
      });
    }
  }

  /* 테마: 기본 화이트, 토글 시 저장 ------------------------------------- */
  const theme = {
    apply(t) { if (t === "dark") document.documentElement.setAttribute("data-theme", "dark"); else document.documentElement.removeAttribute("data-theme"); },
    init() { try { theme.apply(localStorage.getItem("vlab-theme")); } catch (e) { } },
    toggle() {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      theme.apply(next); try { localStorage.setItem("vlab-theme", next); } catch (e) { } theme.paint();
    },
    paint() {
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      document.querySelectorAll("[data-theme-toggle]").forEach(b => { b.innerHTML = dark ? I.sun : I.moon; b.title = dark ? "밝은 테마" : "어두운 테마"; });
    }
  };
  theme.init();

  /* 최근 본 실험 (이 브라우저에만 저장) --------------------------------- */
  const recent = {
    key: "vlab-recent",
    list() { try { return JSON.parse(localStorage.getItem(recent.key) || "[]").map(find).filter(Boolean); } catch (e) { return []; } },
    push(key) { try { const l = JSON.parse(localStorage.getItem(recent.key) || "[]").filter(k => k !== key); l.unshift(key); localStorage.setItem(recent.key, JSON.stringify(l.slice(0, 12))); } catch (e) { } }
  };

  window.VL = { D, SUBJ, I, esc, items, url, find, match, card, header, footer, bindHeader, theme, recent };
})();
