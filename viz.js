/* CATViz — inline SVG diagram engine for question explanations.
   Explanations embed a spec as [[VIZ]]{...json...}[[/VIZ]]; app.js strips it
   from the rendered markdown and calls CATViz.render(spec) to inject a diagram. */
(function () {
  "use strict";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function n(v, d) { return isFinite(v) ? v : (d || 0); }

  function svgWrap(w, h, inner, viewBox) {
    return '<svg class="viz-svg" viewBox="' + (viewBox || ("0 0 " + w + " " + h)) + '" width="100%" height="' + Math.min(h, 320) + '" preserveAspectRatio="xMidYMid meet">' + inner + "</svg>";
  }
  function line(x1, y1, x2, y2, extra) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" ' + (extra || 'stroke="var(--text-soft)" stroke-width="2"') + "/>"; }
  function circle(cx, cy, r, extra) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' + (extra || 'fill="none" stroke="var(--brand)" stroke-width="2.5"') + "/>"; }
  function text(x, y, s, extra) { return '<text x="' + x + '" y="' + y + '" ' + (extra || 'font-size="13" fill="var(--text)" text-anchor="middle"') + ">" + esc(s) + "</text>"; }
  function poly(pts, extra) { return '<polygon points="' + pts.map(function (p) { return p[0] + "," + p[1]; }).join(" ") + '" ' + (extra || 'fill="none" stroke="var(--brand)" stroke-width="2.5"') + "/>"; }
  function dot(x, y, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="3.5" ' + (extra || 'fill="var(--brand)"') + "/>"; }

  /* ---------- Circle with one or two chords ---------- */
  function circleChord(spec) {
    var W = 280, H = 280, cx = 140, cy = 140, R = 100;
    var r = n(spec.radius, 10);
    var scale = R / r;
    var chords = spec.chords || [];
    var parts = [circle(cx, cy, R), dot(cx, cy), text(cx, cy - 8, "O", { style: "font-size:12px" })];
    var colors = ["var(--brand)", "var(--accent)"];
    chords.forEach(function (ch, i) {
      var half = n(ch.length) / 2 * scale, d = n(ch.distance) * scale;
      // place chord horizontally at distance d below/above centre, alternating sides for two chords
      var side = i % 2 === 0 ? 1 : -1;
      var y = cy + side * d;
      var x1 = cx - half, x2 = cx + half;
      parts.push(line(x1, y, x2, y, 'stroke="' + colors[i % 2] + '" stroke-width="3"'));
      parts.push(line(cx, cy, cx, y, 'stroke="var(--text-soft)" stroke-width="1.5" stroke-dasharray="4,3"'));
      parts.push(text((x1 + x2) / 2, y - 8, (ch.label || "chord") + " = " + ch.length, { style: "font-size:12px;fill:" + colors[i % 2] }));
      if (ch.distance) parts.push(text(cx + 14, (cy + y) / 2, "d=" + ch.distance, { style: "font-size:11px;fill:var(--text-soft)" }));
    });
    return svgWrap(W, H, parts.join(""));
  }

  /* ---------- Right triangle (legs a,b, hyp c; optional altitude) ---------- */
  function rightTriangle(spec) {
    var a = n(spec.a || (spec.legs || [])[0], 3), b = n(spec.b || (spec.legs || [])[1], 4);
    var W = 320, H = 260, pad = 40;
    var scale = Math.min((W - 2 * pad) / b, (H - 2 * pad) / a);
    var bx = pad, by = H - pad, tx = pad, ty = H - pad - a * scale, rx = pad + b * scale, ry = H - pad;
    var parts = [poly([[bx, by], [tx, ty], [rx, ry]], 'fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2.5"')];
    parts.push(text((bx + tx) / 2 - 16, (by + ty) / 2, spec.aLabel || String(a), { style: "font-size:13px;font-weight:700" }));
    parts.push(text((tx + rx) / 2, ty - 10, spec.bLabel || String(b), { style: "font-size:13px;font-weight:700" }));
    parts.push(text((bx + rx) / 2, (by + ry) / 2 + 20, spec.cLabel || (spec.c ? String(spec.c) : "?"), { style: "font-size:13px;font-weight:700" }));
    parts.push('<rect x="' + (bx) + '" y="' + (by - 14) + '" width="14" height="14" fill="none" stroke="var(--text-soft)" stroke-width="1.5"/>');
    if (spec.altitude) {
      // foot of altitude from the right angle (bx,by) to hypotenuse
      var fx = tx + (rx - tx) * (a * a) / (a * a + b * b);
      var fy = ty + (ry - ty) * (a * a) / (a * a + b * b);
      parts.push(line(bx, by, fx, fy, 'stroke="var(--warn)" stroke-width="2" stroke-dasharray="5,3"'));
      parts.push(dot(fx, fy, 'fill="var(--warn)"'));
      parts.push(text(fx + 12, fy, "h", { style: "font-size:12px;fill:var(--warn)" }));
    }
    return svgWrap(W, H, parts.join(""));
  }

  /* ---------- Cone (r, h, l) ---------- */
  function cone(spec) {
    var r = n(spec.r, 5), h = n(spec.h, 12);
    var W = 260, H = 260, cx = 130, apexY = 40, baseY = 210;
    var scaleH = (baseY - apexY) / h, rr = Math.max(40, Math.min(90, r * (140 / (r + h))));
    var parts = [];
    parts.push('<ellipse cx="' + cx + '" cy="' + baseY + '" rx="' + rr + '" ry="' + (rr * 0.28) + '" fill="var(--surface-2)" stroke="var(--brand)" stroke-width="2"/>');
    parts.push(line(cx - rr, baseY, cx, apexY, 'stroke="var(--brand)" stroke-width="2.5"'));
    parts.push(line(cx + rr, baseY, cx, apexY, 'stroke="var(--brand)" stroke-width="2.5"'));
    parts.push(line(cx, apexY, cx, baseY, 'stroke="var(--text-soft)" stroke-width="1.5" stroke-dasharray="4,3"'));
    parts.push(line(cx, baseY, cx + rr, baseY, 'stroke="var(--text-soft)" stroke-width="1.5" stroke-dasharray="4,3"'));
    parts.push(text(cx + rr / 2, baseY + 18, "r=" + r, { style: "font-size:12px" }));
    parts.push(text(cx - 16, (apexY + baseY) / 2, "h=" + h, { style: "font-size:12px" }));
    if (spec.l) parts.push(text(cx + rr / 2 + 18, (apexY + baseY) / 2 - 10, "l=" + spec.l, { style: "font-size:12px;fill:var(--accent)" }));
    return svgWrap(W, H, parts.join(""));
  }

  /* ---------- Number line with shaded solution interval(s) ---------- */
  function numberLine(spec) {
    var W = 460, H = 110, pad = 30, min = n(spec.min, -5), max = n(spec.max, 10);
    var scale = (W - 2 * pad) / (max - min);
    function X(v) { return pad + (v - min) * scale; }
    var parts = [line(pad, 60, W - pad, 60, 'stroke="var(--text-soft)" stroke-width="2"')];
    for (var v = Math.ceil(min); v <= Math.floor(max); v++) {
      parts.push(line(X(v), 55, X(v), 65, 'stroke="var(--text-soft)" stroke-width="1.5"'));
      if (v % (max - min > 20 ? 2 : 1) === 0) parts.push(text(X(v), 84, v, { style: "font-size:11px" }));
    }
    (spec.shade || []).forEach(function (seg) {
      var openL = seg[2] === "open-left" || seg[2] === "open-both", openR = seg[2] === "open-right" || seg[2] === "open-both";
      parts.push('<rect x="' + X(seg[0]) + '" y="54" width="' + (X(seg[1]) - X(seg[0])) + '" height="12" fill="var(--brand)" opacity="0.28"/>');
      parts.push(line(X(seg[0]), 60, X(seg[1]), 60, 'stroke="var(--brand)" stroke-width="4"'));
      parts.push('<circle cx="' + X(seg[0]) + '" cy="60" r="5" fill="' + (openL ? "var(--surface)" : "var(--brand)") + '" stroke="var(--brand)" stroke-width="2"/>');
      parts.push('<circle cx="' + X(seg[1]) + '" cy="60" r="5" fill="' + (openR ? "var(--surface)" : "var(--brand)") + '" stroke="var(--brand)" stroke-width="2"/>');
    });
    (spec.points || []).forEach(function (p) {
      parts.push(dot(X(p.x), 60));
      parts.push(text(X(p.x), 40, p.label != null ? p.label : p.x, { style: "font-size:12px;font-weight:700;fill:var(--brand)" }));
    });
    return svgWrap(W, H, parts.join(""));
  }

  /* ---------- Venn diagrams (2 or 3 sets) with region counts ---------- */
  function venn2(spec) {
    var W = 320, H = 220, r = 78;
    var c1x = 130, c2x = 190, cy = 110;
    var labels = spec.labels || ["A", "B"], c = spec.counts || {};
    var parts = [
      '<circle cx="' + c1x + '" cy="' + cy + '" r="' + r + '" fill="var(--brand)" opacity="0.22" stroke="var(--brand)" stroke-width="2"/>',
      '<circle cx="' + c2x + '" cy="' + cy + '" r="' + r + '" fill="var(--accent)" opacity="0.22" stroke="var(--accent)" stroke-width="2"/>',
      text(c1x - 46, cy - 46, labels[0], { style: "font-size:14px;font-weight:700;fill:var(--brand)" }),
      text(c2x + 46, cy - 46, labels[1], { style: "font-size:14px;font-weight:700;fill:var(--accent)" }),
      text(c1x - 34, cy, c.onlyA != null ? c.onlyA : "", { style: "font-size:15px;font-weight:800" }),
      text((c1x + c2x) / 2, cy, c.both != null ? c.both : "", { style: "font-size:15px;font-weight:800" }),
      text(c2x + 34, cy, c.onlyB != null ? c.onlyB : "", { style: "font-size:15px;font-weight:800" })
    ];
    if (c.none != null) parts.push(text(W / 2, H - 16, "Neither: " + c.none, { style: "font-size:12px;fill:var(--text-soft)" }));
    return svgWrap(W, H, parts.join(""));
  }
  function venn3(spec) {
    var W = 340, H = 260;
    var pts = { A: [130, 100], B: [190, 100], C: [160, 150] }, r = 72;
    var labels = spec.labels || ["A", "B", "C"], c = spec.counts || {};
    var colors = ["var(--brand)", "var(--accent)", "var(--warn)"];
    var parts = [];
    ["A", "B", "C"].forEach(function (k, i) {
      parts.push('<circle cx="' + pts[k][0] + '" cy="' + pts[k][1] + '" r="' + r + '" fill="' + colors[i] + '" opacity="0.2" stroke="' + colors[i] + '" stroke-width="2"/>');
    });
    parts.push(text(100, 40, labels[0], { style: "font-size:13px;font-weight:700;fill:" + colors[0] }));
    parts.push(text(220, 40, labels[1], { style: "font-size:13px;font-weight:700;fill:" + colors[1] }));
    parts.push(text(160, 232, labels[2], { style: "font-size:13px;font-weight:700;fill:" + colors[2] }));
    var regions = [
      [110, 80, c.a], [210, 80, c.b], [160, 175, c.c],
      [160, 80, c.ab], [125, 130, c.ac], [195, 130, c.bc], [160, 118, c.abc]
    ];
    regions.forEach(function (p) { if (p[2] != null) parts.push(text(p[0], p[1], p[2], { style: "font-size:13px;font-weight:800" })); });
    if (c.none != null) parts.push(text(W / 2, H - 8, "None: " + c.none, { style: "font-size:12px;fill:var(--text-soft)" }));
    return svgWrap(W, H, parts.join(""));
  }

  /* ---------- Simple bar chart (one or two series) ---------- */
  function barChart(spec) {
    var cats = spec.categories || [], series = spec.series || [{ name: "", values: [] }];
    var W = Math.max(320, cats.length * 70), H = 220, pad = 34, top = 20;
    var allVals = [].concat.apply([], series.map(function (s) { return s.values; }));
    var max = Math.max.apply(null, allVals.concat([1]));
    var groupW = (W - 2 * pad) / cats.length, barW = groupW / (series.length + 1);
    var colors = ["var(--brand)", "var(--accent)", "var(--warn)"];
    var parts = [line(pad, H - pad, W - pad, H - pad, 'stroke="var(--text-soft)" stroke-width="2"')];
    cats.forEach(function (cat, ci) {
      series.forEach(function (s, si) {
        var v = n(s.values[ci]);
        var bh = (H - pad - top) * (v / max);
        var x = pad + ci * groupW + si * barW + barW * 0.15;
        parts.push('<rect x="' + x + '" y="' + (H - pad - bh) + '" width="' + (barW * 0.7) + '" height="' + bh + '" fill="' + colors[si % colors.length] + '" rx="3"/>');
        parts.push(text(x + barW * 0.35, H - pad - bh - 6, v, { style: "font-size:11px;font-weight:700" }));
      });
      parts.push(text(pad + ci * groupW + groupW / 2, H - pad + 18, cat, { style: "font-size:11.5px" }));
    });
    if (series.length > 1 && series[0].name) {
      series.forEach(function (s, si) {
        parts.push('<rect x="' + (pad + si * 90) + '" y="2" width="10" height="10" fill="' + colors[si % colors.length] + '"/>');
        parts.push(text(pad + si * 90 + 40, 11, s.name, { style: "font-size:11px" }));
      });
    }
    return svgWrap(W, H, parts.join(""), "0 0 " + W + " " + H);
  }

  /* ---------- Linear or circular arrangement ---------- */
  function arrangementRow(spec) {
    var seats = spec.seats || [];
    var W = Math.max(300, seats.length * 76), H = 140;
    var parts = [];
    if (spec.circular) {
      var cx = W / 2, cy = 76, R = Math.min(cx, cy) - 30;
      seats.forEach(function (s, i) {
        var ang = -Math.PI / 2 + (2 * Math.PI * i) / seats.length;
        var x = cx + R * Math.cos(ang), y = cy + R * Math.sin(ang);
        parts.push('<circle cx="' + x + '" cy="' + y + '" r="24" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>');
        parts.push(text(x, y + 5, s, { style: "font-size:13px;font-weight:700" }));
      });
      parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="3,4"/>');
    } else {
      seats.forEach(function (s, i) {
        var x = 40 + i * 76;
        parts.push('<rect x="' + x + '" y="40" width="60" height="46" rx="8" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>');
        parts.push(text(x + 30, 68, s, { style: "font-size:13px;font-weight:700" }));
        parts.push(text(x + 30, 100, "seat " + (i + 1), { style: "font-size:10.5px;fill:var(--text-soft)" }));
      });
    }
    return svgWrap(W, H, parts.join(""));
  }

  /* ---------- Race track (relative finishing positions) ---------- */
  function raceTrack(spec) {
    var W = 420, H = 40 + (spec.runners || []).length * 34, len = n(spec.length, 100);
    var pad = 30, scale = (W - 2 * pad) / len;
    var parts = [line(pad, 20, W - pad, 20, 'stroke="var(--text-soft)" stroke-width="2"'), text(W - pad, 14, "finish", { style: "font-size:10.5px;fill:var(--text-soft)" })];
    (spec.runners || []).forEach(function (r, i) {
      var y = 45 + i * 34, x = pad + n(r.pos) * scale;
      parts.push(line(pad, y, W - pad, y, 'stroke="var(--border)" stroke-width="1"'));
      parts.push(line(pad, y - 8, pad, y + 8, 'stroke="var(--text-soft)" stroke-width="1.5"'));
      parts.push(line(W - pad, y - 8, W - pad, y + 8, 'stroke="var(--text-soft)" stroke-width="1.5"'));
      parts.push('<circle cx="' + x + '" cy="' + y + '" r="7" fill="var(--brand)"/>');
      parts.push(text(x, y - 12, r.name + " (" + r.pos + ")", { style: "font-size:11px;font-weight:700" }));
    });
    return svgWrap(W, H, parts.join(""));
  }

  /* ---------- Node-edge network (DILR acquaintance/graph sets) ---------- */
  function network(spec) {
    var nodes = spec.nodes || [], W = 300, H = 260, cx = 150, cy = 130, R = 95;
    var pos = {};
    nodes.forEach(function (name, i) {
      var ang = -Math.PI / 2 + (2 * Math.PI * i) / nodes.length;
      pos[name] = [cx + R * Math.cos(ang), cy + R * Math.sin(ang)];
    });
    var parts = [];
    (spec.edges || []).forEach(function (e) {
      if (pos[e[0]] && pos[e[1]]) parts.push(line(pos[e[0]][0], pos[e[0]][1], pos[e[1]][0], pos[e[1]][1], 'stroke="var(--brand)" stroke-width="2" opacity="0.7"'));
    });
    nodes.forEach(function (name) {
      var p = pos[name];
      parts.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="20" fill="var(--surface)" stroke="var(--brand)" stroke-width="2.5"/>');
      parts.push(text(p[0], p[1] + 5, name, { style: "font-size:12.5px;font-weight:700" }));
    });
    return svgWrap(W, H, parts.join(""));
  }

  var RENDERERS = {
    "circle-chord": circleChord, "right-triangle": rightTriangle, "cone": cone,
    "number-line": numberLine, "venn2": venn2, "venn3": venn3,
    "bar-chart": barChart, "arrangement-row": arrangementRow,
    "race-track": raceTrack, "network": network
  };

  function attrStr(o) {
    if (typeof o === "string") return o;
    return Object.keys(o).map(function (k) { return k + '="' + o[k] + '"'; }).join(" ");
  }
  // patch helper fns above to accept either a string or object for `extra`
  var _text = text;
  text = function (x, y, s, extra) { return _text(x, y, s, extra ? attrStr(extra) : null); };

  function render(spec) {
    try {
      var fn = RENDERERS[spec && spec.type];
      if (!fn) return "";
      var html = fn(spec);
      return '<div class="viz-box">' + (spec.title ? '<div class="viz-title">📊 ' + esc(spec.title) + "</div>" : "") + html + "</div>";
    } catch (e) { return ""; }
  }

  // Extract a [[VIZ]]{...}[[/VIZ]] block from explanation text; returns { text, spec }
  function extract(expl) {
    var s = expl || "";
    var m = s.match(/\[\[VIZ\]\]([\s\S]*?)\[\[\/VIZ\]\]/);
    if (!m) return { text: s, spec: null };
    var spec = null;
    try { spec = JSON.parse(m[1]); } catch (e) { spec = null; }
    return { text: s.replace(m[0], "").trim(), spec: spec };
  }

  window.CATViz = { render: render, extract: extract };
})();
