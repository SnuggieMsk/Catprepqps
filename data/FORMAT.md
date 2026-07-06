# Data file format — `data/cat20XX.js`

Each file registers the three section chapters for one CAT year. It must be plain ES5-compatible JavaScript, loaded via a `<script>` tag (no modules, no template literals).

```js
window.CAT_DATA = window.CAT_DATA || [];
window.CAT_DATA.push({
  num: "253",            // (last two digits of year) + section digit: 1=VARC, 2=DILR, 3=QA  → 2025 QA = "253", 2016 VARC = "161"
  module: "CAT 2025",    // year group shown in the sidebar
  badge: "QA",           // "VARC" | "DILR" | "QA"
  title: "Quantitative Ability",   // "Verbal Ability & Reading Comprehension" | "Data Interpretation & Logical Reasoning" | "Quantitative Ability"
  notes: [ /* markdown lines */ ].join("\n"),
  questions: [ /* markdown lines */ ].join("\n")
});
```

Use the **array-of-double-quoted-lines `.join("\n")`** style for `notes` and `questions`. Escape any internal double quotes with `\"`. Never use backticks.

## `notes` — the "Paper insights" tab

Markdown describing how that year's **real section** looked: number of slots, questions, TITA count, sectional time, difficulty verdict, a topic-breakdown table, what a competitive attempt/score looked like (label these as widely-reported estimates), and 4–6 prep takeaways. 35–60 lines.

## `questions` — the question bank

Structure (parsed by a strict regex — follow it exactly):

- Difficulty tiers begin with an H2 heading containing the emoji **and** the word:
  `## 🟢 Easy — warm-ups` · `## 🟡 Medium — the scoring zone` · `## 🔴 Hard — the rank-makers`
- Inside a tier, a **set** (RC passage or DILR set) begins with an H3 heading:
  `### 📄 RC — <short label>` or `### 🧩 <set name>`
  The markdown between the H3 heading and its first question is rendered as the shared passage / set data. Its questions follow inside the same H3 block.
- Standalone questions sit directly under the H2 tier (QA and Verbal Ability singles).

Each question block is EXACTLY:

```
**Q7.** One-paragraph stem in plain markdown. For a question that was type-in-the-answer in the real exam, end the stem with *(TITA in the actual exam)*.
A) first option B) second option C) third option D) fourth option
<details><summary>Answer & explanation</summary>

**Correct: B)** Full worked solution in markdown. Explain the method step by step, then briefly why each wrong option is tempting/wrong. End with:

📌 *Modeled on: CAT 20XX <section> — <topic / question-type this mirrors from the real paper>.*

</details>
```

Hard rules:

1. **All four options on ONE line**, in order `A) … B) … C) … D) …`. Options must be short (≤ 60 chars), contain **no newlines**, and must not themselves contain a capital letter followed by `)` (e.g. never write "(B)" inside an option).
2. The answer line inside `<details>` must start with `**Correct: X)**` where X ∈ A–D.
3. Question IDs `Q1…Qn` are sequential and unique **within a chapter** (restart at Q1 in each chapter).
4. No LaTeX / `$…$`. Write maths with unicode: × ÷ √ ² ³ ½ ¾ π ≤ ≥ ≠ ⇒ ∠ °.
5. No raw HTML other than the `<details><summary>…</summary>…</details>` wrapper.
6. Keep every stem self-contained (all data needed to solve it is in the stem or its set's passage).

## Content rules

- Questions are **original re-creations** modeled on the publicly known topic mix, question types, difficulty and famous patterns of that year's actual paper. Do **not** copy question text, RC passages, or solutions from the official papers or any coaching site — write fresh passages, fresh data, fresh numbers.
- RC passages: 150–220 words, original writing, on a theme similar to what that year's paper actually used.
- DILR sets: original data/constraints in the style of that year's set types; 4 questions per set.
- Every explanation ends with the `📌 Modeled on:` line saying which real-paper theme it mirrors.

## Visual diagrams (optional, `[[VIZ]]` blocks)

Any question's explanation may embed ONE diagram spec, on its own line, anywhere before the closing `</details>` (conventionally right before the `📌 Modeled on:` line):

```
[[VIZ]]{"type":"circle-chord","title":"...","radius":10,"chords":[{"length":16,"distance":6,"label":"AB"}]}[[/VIZ]]
```

The app (`viz.js`) strips this marker from the rendered explanation and renders an inline SVG in its place. Supported `type` values and their fields:

- `circle-chord` — `{radius, chords:[{length, distance, label}, ...up to 2]}`
- `right-triangle` — `{a, b, c, altitude?:bool}` (a,b = legs, c = hypotenuse)
- `cone` — `{r, h, l?}`
- `number-line` — `{min, max, shade:[[from,to,"open-left"|"open-right"|"open-both"?]], points:[{x,label?}]}`
- `venn2` — `{labels:["A","B"], counts:{onlyA, onlyB, both, none?}}`
- `venn3` — `{labels:["A","B","C"], counts:{a,b,c,ab,bc,ac,abc,none?}}` (a/b/c = only-that-set regions)
- `bar-chart` — `{categories:[...], series:[{name?, values:[...]}]}`
- `arrangement-row` — `{seats:[...], circular?:bool}`
- `race-track` — `{length, runners:[{name, pos}]}`
- `network` — `{nodes:[...], edges:[["A","B"], ...]}`

Rules: only add a diagram where it genuinely clarifies the **solved** configuration/numbers (not the raw stem); every number in the spec must exactly match the question's actual given/derived values — never invented data; valid one-line JSON, double-quoted.
