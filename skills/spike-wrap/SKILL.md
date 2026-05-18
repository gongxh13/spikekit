---
name: spike-wrap
description: >-
  Consolidate a completed spike (a `.spike/<topic>/` scratch directory) into durable
  design docs, then clean up. Produces TWO documents: a detailed Markdown design doc for
  agents at `docs/designs/agents/<topic>/design.md` (the source of truth — alignment
  conclusions, the decision log, the validated approach, implementation plan) and a
  rich, interactive HTML page for humans at `docs/designs/humans/<topic>/index.html`
  (sidebar-navigated, with terminal walkthroughs, evidence cards, before/after toggles,
  timeline, and an experiments appendix — designed to be skimmable yet trustworthy).
  Also updates the index at `docs/designs/README.md` and a browsable
  `docs/designs/humans/index.html`, then deletes the scratch directory (asking the user
  first).
  Use this when a spike or exploration session has converged and the user wants it
  written up — "wrap up this spike", "the approach is confirmed, write it up",
  "consolidate the `.spike/` stuff into a design doc", "ok this works, document it", or
  "/spike-wrap". Pairs with `/spike`.
---

# Spike-wrap: consolidate a spike into design docs

## Why this exists

A spike (see the `/spike` skill) leaves a `.spike/<topic>/` scratch directory full of
experiments and a `NOTES.md` log. This skill turns that into the durable artifact: the
design doc that someone — likely a fresh agent — uses to actually build the thing. Two
docs, because LLMs now produce content faster than humans can read it:

- **For agents** — `docs/designs/agents/<topic>/design.md`. Full detail, Markdown. The
  source of truth.
- **For humans** — `docs/designs/humans/<topic>/index.html`. A **rich, interactive
  page** that tells the story of the spike: how it works, what's in flight in the
  ecosystem, what was validated, decisions and why, the timeline of how thinking
  evolved, and an appendix of every experiment actually run. Sidebar navigation lets
  the reader jump around. The goal is not a passive summary but a confident,
  skimmable-yet-trustworthy artifact.

Keep these distinct: the HTML is **distilled from** the Markdown — same facts,
different shape and depth. The HTML earns its keep through structure, interactivity,
and the experiments appendix; the Markdown is for implementers reading top-to-bottom.

**Language:** these instructions are in English for convenience — not a cue to write in
English. Produce everything that's prose in the user's working language: the design doc's
body, the HTML, the index entries. Frontmatter field names and the `status` value
(`validated` / `implemented` / `abandoned`, which doubles as a CSS class and an index
key) stay as-is.

## 1. Find the spike

Locate `.spike/<topic>/`. If the user named a topic, use it. If there's exactly one, use
it. If there are several, list them and ask which. Read `NOTES.md` and skim the
artifacts so you actually know what happened — don't write the doc from memory alone.
Especially: identify every concrete **experiment** that was run (commands, results) —
those become the appendix in step 4.

## 2. Confirm title & status

Briefly confirm with the user (state your assumption and move on if it's obvious from the
spike):

- the topic slug and a human-readable title
- the **status**: `validated` (works, ready to implement) / `implemented` (already
  built) / `abandoned` (doesn't work — still worth a doc so nobody re-walks the maze)

## 3. Write the agent doc — `docs/designs/agents/<topic>/design.md`

This is the source of truth; include everything an implementer needs. Use this structure
(adapt the section *contents* to the spike; keep the headings):

```markdown
---
topic: <slug>
title: <title>
status: validated | implemented | abandoned
created: <YYYY-MM-DD>
spike_dir: .spike/<topic>/        # deleted after this doc unless you keep it; recorded for provenance
related_code: []                   # fill in with paths once implemented
human_summary: ../../humans/<topic>/index.html
---

# <Title>

## What this is
One paragraph: what we set out to validate, and the outcome.

## Goal & context
The broader goal this feeds. Why it matters. Scope — what's in, what's out.

## Alignment conclusions
Bulleted. The things the human and the agent agreed on during the spike —
requirements, constraints, decisions, clarifications that aren't obvious from the
code. Each bullet stands on its own.

## What we tried — decision log
The path, dead ends included: "tried X → didn't work because Y → switched to Z."
This is what saves the next person from re-walking the maze.

## The approach
The validated design, in enough detail to implement:
- interaction / control flow
- data shapes, key APIs, example payloads
- components and files to touch
- error handling and edge cases discovered during validation
- anything fiddly that was learned the hard way

## Open questions & risks
What's still uncertain; what to watch out for during implementation.

## Implementation plan
Concrete, ordered steps to build this — the checklist a fresh agent picks up and
executes.
```

If the status is `abandoned`: replace "The approach" with "Why it doesn't work / what
would have to change", and drop "Implementation plan".

Before the cleanup step, move anything genuinely worth keeping — a reference payload, a
diagram, a screenshot — from the scratch dir into `docs/designs/agents/<topic>/assets/`
rather than letting it vanish.

## 4. Write the human HTML — `docs/designs/humans/<topic>/index.html`

This is the **main craft step** of spike-wrap. The HTML must work as a self-contained,
single-file artifact (inline CSS + JS, no build step, no external dependencies, no
network requests). Open it from disk and it renders.

### 4.1 Don't fill in a template — design the page

There is no fixed "fill-in-the-blanks" template. Every spike has its own shape, and the
HTML should reflect that shape. Start from `assets/starter.html` in this skill — it
gives you the **layout scaffolding (sidebar nav + main column), styling primitives
(typography, badges, code blocks, dark/light mode), and snippet examples of the common
interactive patterns** — then design the actual content interactively per what this
spike calls for.

### 4.2 Required structural elements

- **Sidebar nav, not top nav.** Put a sticky sidebar on the left (collapses to a top
  bar on narrow screens via media query — the starter handles this). Each top-level
  section gets one anchor link in the sidebar. Sidebar makes long pages navigable
  without scroll-hunting and gives the reader a permanent table of contents.
- **Hero at the top** stating the topic in plain language and the punchline (the
  single most important takeaway). For `validated` spikes the punchline is usually
  the design decision; for `abandoned` it's what doesn't work and why.
- **Self-contained:** inline `<style>` + `<script>`, no external fonts or assets
  (system font stack works fine). The reader may open this offline.
- **Dark/light mode** via `prefers-color-scheme` (the starter does this for you —
  inherit it).
- **`<html lang>`** matches the working language. Translate headings, labels, badges.
- **Footer** linking back to the agent design doc.

### 4.3 Section menu — pick what fits this spike

Not every spike needs every section. Pick from this menu:

| Section | When to include | Form |
|---|---|---|
| **How it works / user journey** | Almost always (validated/implemented). When there's a concrete user flow worth showing. | Interactive terminal walkthrough (numbered steps; step buttons or arrow keys advance; left-column terminal sim, right-column explanation) — or a numbered ordered list if the flow is shorter. |
| **Ecosystem / evidence** | When the spike's outcome rests on external sources (PRs, libs, issues, papers). Especially when "we don't build, we adopt" is the conclusion. | Card grid: each card is one external artifact, with title, URL (whole card clickable), status badge (color-coded), brief description, and "解决什么问题" (what it solves). |
| **Conceptual diagram** | When the architecture has layers / actors / data flow that benefits from a picture more than prose. | Inline SVG, or a labelled box-and-arrow built with HTML+CSS divs (the starter has `.layer` and `.layer-arrow` examples). |
| **Key insight / before-after** | When there's a single sharp insight that flipped the design. | Tabbed before/after switch (the starter has `.switch`+`.panel`) showing the prior state vs the new state with concrete code/output samples. |
| **Decisions and why** | Always. | Bulleted list, each item stating the decision and the reason it was made. |
| **What we validated** | Always (for `validated`/`implemented`). | Bulleted list of concrete facts proven during the spike (tied to the experiments in the appendix). |
| **Risks & open questions** | Always. | Bulleted list. |
| **Earlier thinking / superseded approaches** | When the design evolved significantly — show the history so the reader understands *why* the final answer is right. | Collapsed `<details>` block ("展开看…") containing the prior design, with a clear note "已演化"/"superseded". |
| **Timeline** | When the exploration was non-linear or had clear turning points. | Vertical timeline (the starter has `.timeline` + `.timeline-item` with major-turning-point styling). |
| **Experiments appendix** | **Always** — see 4.4. | Collapsed `<details>` per experiment. |

Sequence: lead with the conclusion (hero), then the user-facing thing (how it works),
then the evidence (ecosystem / decisions / validated), then any reflective sections
(superseded thinking, timeline), then the appendix. The order matters — readers should
land confident and only dig deeper if they want to.

### 4.4 Experiments appendix — required

The appendix records every concrete experiment actually run during the spike: the
commands, the observed results, the conclusion drawn. This is what makes the doc
*trustworthy* — a future reader (or you next month) can verify the claims weren't
hallucinated. Format: a section near the end, with each experiment as a `<details>`
block that expands to show:

- **Setup** — what was prepared (mock files, fixtures, branches checked out)
- **Commands run** — actual shell commands (in `<pre>` blocks, preserving the prompts)
- **Observed result** — what came out, the key bits
- **Conclusion** — what the experiment proves (or disproves)

If the spike ran a dozen tests, you don't need a `<details>` per test — group them
into 3–5 coherent experiments. Aim for "if a reviewer wanted to redo this, could they
follow these steps?"

For `abandoned` spikes the appendix is even more important — it documents the
maze you walked so nobody re-walks it.

### 4.5 Interactive patterns — when they earn their place

A heavyweight interactive device (a stepper, a before/after toggle, a tabbed view,
collapsibles) earns its place when **a static form genuinely loses information**. Use
them when:

- **Stepper / terminal walkthrough**: a sequence playing out over time (commands +
  effects). The reader benefits from seeing one step at a time, with focus.
- **Before/after toggle**: comparing two states (current vs proposed) where being able
  to flip back and forth highlights the delta. Side-by-side works too if both fit;
  toggle wins when each side is dense.
- **Collapsibles for history / experiments / appendices**: keep the main flow short
  and skimmable, but don't lose detail.
- **Card grid with hover lift + clickable whole card**: when you have a set of
  semi-independent items (PRs, libraries, issues) and the reader wants to scan and
  click into one.

Avoid: gratuitous animations, JS-heavy widgets, interactive elements where a static
list would land as fast. The starter ships the patterns above; use them when the spike
calls for them, skip them when it doesn't.

### 4.6 The starter

`assets/starter.html` in this skill is the starting point. It gives you:

- A sidebar nav scaffolding (sticky, mobile-responsive)
- CSS custom properties for dark/light mode, typography, spacing
- Pre-styled classes for the common patterns (badges, code blocks, terminal mock,
  card grid, before/after switch, timeline, layer diagram)
- HTML snippet examples of each interactive pattern as commented blocks, so you can
  copy a pattern and adapt rather than re-deriving the markup

Copy the starter, fill in the sidebar with your section anchors, and write each
section's content from the spike's actual material. Add or modify CSS as the spike
calls for — the starter is a primitives bag, not a layout you must conform to.

## 5. Update the index — `docs/designs/README.md`

Create it if it doesn't exist:

```markdown
# Design records

Each entry came out of a spike (`/spike`) consolidated by `/spike-wrap`. The agent docs
are the source of truth; the human summaries are the short version.

| Topic | Title | Status | Date | Gist | Agent doc | Human doc |
|-------|-------|--------|------|------|-----------|-----------|
| stripe-payout-integration | Stripe payout integration | validated | 2026-05-12 | one-line gist | [design.md](agents/stripe-payout-integration/design.md) | [index.html](humans/stripe-payout-integration/index.html) |
```

Add or update this spike's row. Then refresh `docs/designs/humans/index.html` (start from
`assets/index.html` in this skill if it doesn't exist yet) so there's a browsable human
index linking to each summary page — localize its headings and labels and `<html lang>`
the same way as the page itself.

## 6. Clean up

Show the user what's in `.spike/<topic>/`, and confirm the design doc captures what
matters and that you've moved any keepers into `assets/`. Then **ask the user whether to
delete `.spike/<topic>/`** — don't remove it on your own.

- If they agree: delete `.spike/<topic>/`. If `.spike/` is now empty, remove it too.
- If they don't: leave it in place — it stays gitignored, so nothing gets committed
  anyway.

The scratch dir was always meant to be disposable — its value is now in the doc — but
it's the user's call when to let it go.

## 7. Hand off

Tell the user where things landed:

> Done. Agent doc: `docs/designs/agents/<topic>/design.md` — the source of truth for
> implementing this. Human page: `docs/designs/humans/<topic>/index.html` — sidebar
> navigation, experiments appendix, all the spike's evidence. To build the feature,
> start a fresh agent and point it at the agent doc.

Don't implement the feature here — that's a separate step, deliberately done by a fresh
agent reading the doc (which also tests whether the doc is actually good enough).
