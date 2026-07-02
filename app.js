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
    document.querySelectorAll(".nav-chap-head").forEach(function (n) { n.classList.remove("active"); });
    document.querySelectorAll(".nav-sub a").forEach(function (a) { a.classList.remove("active"); });
    document.querySelectorAll(".nav-chapter").forEach(function (w) { w.classList.remove("open"); });
    if (!num) {
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
    var hero = '<div class="hero"><h1>🎯 CAT Prep Question Bank</h1>'
      + '<p>Year-wise practice built around the <b>last 10 years of CAT papers (2016–2025)</b> — VARC, DILR &amp; Quant question sets with instant answers, full worked solutions and paper-level insights. '
      + '<b>' + totalQ + ' questions</b> and counting. Study at your own pace.</p>'
      + '<div class="hero-cta">'
      + (CH.length ? '<a href="#/ch/' + CH[0].num + '/questions" class="cta">📝 Start with CAT ' + esc(String(CH[0].module).replace(/\D/g, "")) + '</a>' : "")
      + '<a href="#/ch/163/questions" class="cta ghost">⏪ Or begin from 2016</a></div></div>';
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
  function qCard(q, t) {
    var opts = "";
    ["A", "B", "C", "D"].forEach(function (L, i) {
      opts += '<button class="q-opt" data-i="' + i + '"><span class="q-letter">' + L + '</span><span class="q-otext">' + inlineMd(q.options[i]) + "</span></button>";
    });
    var tag = q.tita ? "⌨️ TITA · no negative" : "+3 / −1";
    return '<div class="q-card" data-tier="' + t.cls + '" data-qid="' + q.id + '" data-correct="' + q.correct + '">'
      + '<div class="q-head"><span class="q-num">Q' + q.id + '</span><span class="q-tierlabel ' + t.cls + '">' + t.dot + " " + esc(t.label) + '</span><span class="p-case-marks">' + tag + "</span></div>"
      + '<div class="q-text">' + inlineMd(q.q) + "</div>"
      + '<div class="q-opts">' + opts + "</div>"
      + '<div class="q-expl markdown-body" hidden>' + md(q.expl) + "</div></div>";
  }
  function renderTierCards(parsed) {
    var h = "";
    parsed.tiers.forEach(function (t) {
      var count = tierQuestions(t).length;
      h += '<div class="q-tier-head ' + t.cls + '">' + t.dot + " " + esc(t.label) + ' <span class="q-tier-count">' + count + " questions</span></div>";
      t.items.forEach(function (it) {
        if (it.kind === "q") { h += qCard(it.q, t); return; }
        h += '<div class="p-case" data-tier="' + t.cls + '"><div class="p-case-head">🧩 ' + esc(it.title)
          + ' <span class="p-case-marks">' + it.questions.length + " questions</span></div>"
          + '<div class="p-case-scenario markdown-body">' + md(it.scenario) + "</div>";
        it.questions.forEach(function (q) { h += qCard(q, t); });
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

  function applyAnswer(card, chosen, restore) {
    card.classList.add("answered");
    var correct = parseInt(card.dataset.correct, 10);
    card.querySelectorAll(".q-opt").forEach(function (o, idx) {
      o.disabled = true;
      if (idx === correct) o.classList.add("correct");
      if (idx === chosen && chosen !== correct) o.classList.add("wrong");
      if (idx === chosen) o.classList.add("chosen");
    });
    card.querySelector(".q-expl").hidden = false;
    if (!restore) {
      var fl = chosen === correct ? "flash-ok" : "flash-no";
      card.classList.add(fl); setTimeout(function () { card.classList.remove(fl); }, 700);
    }
  }
  function updateQuizScore() {
    var map = questionMap(), ans = 0, correct = 0, net = 0;
    Object.keys(quizCtx.saved).forEach(function (qid) {
      var q = map[qid]; if (!q) return;
      ans++;
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
    var list = document.getElementById("qList"); list.innerHTML = renderTierCards(quizCtx.parsed);
    Object.keys(quizCtx.saved).forEach(function (qid) { var card = list.querySelector('.q-card[data-qid="' + qid + '"]'); if (card) applyAnswer(card, quizCtx.saved[qid], true); });
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
    var chips = '<div class="q-filters"><button class="q-chip active" data-f="all">All (' + total + ")</button>";
    if (counts.easy) chips += '<button class="q-chip" data-f="easy">🟢 Easy (' + counts.easy + ")</button>";
    if (counts.med) chips += '<button class="q-chip" data-f="med">🟡 Medium (' + counts.med + ")</button>";
    if (counts.hard) chips += '<button class="q-chip" data-f="hard">🔴 Hard (' + counts.hard + ")</button>";
    if (counts.mix) chips += '<button class="q-chip" data-f="mix">📝 Sets (' + counts.mix + ")</button>";
    chips += "</div>";
    var bar = '<div class="q-scorebar"><div class="q-score-text">📊 <b id="qAns">0</b>/' + total + ' answered · <b id="qCorrect">0</b> correct · net <b id="qNet">0</b> <span id="qPct" class="q-pct"></span></div>'
      + '<div class="q-progress"><div id="qFill" class="q-progress-fill"></div></div>'
      + '<div id="qDone" class="q-done" hidden><span id="qDoneMsg"></span></div></div>';
    var tools = '<div class="quiz-tools"><button id="qShuffle">🔀 Shuffle</button><button id="qReset">↺ Reset answers</button><button id="qReading">📄 Reading mode</button><button id="toTop">↑ Top</button></div>';
    var tip = '<div class="q-tip">💡 Tap an option to lock your answer — you will instantly see the right choice and a full solution. Scoring mirrors CAT: <b>+3</b> correct, <b>−1</b> wrong MCQ, <b>no negative</b> for TITA-style questions.</div>';
    contentEl.innerHTML = viewTabs(num, "questions")
      + '<div id="quizInteractive">' + chips + bar + tip + tools + '<div id="qList">' + renderTierCards(parsed) + "</div></div>";
    bindMarkRead(num, "questions");

    var root = document.getElementById("quizInteractive"), list = document.getElementById("qList");
    Object.keys(saved).forEach(function (qid) { var card = list.querySelector('.q-card[data-qid="' + qid + '"]'); if (card) applyAnswer(card, saved[qid], true); });
    updateQuizScore();
    list.addEventListener("click", function (e) {
      var btn = e.target.closest(".q-opt"); if (!btn) return;
      var card = btn.closest(".q-card"); if (card.classList.contains("answered")) return;
      var i = parseInt(btn.dataset.i, 10);
      applyAnswer(card, i, false); quizCtx.saved[card.dataset.qid] = i; saveQuiz(); updateQuizScore();
    });
    root.querySelectorAll(".q-chip").forEach(function (ch) {
      ch.addEventListener("click", function () {
        root.querySelectorAll(".q-chip").forEach(function (x) { x.classList.remove("active"); });
        ch.classList.add("active");
        list.className = ""; if (ch.dataset.f !== "all") list.classList.add("filter-" + ch.dataset.f);
      });
    });
    document.getElementById("qReset").onclick = function () { if (confirm("Clear your saved answers for this section?")) { quizCtx.saved = {}; saveQuiz(); renderQuestions(num); } };
    document.getElementById("qShuffle").onclick = shuffleQuiz;
    document.getElementById("qReading").onclick = toggleReading;
    document.getElementById("toTop").onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };
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
    window.scrollTo(0, 0); closeSidebar();
    var m = hash.match(/^#\/ch\/(\d{2,4})\/(notes|questions)/);
    if (m) {
      var num = m[1], view = m[2], c = chapterByNum(num);
      if (!c) { renderHome(); return; }
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
