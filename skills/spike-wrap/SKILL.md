---
name: spike-wrap
description: >-
  Consolidate a completed spike (a `.spike/<topic>/` scratch directory) into a durable,
  current-state design doc at `docs/designs/agents/<topic>/design.md` — the source of
  truth an implementer builds from — then regenerate the design index from frontmatter and
  clean up. The doc records what is true now (the approach, constraints, upstream facts,
  what's not done), not the story of the spike: no decision log, no experiment appendix,
  no dated changelog. Use this when a spike or exploration session has converged and the
  user wants it written up — "wrap up this spike", "the approach is confirmed, write it
  up", "consolidate the `.spike/` stuff into a design doc", "ok this works, document it",
  or "/spike-wrap". Pairs with `/spike`.
---

# Spike-wrap: consolidate a spike into a design doc

## Why this exists

A spike (see the `/spike` skill) leaves a `.spike/<topic>/` scratch directory full of
experiments and a `NOTES.md` log. This skill turns that into the one durable artifact: the
design doc that someone — likely a fresh agent — uses to build and later maintain the thing.

**The doc describes the present, not the past.** Design docs that read like a lab notebook
("tried X on Tuesday, switched to Y, then on Thursday…") rot in two ways: readers have to
read everything to learn which conclusion still holds, and every later change gets
*appended* to the end of the file — so parallel branches collide on the same lines and
superseded decisions sit next to their replacements. The spike's history already lives in
the scratch dir and in git; the doc keeps only what is true now, plus the hard-won facts
that stop someone from re-walking a dead end.

**Language:** these instructions are in English for convenience — not a cue to write in
English. Write the doc's prose in the user's working language. Frontmatter field names and
the `status` values stay as-is.

## 1. Find the spike

Locate `.spike/<topic>/`. If the user named a topic, use it. If there's exactly one, use
it. If there are several, list them and ask which. Read `NOTES.md` and skim the artifacts
so you actually know what happened — don't write the doc from memory alone. Pull out:

- the approach that was proven (or the reason it can't work),
- every **external fact** the conclusion rests on (how an upstream API actually behaves,
  a limit that was measured, a version that's required),
- every **dead end** worth a one-line warning.

Also check `docs/designs/` for an existing doc on the same subject. If one exists, you are
**revising it in place** (step 3 applies to the whole file), not adding a second doc.

## 2. Confirm title & status

Briefly confirm with the user (state your assumption and move on if it's obvious):

- the topic slug and a human-readable title
- the **status**:
  - `planned` — proven, not built yet
  - `implemented` — already built
  - `partial` — some of it is built
  - `paused` — research stopped without reaching the product
  - `abandoned` — doesn't work; worth a short doc only so nobody re-walks the maze

## 3. Write the doc — `docs/designs/agents/<topic>/design.md`

```markdown
---
title: <one-line title>
status: planned | implemented | partial | paused | abandoned
summary: <one line, ≤ 80 chars: what it is and where it stands — no dates, no deploy state>
related_code:
  - <paths, once they exist; omit or leave empty before implementation>
---

# <Title>

One paragraph: what this is and the conclusion.

## <descriptive section per part of the design>
How it works, in enough detail to build and to change safely:
- control / data flow, components and their boundaries
- data shapes, key APIs, example payloads
- invariants, and the reason behind each non-obvious choice (one or two sentences:
  "do X, not Y, because Z")

## 约束与坑 / Constraints and pitfalls
Upstream behaviour facts, measured limits, required versions, and dead ends compressed
into one-line rules ("Approach X doesn't work: <why>"). When a fact is load-bearing and
cheap to re-check, include the exact command that verifies it.

## 未做 / 待定 / Not done
One line each. Omit the section if empty.

## 实施步骤 / Implementation steps
Only while status is `planned`: the ordered checklist a fresh agent picks up.
**Delete this section once it's built** — a finished plan is history.
```

Rules that keep the doc maintainable:

- **Headings are descriptive, never numbered.** No `D1` / `§2.3` / `S5` / `### 1. …`.
  Other docs and code comments refer to a section as `path#heading` or by its title, so
  sections can be reordered without breaking references.
- **No dates in headings, no changelog, no deploy/release state** ("not released yet",
  "deployed as image X", "pending acceptance"). That belongs in git, PRs and issues.
- **No process sections**: no "alignment conclusions", "what we tried", "timeline",
  "experiments appendix". Turn whatever still matters into a statement about the current
  design or a one-line pitfall.
- **Superseded ideas are deleted**, not kept beside their replacement.
- **Large topics split into sub-docs** in the same directory, named by subtopic
  (`attachments.md`, `voice.md`): `design.md` stays the overview (frontmatter + one line
  per sub-doc). Separate features touching separate files is what prevents merge conflicts.
- **Assets** (`docs/designs/agents/<topic>/assets/`): only figures that depict the current
  design (an architecture diagram, a reference payload). Probe scripts, raw logs and
  experiment screenshots stay out — they're spike evidence, and the scratch dir or git
  history is where evidence lives. If a load-bearing diagram is missing, render one with
  the `spike-screenshot` skill and reference it with a relative path.
- **Abandoned**: replace the design sections with "why it doesn't work / what would have
  to change", keep the pitfalls, drop the implementation steps.

## 4. Regenerate the index — `docs/designs/README.md`

The index is **generated from each `design.md` frontmatter, never edited by hand** — a
hand-maintained table is the first place parallel branches collide.

- If the repo already has a generator (look for `gen-design-index.sh`, e.g. under
  `deploy/` or `scripts/`), run it.
- Otherwise copy `assets/gen-design-index.sh` from this skill into the repo (`scripts/`
  unless the repo has a clear home for scripts), run it, and tell the user. If the repo has
  CI, suggest adding `bash <path>/gen-design-index.sh --check` to it.

The script fails if any `design.md` lacks `title` / `status` / `summary` or uses a status
outside the list above — fix the doc rather than the script.

If the repo's `AGENTS.md` doesn't yet state how design docs are maintained, offer to add a
short "design doc conventions" section summarising the rules in step 3 (current state only,
rewrite in place instead of appending, descriptive headings, generated index).

## 5. Clean up

Show the user what's in `.spike/<topic>/`, and confirm the design doc captures what
matters. Then **ask the user whether to delete `.spike/<topic>/`** — don't remove it on
your own.

- If they agree: delete `.spike/<topic>/`. If `.spike/` is now empty, remove it too.
- If they don't: leave it in place — it stays gitignored, so nothing gets committed.

## 6. Hand off

Tell the user where things landed:

> Done. Design doc: `docs/designs/agents/<topic>/design.md` — the source of truth for
> building this; index regenerated. To build the feature, start a fresh agent and point it
> at the doc. When it's built, update the doc in place (status, related_code, delete the
> implementation steps) rather than appending.

Don't implement the feature here — that's a separate step, deliberately done by a fresh
agent reading the doc (which also tests whether the doc is actually good enough).
