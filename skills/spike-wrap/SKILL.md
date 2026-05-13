---
name: spike-wrap
description: >-
  Consolidate a completed spike (a `.spike/<topic>/` scratch directory) into durable
  design docs, then clean up. Produces TWO documents: a detailed Markdown design doc for
  agents at `docs/designs/agents/<topic>/design.md` (the source of truth — alignment
  conclusions, the decision log, the validated approach, implementation plan) and a
  short skimmable HTML one-pager for humans at
  `docs/designs/humans/<topic>/index.html` (decisions + why + what was validated +
  risks, no implementation minutiae). Also updates the index at `docs/designs/README.md`
  and a browsable `docs/designs/humans/index.html`, then deletes the scratch directory
  (asking the user first).
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
- **For humans** — `docs/designs/humans/<topic>/index.html`. One page, skimmable in two
  minutes. HTML so it renders nicely. Decisions and why, what was validated, risks — no
  code dumps, no decision-log minutiae. The human got here through dialogue during the
  spike; they need a confident summary, not a re-read.

Keep these distinct: the HTML is **distilled from** the Markdown, not the same content in
two formats.

**Language:** these instructions are in English for convenience — not a cue to write in
English. Produce everything that's prose in the user's working language: the design doc's
body, the HTML summary, the index entries (see steps 4–5 for the template specifics).
Frontmatter field names and the `status` value (`validated` / `implemented` /
`abandoned`, which doubles as a CSS class and an index key) stay as-is.

## 1. Find the spike

Locate `.spike/<topic>/`. If the user named a topic, use it. If there's exactly one, use
it. If there are several, list them and ask which. Read `NOTES.md` and skim the
artifacts so you actually know what happened — don't write the doc from memory alone.

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

## 4. Write the human doc — `docs/designs/humans/<topic>/index.html`

Start from `assets/summary.html` in this skill (a self-contained HTML page, inline CSS,
no build step) — copy it, then fill in the `{{PLACEHOLDER}}` markers:

- title, status, date, who validated it
- **"How it works"** — give the reader the right mental model of the approach in as few
  seconds as possible. *How* you do that is your call and should follow what this
  particular solution makes easiest to grasp: a concrete worked example told as a story,
  a labelled SVG flow/sequence diagram, a numbered happy-path walkthrough, a before/after,
  a small state diagram, a one-line analogy — or something none of those, if it lands
  faster. The template ships CSS for the common ones (`ol.howto`, `figure.diagram`,
  `.example`) with inline examples, but you're not limited to them — add markup or
  `<style>` as needed. A heavyweight device (CSS animation, interactive toggle, a widget)
  should earn its place: only when it shows something a static form genuinely can't, like
  a sequence playing out over time. The one fixed boundary: this section is the
  *intuition*, not the spec — full APIs, edge cases, and the build plan stay in the agent
  doc — and it has to stay skimmable.
- the decisions and the *why* behind them
- what was validated (so the reader trusts it)
- open questions & risks

It already links back to the agent doc. Keep the whole thing to one skimmable page — no
implementation minutiae, no code dumps, no blow-by-blow log; all of that stays in the
agent doc. `assets/summary.html` ships in English as the base — if the user's working
language isn't English, translate the section headings, the badge text, and the footer,
and set `<html lang>` accordingly (leave the CSS class names and `{{PLACEHOLDER}}`
markers alone).

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
the same way as the summary page.

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
> implementing this. Human summary: `docs/designs/humans/<topic>/index.html`. To build
> it, start a fresh agent and point it at the agent doc.

Don't implement the feature here — that's a separate step, deliberately done by a fresh
agent reading the doc (which also tests whether the doc is actually good enough).
