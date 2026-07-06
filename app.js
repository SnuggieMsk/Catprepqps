/* CAT Prep Question Bank — single-page practice app.
   Works hosted (GitHub Pages) or opened locally; all content is in content.js + data/*.js */
(function () {
  "use strict";

  var CH = (window.CAT_DATA || []).slice().sort(function (a, b) { return b.num - a.num; });
  var README = window.CAT_README || "";
  var VIEWS = [
    { key: "notes", label: "Paper insights", ico: "📋" },
    { key: "questions", label: "Questions", ico: "📝" }
  ];

  // ---------- Markdown ----------
  if (window.marked && marked.setOptions) {
    marked.setOptions({ gfm: true, breaks: false, headerIds: false, mangle: false });
  }
  function esc(s) { return (s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function md(src) {
    if (!src) return "";
    var html = null;
    if (window.marked) { try { html = marked.parse(src); } catch (e) {} }
    if (html == null) html = "<pre>" + esc(src) + "</pre>";
    return html;
  }
  function inlineMd(src) {
    src = src || "";
    var html = null;
    if (window.marked && marked.parseInline) { try { html = marked.parseInline(src); } catch (e) {} }
    return html == null ? esc(src) : html;
  }

  // ---------- Progress (localStorage) ----------
  var PKEY = "cat_progress_v1";
  function loadProgress() { try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) { return {}; } }
  function saveProgress(p) { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} }
  var progress = loadProgress();
  function progKey(num, view) { return num + ":" + view; }
  function isDone(num, view) { return !!progress[progKey(num, view)]; }
  function totalUnits() { return CH.length * VIEWS.length; }
  function doneCount() { return Object.keys(progress).filter(function (k) { return progress[k]; }).length; }
  function updateProgressUI() {
    var pctv = totalUnits() ? Math.round(doneCount() / totalUnits() * 100) : 0;
    var f = document.getElementById("progressFill");
    var t = document.getElementById("progressPct");
    if (f) f.style.width = pctv + "%";
    if (t) t.textContent = pctv + "%";
  }

  // ---------- Bookmarks (localStorage) ----------
  var BKEY = "cat_bookmarks_v1";
  function loadMarks() { try { return JSON.parse(localStorage.getItem(BKEY)) || {}; } catch (e) { return {}; } }
  var bookmarks = loadMarks();
  function markKey(num, qid) { return num + ":" + qid; }
  function isMarked(num, qid) { return !!bookmarks[markKey(num, qid)]; }
  function toggleMark(num, qid) {
    var k = markKey(num, qid);
    if (bookmarks[k]) delete bookmarks[k]; else bookmarks[k] = true;
    try { localStorage.setItem(BKEY, JSON.stringify(bookmarks)); } catch (e) {}
    return !!bookmarks[k];
  }
  function markedCount(num) {
    return Object.keys(bookmarks).filter(function (k) { return k.indexOf(num + ":") === 0; }).length;
  }

  // ---------- Theme ----------
  var TKEY = "cat_theme";
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var b = document.getElementById("themeBtn");
    if (b) b.textContent = t === "dark" ? "☀️" : "🌙";
    try { localStorage.setItem(TKEY, t); } catch (e) {}
  }
  (function initTheme() {
    var saved; try { saved = localStorage.getItem(TKEY); } catch (e) {}
    applyTheme(saved === "dark" ? "dark" : "light");
  })();

  // ---------- Reading text size ----------
  var FKEY = "cat_readscale", readScale = 1;
  function applyScale(s) {
    readScale = Math.max(0.85, Math.min(1.45, Math.round(s * 100) / 100));
    document.documentElement.style.fontSize = (16 * readScale).toFixed(2) + "px";
    try { localStorage.setItem(FKEY, String(readScale)); } catch (e) {}
  }
  (function initScale() { var s; try { s = parseFloat(localStorage.getItem(FKEY)); } catch (e) {} applyScale(isFinite(s) && s ? s : 1); })();

  // ---------- Helpers ----------
  function chapterByNum(num) { for (var i = 0; i < CH.length; i++) if (String(CH[i].num) === String(num)) return CH[i]; return null; }

  // ---------- Sidebar ----------
  function buildSidebar() {
    var nav = document.getElementById("nav");
    var html = '<a class="nav-chap-head" href="#/home"><span class="nav-chap-num">🏠</span>'
      + '<span class="nav-chap-title">Home &amp; Exam Guide</span></a>';
    html += '<div class="nav-module">Study Tools</div>'
      + '<a class="nav-tool" data-link="stats" href="#/stats"><span class="nav-chap-num">📊</span><span class="nav-chap-title">My Stats</span></a>'
      + '<a class="nav-tool" data-link="formulas" href="#/tools/formulas"><span class="nav-chap-num">📐</span><span class="nav-chap-title">QA Formula Sheet</span></a>'
      + '<a class="nav-tool" data-link="strategy" href="#/tools/strategy"><span class="nav-chap-num">🧭</span><span class="nav-chap-title">Strategy Playbook</span></a>'
      + '<a class="nav-tool" data-link="percentile" href="#/tools/percentile"><span class="nav-chap-num">🎯</span><span class="nav-chap-title">Percentile Estimator</span></a>';
    var lastModule = null;
    CH.forEach(function (c) {
      if (c.module !== lastModule) { html += '<div class="nav-module">' + esc(c.module) + "</div>"; lastModule = c.module; }
      var chDone = VIEWS.every(function (v) { return isDone(c.num, v.key); });
      html += '<div class="nav-chapter" data-ch="' + c.num + '">'
        + '<button class="nav-chap-head" data-toggle="' + c.num + '">'
        + '<span class="nav-chap-num">' + esc(c.badge || c.num) + "</span>"
        + '<span class="nav-chap-title">' + esc(c.title) + "</span>"
        + '<span class="nav-check" data-check="' + c.num + '">' + (chDone ? "✓" : "") + "</span>"
        + '</button><div class="nav-sub">';
      VIEWS.forEach(function (v) {
        html += '<a href="#/ch/' + c.num + "/" + v.key + '" data-link="' + c.num + "/" + v.key + '">'
          + '<span class="dot">' + v.ico + "</span>" + v.label
          + '<span class="nav-check" data-check="' + c.num + ":" + v.key + '">' + (isDone(c.num, v.key) ? "✓" : "") + "</span></a>";
      });
      html += "</div></div>";
    });
    nav.innerHTML = html;
    nav.querySelectorAll("[data-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var wrap = btn.closest(".nav-chapter"), num = btn.getAttribute("data-toggle");
        if (!wrap.classList.contains("open")) location.hash = "#/ch/" + num + "/questions";
        else wrap.classList.toggle("open");
      });
    });
  }
  function refreshChecks() {
    document.querySelectorAll("[data-check]").forEach(function (n) {
      var key = n.getAttribute("data-check");
      if (key.indexOf(":") > -1) n.textContent = progress[key] ? "✓" : "";
      else n.textContent = VIEWS.every(function (v) { return isDone(key, v.key); }) ? "✓" : "";
    });
  }
  function highlightNav(num, view) {
    document.querySelectorAll(".nav-chap-head,.nav-tool").forEach(function (n) { n.classList.remove("active"); });
    document.querySelectorAll(".nav-sub a").forEach(function (a) { a.classList.remove("active"); });
    document.querySelectorAll(".nav-chapter").forEach(function (w) { w.classList.remove("open"); });
    if (!num) {
      var h = location.hash, toolKey = null;
      if (h.indexOf("/stats") > -1) toolKey = "stats";
      else if (h.indexOf("/tools/formulas") > -1) toolKey = "formulas";
      else if (h.indexOf("/tools/strategy") > -1) toolKey = "strategy";
      else if (h.indexOf("/tools/percentile") > -1) toolKey = "percentile";
      if (toolKey) { var t = document.querySelector('.nav-tool[data-link="' + toolKey + '"]'); if (t) t.classList.add("active"); return; }
      var home = document.querySelector('.nav-chap-head[href="#/home"]'); if (home) home.classList.add("active");
      return;
    }
    var wrap = document.querySelector('.nav-chapter[data-ch="' + num + '"]');
    if (wrap) { wrap.classList.add("open"); wrap.querySelector(".nav-chap-head").classList.add("active"); }
    var link = document.querySelector('.nav-sub a[data-link="' + num + "/" + view + '"]');
    if (link) link.classList.add("active");
  }

  // ---------- Renderers ----------
  var contentEl = document.getElementById("content");
  var chapterNavEl = document.getElementById("chapterNav");

  function questionCount(c) { return ((c.questions || "").match(/\*\*Q[\w-]+\.\*\*/g) || []).length; }

  function renderHome() {
    var totalQ = CH.reduce(function (a, c) { return a + questionCount(c); }, 0);
    var last = null; try { last = localStorage.getItem("cat_last"); } catch (e) {}
    var lastLabel = "";
    if (last) {
      var lm = last.match(/^#\/ch\/(\d{2,4})\//), lc = lm && chapterByNum(lm[1]);
      if (lc) lastLabel = lc.module + " " + (lc.badge || "");
    }
    var hero = '<div class="hero"><h1>🎯 CAT Prep Question Bank</h1>'
      + '<p>Year-wise practice built around the <b>last 10 years of CAT papers (2016–2025)</b> — VARC, DILR &amp; Quant question sets with instant answers, full worked solutions, timed tests and paper-level insights. '
      + '<b>' + totalQ + ' questions</b>, every answer independently verified. Study at your own pace.</p>'
      + '<div class="hero-cta">'
      + (lastLabel ? '<a href="' + last + '" class="cta">▶ Continue ' + esc(lastLabel) + '</a>' : "")
      + (CH.length ? '<a href="#/ch/' + CH[0].num + '/questions" class="cta' + (lastLabel ? " ghost" : "") + '">📝 Start with CAT ' + esc(String(CH[0].module).replace(/\D/g, "")) + '</a>' : "")
      + '<a href="#/tools/strategy" class="cta ghost">🧭 Strategy Playbook</a>'
      + '<a href="#/stats" class="cta ghost">📊 My Stats</a></div></div>';
    var cards = "", lastModule = null;
    CH.forEach(function (c) {
      if (c.module !== lastModule) {
        if (lastModule !== null) cards += "</div>";
        cards += "<h2>" + esc(c.module) + '</h2><div class="home-cards">';
        lastModule = c.module;
      }
      var saved = {}; try { saved = JSON.parse(localStorage.getItem("cat_quiz_" + c.num)) || {}; } catch (e) {}
      var att = Object.keys(saved).length, tq = questionCount(c);
      cards += '<div class="home-card" data-go="#/ch/' + c.num + '/questions">'
        + '<div class="hc-num">' + esc(c.badge || "") + "</div>"
        + '<div class="hc-title">' + esc(c.title) + "</div>"
        + '<div class="hc-links"><span class="chip">📝 ' + tq + " questions</span><span class=\"chip\">📋 Insights</span>"
        + (att ? '<span class="chip" style="background:var(--brand-soft);color:var(--brand)">' + att + " done</span>" : "") + "</div></div>";
    });
    if (lastModule !== null) cards += "</div>";
    var readme = '<div class="markdown-body">' + md(README) + "</div>";
    contentEl.innerHTML = hero + cards
      + '<hr><details open><summary style="cursor:pointer;font-weight:700;font-size:18px">📋 CAT exam guide &amp; how to use this bank</summary>' + readme + "</details>";
    contentEl.querySelectorAll("[data-go]").forEach(function (card) { card.addEventListener("click", function () { location.hash = card.getAttribute("data-go"); }); });
    chapterNavEl.innerHTML = ""; highlightNav(null); document.title = "CAT Prep Question Bank — PYQ 2016–2025";
  }

  function viewTabs(num, active) {
    var done = isDone(num, active), h = '<div class="view-tabs">';
    VIEWS.forEach(function (v) {
      h += '<a class="view-tab ' + (v.key === active ? "active" : "") + '" href="#/ch/' + num + "/" + v.key + '"><span class="vt-ico">' + v.ico + "</span>" + v.label + "</a>";
    });
    h += '<button class="mark-read ' + (done ? "done" : "") + '" id="markReadBtn">' + (done ? "✓ Marked as done" : "Mark as done") + "</button></div>";
    return h;
  }
  function bindMarkRead(num, view) {
    var btn = document.getElementById("markReadBtn"); if (!btn) return;
    btn.addEventListener("click", function () {
      var k = progKey(num, view); progress[k] = !progress[k]; saveProgress(progress);
      btn.classList.toggle("done", !!progress[k]); btn.textContent = progress[k] ? "✓ Marked as done" : "Mark as done";
      refreshChecks(); updateProgressUI();
    });
  }
  function renderNotes(num) {
    var c = chapterByNum(num);
    contentEl.innerHTML = viewTabs(num, "notes") + '<div class="markdown-body">' + md(c.notes) + "</div>";
    bindMarkRead(num, "notes");
  }

  // ----- Question bank parsing -----
  // Format: "## <tier heading>" splits tiers; "### <set heading>" inside a tier
  // opens a set (RC passage / DILR set) whose intro text is the scenario.
  // Question block:
  //   **Q1.** stem…
  //   A) … B) … C) … D) …   (one line)
  //   <details><summary>…</summary>  **Correct: X)** explanation  </details>
  function parseBlocks(text) {
    var out = [], re = /\*\*Q([\w-]+)\.\*\*\s*([\s\S]*?)\r?\n(A\)[^\n]*B\)[^\n]*C\)[^\n]*D\)[^\n]*)\r?\n<details>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/g, m;
    while ((m = re.exec(text))) {
      var optline = m[3], expl = m[4].trim();
      var om = optline.match(/A\)\s*([\s\S]*?)\s*B\)\s*([\s\S]*?)\s*C\)\s*([\s\S]*?)\s*D\)\s*([\s\S]*)/);
      if (!om) continue;
      var cm = expl.match(/\*\*Correct:\s*([A-D])\)?/i);
      if (!cm) continue;
      var stem = m[2].trim();
      out.push({
        id: m[1], q: stem,
        options: [om[1], om[2], om[3], om[4]].map(function (s) { return s.trim(); }),
        correct: "ABCD".indexOf(cm[1].toUpperCase()),
        tita: /\bTITA\b/.test(stem),
        expl: expl
      });
    }
    return out;
  }
  function tierMeta(title) {
    if (/easy/i.test(title) || /🟢/.test(title)) return { cls: "easy", dot: "🟢", label: title.replace(/^[^\w]*/, "") || "Easy" };
    if (/medium/i.test(title) || /🟡/.test(title)) return { cls: "med", dot: "🟡", label: title.replace(/^[^\w]*/, "") || "Medium" };
    if (/hard|tough/i.test(title) || /🔴/.test(title)) return { cls: "hard", dot: "🔴", label: title.replace(/^[^\w]*/, "") || "Hard" };
    return { cls: "mix", dot: "📝", label: title.replace(/^[^\w]*/, "") || "Questions" };
  }
  function parseQuiz(src) {
    var tiers = [], parts = (src || "").split(/\n(?=##\s)/);
    parts.forEach(function (part) {
      var hm = part.match(/^##\s*(.*)/);
      var meta = tierMeta(hm ? hm[1] : "");
      var items = [];
      var chunks = part.split(/\n(?=###\s)/);
      chunks.forEach(function (chunk, ci) {
        var sm = chunk.match(/^###\s+(.*)/);
        if (sm) {
          var firstQ = chunk.search(/\*\*Q[\w-]+\.\*\*/);
          var scenario = firstQ > -1 ? chunk.slice(chunk.indexOf("\n") + 1, firstQ).trim() : chunk.slice(chunk.indexOf("\n") + 1).trim();
          var qs = parseBlocks(chunk);
          if (qs.length) items.push({ kind: "set", title: sm[1].trim(), scenario: scenario, questions: qs });
        } else {
          parseBlocks(chunk).forEach(function (q) { items.push({ kind: "q", q: q }); });
        }
      });
      if (items.length) tiers.push({ cls: meta.cls, dot: meta.dot, label: meta.label, items: items });
    });
    return { tiers: tiers };
  }
  function tierQuestions(t) {
    var qs = [];
    t.items.forEach(function (it) { if (it.kind === "q") qs.push(it.q); else qs = qs.concat(it.questions); });
    return qs;
  }
  function allQuestions(parsed) {
    var qs = [];
    parsed.tiers.forEach(function (t) { qs = qs.concat(tierQuestions(t)); });
    return qs;
  }

  var quizCtx = null;
  function qCard(q, t, num, opts_) {
    opts_ = opts_ || {};
    var opts = "";
    ["A", "B", "C", "D"].forEach(function (L, i) {
      opts += '<button class="q-opt" data-i="' + i + '"><span class="q-letter">' + L + '</span><span class="q-otext">' + inlineMd(q.options[i]) + "</span></button>";
    });
    var tag = q.tita ? "⌨️ TITA · no negative" : "+3 / −1";
    var actions = opts_.timed ? "" :
      '<span class="q-actions"><button class="q-reveal" title="Show the answer without attempting (no penalty)">👁 Reveal</button>'
      + '<button class="q-flag' + (isMarked(num, q.id) ? " on" : "") + '" title="Bookmark for review">' + (isMarked(num, q.id) ? "★" : "☆") + "</button></span>";
    var vz = window.CATViz ? window.CATViz.extract(q.expl) : { text: q.expl, spec: null };
    var vizHtml = vz.spec && window.CATViz ? window.CATViz.render(vz.spec) : "";
    return '<div class="q-card" data-tier="' + t.cls + '" data-qid="' + q.id + '" data-correct="' + q.correct + '" data-tita="' + (q.tita ? 1 : 0) + '">'
      + '<div class="q-head"><span class="q-num">Q' + q.id + '</span><span class="q-tierlabel ' + t.cls + '">' + t.dot + " " + esc(t.label) + '</span><span class="p-case-marks">' + tag + "</span>" + actions + "</div>"
      + '<div class="q-text">' + inlineMd(q.q) + "</div>"
      + '<div class="q-opts">' + opts + "</div>"
      + '<div class="q-expl markdown-body" hidden>' + vizHtml + md(vz.text) + "</div></div>";
  }
  function renderTierCards(parsed, num, opts_) {
    var h = "";
    parsed.tiers.forEach(function (t) {
      var count = tierQuestions(t).length;
      h += '<div class="q-tier-head ' + t.cls + '">' + t.dot + " " + esc(t.label) + ' <span class="q-tier-count">' + count + " questions</span></div>";
      t.items.forEach(function (it) {
        if (it.kind === "q") { h += qCard(it.q, t, num, opts_); return; }
        h += '<div class="p-case" data-tier="' + t.cls + '"><div class="p-case-head">🧩 ' + esc(it.title)
          + ' <span class="p-case-marks">' + it.questions.length + " questions</span></div>"
          + '<div class="p-case-scenario markdown-body">' + md(it.scenario) + "</div>";
        it.questions.forEach(function (q) { h += qCard(q, t, num, opts_); });
        h += "</div>";
      });
    });
    return h;
  }
  function questionMap() {
    var map = {};
    allQuestions(quizCtx.parsed).forEach(function (q) { map[q.id] = q; });
    return map;
  }
  function saveQuiz() { try { localStorage.setItem(quizCtx.qkey, JSON.stringify(quizCtx.saved)); } catch (e) {} }

  // chosen === -1 means "revealed without attempting": show the answer, no penalty
  function applyAnswer(card, chosen, restore) {
    card.classList.add("answered");
    var correct = parseInt(card.dataset.correct, 10);
    card.querySelectorAll(".q-opt").forEach(function (o, idx) {
      o.disabled = true;
      if (idx === correct) o.classList.add("correct");
      if (idx === chosen && chosen !== correct) o.classList.add("wrong");
      if (idx === chosen) o.classList.add("chosen");
    });
    var rv = card.querySelector(".q-reveal"); if (rv) rv.disabled = true;
    card.querySelector(".q-expl").hidden = false;
    if (!restore && chosen !== -1) {
      var fl = chosen === correct ? "flash-ok" : "flash-no";
      card.classList.add(fl); setTimeout(function () { card.classList.remove(fl); }, 700);
    }
  }
  function updateQuizScore() {
    var map = questionMap(), ans = 0, correct = 0, net = 0;
    Object.keys(quizCtx.saved).forEach(function (qid) {
      var q = map[qid]; if (!q) return;
      ans++;
      if (quizCtx.saved[qid] === -1) return; // revealed, not attempted
      if (quizCtx.saved[qid] === q.correct) { correct++; net += 3; }
      else if (!q.tita) net -= 1;
    });
    var pctv = ans ? Math.round(correct / ans * 100) : 0;
    var setT = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    setT("qAns", ans); setT("qCorrect", correct); setT("qNet", net);
    var pe = document.getElementById("qPct"); if (pe) pe.textContent = ans ? "(" + pctv + "% accuracy)" : "";
    var fill = document.getElementById("qFill"); if (fill) fill.style.width = (quizCtx.total ? ans / quizCtx.total * 100 : 0) + "%";
    var done = document.getElementById("qDone");
    if (done) done.hidden = !(ans === quizCtx.total && quizCtx.total > 0);
    if (ans === quizCtx.total && quizCtx.total > 0) {
      var msg = pctv >= 80 ? "🏆 Excellent — you own this paper!" : pctv >= 55 ? "👍 Solid — review the ones you missed." : "📚 Keep going — study the solutions and retry.";
      var d2 = document.getElementById("qDoneMsg");
      if (d2) d2.innerHTML = "You answered <b>" + correct + "/" + quizCtx.total + " correctly (" + pctv + "%)</b> · CAT-style net score <b>" + net + "/" + (quizCtx.total * 3) + "</b>. " + msg;
    }
  }
  function shuffleQuiz() {
    quizCtx.parsed.tiers.forEach(function (t) {
      for (var i = t.items.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = t.items[i]; t.items[i] = t.items[j]; t.items[j] = tmp; }
    });
    var list = document.getElementById("qList"); list.innerHTML = renderTierCards(quizCtx.parsed, quizCtx.num);
    Object.keys(quizCtx.saved).forEach(function (qid) { var card = list.querySelector('.q-card[data-qid="' + qid + '"]'); if (card) applyAnswer(card, quizCtx.saved[qid], true); });
    applyListFilter(currentFilter());
  }
  function currentFilter() {
    var a = document.querySelector(".q-chip.active");
    return a ? a.dataset.f : "all";
  }
  // JS-driven filtering so the ⭐ bookmark filter can join the tier filters
  function applyListFilter(key) {
    var list = document.getElementById("qList"); if (!list) return;
    list.querySelectorAll(".q-card").forEach(function (c) {
      var show = key === "all"
        || (key === "marked" ? isMarked(quizCtx.num, c.dataset.qid) : c.dataset.tier === key);
      c.style.display = show ? "" : "none";
    });
    list.querySelectorAll(".p-case").forEach(function (p) {
      var any = false;
      p.querySelectorAll(".q-card").forEach(function (c) { if (c.style.display !== "none") any = true; });
      p.style.display = any ? "" : "none";
    });
    list.querySelectorAll(".q-tier-head").forEach(function (h) {
      var any = false, el = h.nextElementSibling;
      while (el && !el.classList.contains("q-tier-head")) {
        if (el.style.display !== "none" && (el.classList.contains("q-card") || el.classList.contains("p-case"))) any = true;
        el = el.nextElementSibling;
      }
      h.style.display = any ? "" : "none";
    });
  }
  function toggleReading() {
    var c = chapterByNum(quizCtx.num);
    var wrap = document.getElementById("quizInteractive");
    wrap.outerHTML = '<div id="quizReading"><div class="quiz-tools"><button id="qInteractive">🎯 Back to interactive</button>'
      + '<button id="expandAll">▾ Reveal all</button><button id="collapseAll">▸ Hide all</button><button id="toTop">↑ Top</button></div>'
      + '<div class="markdown-body" id="quizBody">' + md(c.questions) + "</div></div>";
    document.getElementById("qInteractive").onclick = function () { renderQuestions(quizCtx.num); };
    var body = document.getElementById("quizBody");
    document.getElementById("expandAll").onclick = function () { body.querySelectorAll("details").forEach(function (d) { d.open = true; }); };
    document.getElementById("collapseAll").onclick = function () { body.querySelectorAll("details").forEach(function (d) { d.open = false; }); };
    document.getElementById("toTop").onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };
  }
  function renderQuestions(num) {
    var c = chapterByNum(num), parsed = parseQuiz(c.questions);
    var total = allQuestions(parsed).length;
    if (!total) {
      contentEl.innerHTML = viewTabs(num, "questions") + '<div class="markdown-body">' + md(c.questions) + "</div>";
      bindMarkRead(num, "questions"); return;
    }
    var qkey = "cat_quiz_" + num, saved = {};
    try { saved = JSON.parse(localStorage.getItem(qkey)) || {}; } catch (e) {}
    quizCtx = { num: num, parsed: parsed, saved: saved, qkey: qkey, total: total };

    var counts = { easy: 0, med: 0, hard: 0, mix: 0 };
    parsed.tiers.forEach(function (t) { counts[t.cls] += tierQuestions(t).length; });
    var mk = markedCount(num);
    var chips = '<div class="q-filters"><button class="q-chip active" data-f="all">All (' + total + ")</button>";
    if (counts.easy) chips += '<button class="q-chip" data-f="easy">🟢 Easy (' + counts.easy + ")</button>";
    if (counts.med) chips += '<button class="q-chip" data-f="med">🟡 Medium (' + counts.med + ")</button>";
    if (counts.hard) chips += '<button class="q-chip" data-f="hard">🔴 Hard (' + counts.hard + ")</button>";
    if (counts.mix) chips += '<button class="q-chip" data-f="mix">📝 Sets (' + counts.mix + ")</button>";
    chips += '<button class="q-chip" data-f="marked">⭐ Marked (<span id="qMarkCount">' + mk + "</span>)</button></div>";
    var tb = timedBest(num);
    var bar = '<div class="q-scorebar"><div class="q-score-text">📊 <b id="qAns">0</b>/' + total + ' answered · <b id="qCorrect">0</b> correct · net <b id="qNet">0</b> <span id="qPct" class="q-pct"></span>'
      + (tb ? ' · ⏱ timed best <b>' + tb.best + "/" + tb.max + "</b>" : "") + '</div>'
      + '<div class="q-progress"><div id="qFill" class="q-progress-fill"></div></div>'
      + '<div id="qDone" class="q-done" hidden><span id="qDoneMsg"></span></div></div>';
    var tools = '<div class="quiz-tools"><button id="qTimed" class="q-timed-btn">⏱ Timed test</button><button id="qShuffle">🔀 Shuffle</button><button id="qReset">↺ Reset answers</button><button id="qReading">📄 Reading mode</button><button id="toTop">↑ Top</button></div>';
    var tip = '<div class="q-tip">💡 Tap an option to lock your answer — you will instantly see the right choice and a full solution. <b>👁 Reveal</b> shows the answer without attempting (no penalty); <b>⭐</b> bookmarks a question for review. Scoring mirrors CAT: <b>+3</b> correct, <b>−1</b> wrong MCQ, <b>no negative</b> for TITA-style questions.</div>';
    contentEl.innerHTML = viewTabs(num, "questions")
      + '<div id="quizInteractive">' + chips + bar + tip + tools + '<div id="qList">' + renderTierCards(parsed, num) + "</div></div>";
    bindMarkRead(num, "questions");

    var root = document.getElementById("quizInteractive"), list = document.getElementById("qList");
    Object.keys(saved).forEach(function (qid) { var card = list.querySelector('.q-card[data-qid="' + qid + '"]'); if (card) applyAnswer(card, saved[qid], true); });
    updateQuizScore();
    list.addEventListener("click", function (e) {
      var flag = e.target.closest(".q-flag");
      if (flag) {
        var fcard = flag.closest(".q-card");
        var on = toggleMark(num, fcard.dataset.qid);
        flag.textContent = on ? "★" : "☆"; flag.classList.toggle("on", on);
        var mc = document.getElementById("qMarkCount"); if (mc) mc.textContent = markedCount(num);
        return;
      }
      var rev = e.target.closest(".q-reveal");
      if (rev) {
        var rcard = rev.closest(".q-card"); if (rcard.classList.contains("answered")) return;
        applyAnswer(rcard, -1, false); quizCtx.saved[rcard.dataset.qid] = -1; saveQuiz(); updateQuizScore();
        return;
      }
      var btn = e.target.closest(".q-opt"); if (!btn) return;
      var card = btn.closest(".q-card"); if (card.classList.contains("answered")) return;
      var i = parseInt(btn.dataset.i, 10);
      applyAnswer(card, i, false); quizCtx.saved[card.dataset.qid] = i; saveQuiz(); updateQuizScore();
    });
    root.querySelectorAll(".q-chip").forEach(function (ch) {
      ch.addEventListener("click", function () {
        root.querySelectorAll(".q-chip").forEach(function (x) { x.classList.remove("active"); });
        ch.classList.add("active");
        applyListFilter(ch.dataset.f);
      });
    });
    document.getElementById("qTimed").onclick = function () { renderTimed(num); };
    document.getElementById("qReset").onclick = function () { if (confirm("Clear your saved answers for this section?")) { quizCtx.saved = {}; saveQuiz(); renderQuestions(num); } };
    document.getElementById("qShuffle").onclick = shuffleQuiz;
    document.getElementById("qReading").onclick = toggleReading;
    document.getElementById("toTop").onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };
  }

  /* =====================================================================
     TIMED TEST MODE — exam pacing (~1.8 min/question), feedback after submit
     ===================================================================== */
  var timedCtx = null;
  function clearTimed() { if (timedCtx && timedCtx.timerId) clearInterval(timedCtx.timerId); timedCtx = null; }
  function timedBest(num) { try { return JSON.parse(localStorage.getItem("cat_timed_" + num)); } catch (e) { return null; } }
  function fmtClock(s) { var m = Math.floor(s / 60), ss = s % 60; return (m < 10 ? "0" : "") + m + ":" + (ss < 10 ? "0" : "") + ss; }
  function renderTimed(num) {
    clearTimed();
    var c = chapterByNum(num), parsed = parseQuiz(c.questions);
    var qs = allQuestions(parsed), total = qs.length;
    if (!total) { renderQuestions(num); return; }
    var mins = Math.max(10, Math.min(60, Math.round(total * 1.8)));
    timedCtx = { num: num, parsed: parsed, qs: qs, total: total, choices: {}, submitted: false, remaining: mins * 60, timerId: null };
    contentEl.innerHTML = viewTabs(num, "questions")
      + '<div class="timer-bar"><span class="timer-clock" id="tmClock">' + fmtClock(timedCtx.remaining) + '</span>'
      + '<span class="timer-meta">⏱ Timed test · <b id="tmAtt">0</b>/' + total + ' attempted · ' + mins + ' min (~1.8 min/question, CAT pacing)</span>'
      + '<span class="timer-actions"><button class="calc-btn" id="tmSubmit">Submit</button>'
      + '<button class="calc-btn ghost" id="tmExit">✕ Exit</button></span></div>'
      + '<div class="q-tip">🧪 Exam conditions: pick answers freely (you can change them), nothing is revealed until you <b>Submit</b> or time runs out. Unanswered questions score 0. Your practice-mode answers are untouched.</div>'
      + '<div id="qList">' + renderTierCards(parsed, num, { timed: true }) + "</div>"
      + '<div class="quiz-tools"><button id="tmSubmit2">✅ Submit test</button></div>';
    var list = document.getElementById("qList");
    list.addEventListener("click", function (e) {
      if (!timedCtx || timedCtx.submitted) return;
      var btn = e.target.closest(".q-opt"); if (!btn) return;
      var card = btn.closest(".q-card");
      card.querySelectorAll(".q-opt").forEach(function (o) { o.classList.remove("chosen"); });
      btn.classList.add("chosen");
      timedCtx.choices[card.dataset.qid] = parseInt(btn.dataset.i, 10);
      var att = document.getElementById("tmAtt"); if (att) att.textContent = Object.keys(timedCtx.choices).length;
    });
    document.getElementById("tmSubmit").onclick = function () { finishTimed(false); };
    document.getElementById("tmSubmit2").onclick = function () { finishTimed(false); };
    document.getElementById("tmExit").onclick = function () { if (timedCtx && !timedCtx.submitted && Object.keys(timedCtx.choices).length && !confirm("Exit without submitting? This attempt will be discarded.")) return; renderQuestions(num); };
    timedCtx.timerId = setInterval(function () {
      if (!timedCtx) return;
      timedCtx.remaining--;
      var cl = document.getElementById("tmClock");
      if (cl) { cl.textContent = fmtClock(Math.max(0, timedCtx.remaining)); cl.classList.toggle("low", timedCtx.remaining <= 300); }
      if (timedCtx.remaining <= 0) finishTimed(true);
    }, 1000);
    window.scrollTo(0, 0);
  }
  function finishTimed(auto) {
    if (!timedCtx || timedCtx.submitted) return;
    timedCtx.submitted = true;
    clearInterval(timedCtx.timerId); timedCtx.timerId = null;
    var byId = {}; timedCtx.qs.forEach(function (q) { byId[q.id] = q; });
    var att = 0, correct = 0, net = 0;
    var list = document.getElementById("qList");
    list.querySelectorAll(".q-card").forEach(function (card) {
      var q = byId[card.dataset.qid];
      var ch = timedCtx.choices.hasOwnProperty(card.dataset.qid) ? timedCtx.choices[card.dataset.qid] : -1;
      card.querySelectorAll(".q-opt").forEach(function (o) { o.classList.remove("chosen"); });
      if (ch !== -1) {
        att++;
        if (ch === q.correct) { correct++; net += 3; }
        else if (!q.tita) net -= 1;
      }
      applyAnswer(card, ch, true);
    });
    var max = timedCtx.total * 3, num = timedCtx.num;
    var prev = timedBest(num), isBest = !prev || net > prev.best;
    var rec = { best: isBest ? net : prev.best, last: net, max: max, count: (prev ? prev.count || 0 : 0) + 1 };
    try { localStorage.setItem("cat_timed_" + num, JSON.stringify(rec)); } catch (e) {}
    var acc = att ? Math.round(correct / att * 100) : 0;
    var bar = document.querySelector(".timer-bar");
    if (bar) {
      bar.outerHTML = '<div class="q-done p-done ' + (net >= max * 0.55 ? "pass" : "fail") + '" style="display:block">'
        + '<b>' + (auto ? "⏰ Time's up!" : "✅ Submitted.") + "</b> Net score <b>" + net + "/" + max + "</b> · "
        + att + "/" + timedCtx.total + " attempted · " + correct + " correct (" + acc + "% accuracy)"
        + (isBest && rec.count > 1 ? " · 🏆 new personal best!" : (prev && !isBest ? " · best so far: " + rec.best : ""))
        + ' <span class="p-passnote">All solutions are now revealed below. Wrong MCQs cost −1, exactly like CAT.</span>'
        + '<div style="margin-top:8px"><button class="calc-btn" id="tmRetry">↻ Retry timed</button> '
        + '<button class="calc-btn ghost" id="tmBack">← Back to practice</button></div></div>';
      document.getElementById("tmRetry").onclick = function () { renderTimed(num); };
      document.getElementById("tmBack").onclick = function () { renderQuestions(num); };
    }
    window.scrollTo(0, 0);
  }

  /* =====================================================================
     STATS DASHBOARD + STUDY TOOLS
     ===================================================================== */
  function chapterStat(c) {
    var parsed = parseQuiz(c.questions), qs = allQuestions(parsed);
    var saved = {}; try { saved = JSON.parse(localStorage.getItem("cat_quiz_" + c.num)) || {}; } catch (e) {}
    var byId = {}; qs.forEach(function (q) { byId[q.id] = q; });
    var ans = 0, correct = 0, net = 0;
    Object.keys(saved).forEach(function (qid) {
      var q = byId[qid]; if (!q) return;
      ans++;
      if (saved[qid] === -1) return;
      if (saved[qid] === q.correct) { correct++; net += 3; }
      else if (!q.tita) net -= 1;
    });
    return { total: qs.length, ans: ans, correct: correct, net: net, timed: timedBest(c.num) };
  }
  function renderStats() {
    var rows = "", agg = {}, gAns = 0, gCor = 0, gTot = 0, gNet = 0;
    var weak = [];
    CH.forEach(function (c) {
      var s = chapterStat(c);
      gAns += s.ans; gCor += s.correct; gTot += s.total; gNet += s.net;
      var a = agg[c.badge] = agg[c.badge] || { ans: 0, cor: 0, tot: 0 };
      a.ans += s.ans; a.cor += s.correct; a.tot += s.total;
      var acc = s.ans ? Math.round(s.correct / s.ans * 100) : null;
      if (s.ans >= 8 && acc !== null) weak.push({ label: c.module + " " + c.badge, acc: acc, num: c.num });
      rows += "<tr><td>" + esc(c.module) + '</td><td><a href="#/ch/' + c.num + '/questions">' + esc(c.badge) + "</a></td>"
        + "<td>" + s.ans + "/" + s.total + "</td><td>" + s.correct + "</td>"
        + "<td>" + (acc === null ? "—" : acc + "%") + "</td><td>" + (s.ans ? s.net : "—") + "</td>"
        + "<td>" + (s.timed ? s.timed.best + "/" + s.timed.max + (s.timed.count > 1 ? " (" + s.timed.count + " runs)" : "") : "—") + "</td></tr>";
    });
    weak.sort(function (a, b) { return a.acc - b.acc; });
    var secRows = "";
    ["VARC", "DILR", "QA"].forEach(function (b) {
      var a = agg[b]; if (!a) return;
      secRows += "<tr><td><b>" + b + "</b></td><td>" + a.ans + "/" + a.tot + "</td><td>" + a.cor + "</td><td>" + (a.ans ? Math.round(a.cor / a.ans * 100) + "%" : "—") + "</td></tr>";
    });
    var weakHtml = "";
    if (weak.length >= 2) {
      weakHtml = '<div class="q-tip">🎯 <b>Your weakest cells right now:</b> '
        + weak.slice(0, 2).map(function (w) { return '<a href="#/ch/' + w.num + '/questions">' + esc(w.label) + "</a> (" + w.acc + "%)"; }).join(" and ")
        + " — that's next session's practice plan.</div>";
    } else if (!gAns) {
      weakHtml = '<div class="q-tip">No answers recorded yet — pick a year from the sidebar and start practising. Everything you do is tracked here automatically (stored only in your browser).</div>';
    }
    contentEl.innerHTML =
      '<div class="hero"><h1>📊 My Stats</h1><p>Everything below lives in your browser only. <b>' + gAns + "</b> of <b>" + gTot + "</b> questions answered · <b>" + gCor + "</b> correct"
      + (gAns ? " (" + Math.round(gCor / gAns * 100) + "% accuracy) · cumulative net <b>" + gNet + "</b>" : "") + ".</p></div>"
      + weakHtml
      + '<div class="markdown-body"><h2>By section</h2><table><thead><tr><th>Section</th><th>Answered</th><th>Correct</th><th>Accuracy</th></tr></thead><tbody>' + secRows + "</tbody></table>"
      + "<h2>By paper</h2><table><thead><tr><th>Year</th><th>Section</th><th>Answered</th><th>Correct</th><th>Accuracy</th><th>Net</th><th>⏱ Timed best</th></tr></thead><tbody>" + rows + "</tbody></table>"
      + '<p><em>Accuracy is correct ÷ answered (revealed questions count as answered but not correct). Net mirrors CAT: +3 correct, −1 wrong MCQ, no negative for TITA.</em></p></div>';
    chapterNavEl.innerHTML = ""; highlightNav(null);
    document.title = "My Stats — CAT Prep Question Bank";
  }

  // Percentile anchors: widely-reported coaching estimates (raw marks), NOT official figures.
  var PCTL = {
    "2016": { O: [[99, 168], [95, 136], [85, 106]] },
    "2017": { V: [[95, 58]], D: [[99, 44], [95, 30]], Q: [[99, 67], [95, 56]], O: [[99, 155]] },
    "2018": { O: [[99, 160]] },
    "2019": { V: [[99, 62]], D: [[99, 48]], Q: [[99, 60]] },
    "2020": { O: [[99, 101]] },
    "2021": { V: [[99, 38]], D: [[99, 28]], Q: [[99, 41]], O: [[99, 98]] },
    "2022": { V: [[99, 40]], D: [[99, 27]], Q: [[99, 34]], O: [[99, 90]] },
    "2023": { O: [[99, 83], [95, 57]] },
    "2024": { V: [[99, 40]], D: [[99, 32]], Q: [[99, 33]], O: [[99, 87]] },
    "2025": { V: [[99, 42]], D: [[99, 30]], Q: [[99, 32]] }
  };
  var SECTION_MAX = { // raw sectional/overall maxima by year (3 marks per question)
    "2016": { V: 102, D: 96, Q: 102, O: 300 }, "2017": { V: 102, D: 96, Q: 102, O: 300 },
    "2018": { V: 102, D: 96, Q: 102, O: 300 }, "2019": { V: 102, D: 96, Q: 102, O: 300 },
    "2020": { V: 78, D: 72, Q: 78, O: 228 }, "2021": { V: 72, D: 60, Q: 66, O: 198 },
    "2022": { V: 72, D: 60, Q: 66, O: 198 }, "2023": { V: 72, D: 60, Q: 66, O: 198 },
    "2024": { V: 72, D: 66, Q: 66, O: 204 }, "2025": { V: 72, D: 66, Q: 66, O: 204 }
  };
  function renderPercentile() {
    var years = Object.keys(PCTL).sort().reverse();
    var yopts = years.map(function (y) { return '<option value="' + y + '">CAT ' + y + "</option>"; }).join("");
    contentEl.innerHTML =
      '<div class="hero"><h1>🎯 Percentile Estimator</h1><p>Pick a year and section, enter a raw score (+3 / −1 scale), and see where it lands against <b>widely-reported coaching-institute estimates</b> for that paper. These are rough, slot-averaged anchors — never official cutoffs.</p></div>'
      + '<div class="est-form">'
      + '<label>Year <select id="estYear">' + yopts + "</select></label>"
      + '<label>Section <select id="estSec"><option value="O">Overall</option><option value="V">VARC</option><option value="D">DILR</option><option value="Q">QA</option></select></label>'
      + '<label>Raw score <input id="estScore" type="number" inputmode="numeric" placeholder="e.g. 45"></label>'
      + '<button class="calc-btn" id="estGo">Estimate</button></div>'
      + '<div id="estOut" class="markdown-body"></div>'
      + '<div class="q-tip">ℹ️ Real CAT percentiles come from slot-wise normalisation of scaled scores — two people with the same raw score in different slots can land differently. Use this only to set practice targets. Full anchor data lives in each year\'s <b>Paper insights</b> tab.</div>';
    function go() {
      var y = document.getElementById("estYear").value, sec = document.getElementById("estSec").value;
      var s = parseFloat(document.getElementById("estScore").value);
      var out = document.getElementById("estOut");
      var anchors = (PCTL[y] || {})[sec];
      var secName = { O: "Overall", V: "VARC", D: "DILR", Q: "QA" }[sec];
      var max = (SECTION_MAX[y] || {})[sec];
      if (!anchors) {
        out.innerHTML = "<p>No reliable public benchmark is recorded here for <b>CAT " + y + " " + secName + "</b> — check that year's <b>Paper insights</b> tab for the qualitative picture.</p>";
        return;
      }
      var lines = anchors.map(function (a) { return "<li>~<b>" + a[1] + (max ? "/" + max : "") + "</b> raw ≈ <b>" + a[0] + "th percentile</b> (widely-reported estimate)</li>"; }).join("");
      var verdict = "";
      if (isFinite(s)) {
        var sorted = anchors.slice().sort(function (a, b) { return b[0] - a[0]; });
        if (s >= sorted[0][1]) verdict = "Your score of <b>" + s + "</b> is <b>at or above the ~" + sorted[0][0] + "th percentile estimate</b> for this paper. 🏆";
        else {
          var placed = false;
          for (var i = 1; i < sorted.length; i++) {
            if (s >= sorted[i][1]) { verdict = "Your score of <b>" + s + "</b> lands <b>between the ~" + sorted[i][0] + "th and ~" + sorted[i - 1][0] + "th percentile estimates</b>."; placed = true; break; }
          }
          if (!placed) verdict = "Your score of <b>" + s + "</b> is <b>below the ~" + sorted[sorted.length - 1][0] + "th percentile anchor</b> shown for this paper — keep going.";
        }
        verdict = "<p>" + verdict + "</p>";
      }
      out.innerHTML = "<h2>CAT " + y + " · " + secName + "</h2>" + verdict + "<ul>" + lines + "</ul>";
    }
    document.getElementById("estGo").onclick = go;
    document.getElementById("estScore").addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    chapterNavEl.innerHTML = ""; highlightNav(null);
    document.title = "Percentile Estimator — CAT Prep Question Bank";
  }

  function renderToolDoc(kind) {
    var TOOLS = window.CAT_TOOLS || {};
    var src = kind === "formulas" ? TOOLS.formulas : TOOLS.strategy;
    contentEl.innerHTML = '<div class="markdown-body">' + md(src || "Content not available.") + "</div>";
    chapterNavEl.innerHTML = ""; highlightNav(null);
    document.title = (kind === "formulas" ? "QA Formula Sheet" : "Strategy Playbook") + " — CAT Prep Question Bank";
  }

  function renderChapterNav(num) {
    var i = -1; for (var k = 0; k < CH.length; k++) if (String(CH[k].num) === String(num)) { i = k; break; }
    var prev = i > 0 ? CH[i - 1] : null, next = i < CH.length - 1 ? CH[i + 1] : null, h = "";
    if (prev) h += '<a class="prev" href="#/ch/' + prev.num + '/questions"><div class="cn-label">← Previous</div><div class="cn-title">' + esc(prev.module + " · " + (prev.badge || "")) + "</div></a>"; else h += '<div class="cn-spacer"></div>';
    if (next) h += '<a class="next" href="#/ch/' + next.num + '/questions"><div class="cn-label">Next →</div><div class="cn-title">' + esc(next.module + " · " + (next.badge || "")) + "</div></a>"; else h += '<div class="cn-spacer"></div>';
    chapterNavEl.innerHTML = h;
  }

  // ---------- Router ----------
  function route() {
    var hash = location.hash || "#/home";
    window.scrollTo(0, 0); closeSidebar(); clearTimed();
    if (/^#\/stats/.test(hash)) { renderStats(); return; }
    var tm = hash.match(/^#\/tools\/(formulas|strategy|percentile)/);
    if (tm) { if (tm[1] === "percentile") renderPercentile(); else renderToolDoc(tm[1]); return; }
    var m = hash.match(/^#\/ch\/(\d{2,4})\/(notes|questions)/);
    if (m) {
      var num = m[1], view = m[2], c = chapterByNum(num);
      if (!c) { renderHome(); return; }
      try { localStorage.setItem("cat_last", hash); } catch (e) {}
      if (view === "notes") renderNotes(num); else renderQuestions(num);
      renderChapterNav(num); highlightNav(num, view);
      document.title = c.module + " " + (c.badge || "") + " — CAT Prep Question Bank";
    } else renderHome();
  }

  // ---------- Search ----------
  var searchInput = document.getElementById("search"), searchResults = document.getElementById("searchResults");
  function snippet(text, q) {
    var idx = text.toLowerCase().indexOf(q.toLowerCase()); if (idx < 0) return "";
    var start = Math.max(0, idx - 40), end = Math.min(text.length, idx + q.length + 60);
    var s = (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
    var re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return esc(s).replace(re, "<mark>$1</mark>");
  }
  function doSearch(q) {
    q = q.trim(); if (q.length < 2) { searchResults.hidden = true; return; }
    var results = [];
    CH.forEach(function (c) {
      VIEWS.forEach(function (v) {
        var text = c[v.key === "notes" ? "notes" : "questions"] || "";
        if (text.toLowerCase().indexOf(q.toLowerCase()) > -1) results.push({ num: c.num, title: c.module + " · " + (c.badge || c.title), view: v.key, vlabel: v.label, snip: snippet(text, q) });
      });
    });
    if (!results.length) { searchResults.innerHTML = '<div class="sr-empty">No matches for “' + esc(q) + '”.</div>'; searchResults.hidden = false; return; }
    var html = "";
    results.slice(0, 40).forEach(function (r) {
      html += '<a class="sr-item" href="#/ch/' + r.num + "/" + r.view + '"><div class="sr-where">' + esc(r.title) + " · " + r.vlabel + '</div><div class="sr-snip">' + r.snip + "</div></a>";
    });
    searchResults.innerHTML = html; searchResults.hidden = false;
    searchResults.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { searchResults.hidden = true; searchInput.value = ""; }); });
  }
  searchInput.addEventListener("input", function () { doSearch(this.value); });
  document.addEventListener("click", function (e) { if (!e.target.closest(".search-wrap")) searchResults.hidden = true; });

  // ---------- Sidebar toggle ----------
  var sidebar = document.getElementById("sidebar"), overlay = document.getElementById("overlay");
  function openSidebar() { sidebar.classList.add("open"); overlay.classList.add("show"); }
  function closeSidebar() { sidebar.classList.remove("open"); overlay.classList.remove("show"); }
  document.getElementById("menuBtn").addEventListener("click", function () { sidebar.classList.contains("open") ? closeSidebar() : openSidebar(); });
  overlay.addEventListener("click", closeSidebar);

  document.getElementById("themeBtn").addEventListener("click", function () { applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"); });
  var fu = document.getElementById("fontUp"), fd = document.getElementById("fontDown");
  if (fu) fu.addEventListener("click", function () { applyScale(readScale + 0.1); });
  if (fd) fd.addEventListener("click", function () { applyScale(readScale - 0.1); });
  document.getElementById("resetProgress").addEventListener("click", function () { if (confirm("Reset all progress checkmarks?")) { progress = {}; saveProgress(progress); refreshChecks(); updateProgressUI(); } });

  document.addEventListener("keydown", function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (e.key === "/" && !typing) { e.preventDefault(); searchInput.focus(); }
  });

  // ---------- Init ----------
  buildSidebar();
  updateProgressUI();
  window.addEventListener("hashchange", route);
  route();
})();
