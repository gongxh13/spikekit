---
name: spike-goal
description: >-
  Drive autonomous, unattended multi-step iteration toward a high-level project goal by
  wrapping Claude Code's built-in /goal. Use this whenever the user wants to hand off a
  whole feature, milestone, or project and have it built end-to-end WITHOUT sitting there
  approving each step — phrases like "自主完成 / 无人值守 / 帮我把整个项目迭代完成 / 让它自己跑到完成 /
  run until done / autonomously implement / use /goal to build X", or any setup of a headless
  `claude -p` run. It adds what bare /goal lacks: per-task TRIAGE (certain work goes straight
  through TDD implementation; uncertain work gets an autonomous spike to de-risk it first)
  and a PARKED-DECISIONS queue (anything needing a human / business / credential / aesthetic
  call is logged to docs/pending-decisions/index.html instead of blocking the run). Strongly
  prefer this over plain /goal whenever the work mixes "just build it" tasks with "not sure
  how yet" unknowns, or whenever the user wants exploration and implementation handled in one
  unattended pass. Do NOT use for a single well-specified change a normal turn can finish.
---

# spike-goal — autonomous goal loop with triage + parked decisions

## What this is and why it exists

Claude Code's built-in `/goal "<condition>"` iterates across turns until a small evaluator
model judges the condition met. It's a great engine, but it's policy-free: it doesn't know
*which* work it can just build versus which work it should de-risk with an experiment first,
and it has no graceful way to handle "this needs a human call" — it either guesses or stalls.

`spike-goal` is the **policy layer** that rides on top of `/goal`. One entry point —
`/spike-goal <高层目标>` — and it runs unattended, applying three rules every step:

1. **Triage** — certain work goes straight through normal development (TDD vertical slice);
   uncertain work gets an **autonomous spike** to de-risk it first. Bias to action.
2. **Never block on a human** — when something genuinely needs a person (a business call,
   a credential you don't have, an aesthetic preference, an irreducible ambiguity), don't
   guess and don't stall: **park** it to `docs/pending-decisions/index.html` and move on.
3. **Leave a trail** — parked decisions and the spikes behind them stay reviewable, so when
   the run ends the human picks up exactly the open questions, with full context.

The point: a human kicks it off, walks away, and comes back to either a finished goal or a
short, well-organized list of decisions only they could have made — never a silent guess and
never a frozen loop.

## The autonomy contract (read this first)

This skill runs **unattended**. That changes one thing fundamentally: **you may not ask the
user anything mid-run.** The normal `/spike` flow is built around dialogue; here there is no
one to answer. So:

- **Do not call `AskUserQuestion`.** If you reach for it, that's the signal to **park**
  instead (see `references/pending-decisions.md`).
- Replace "ask the user" with **"infer the most reasonable answer, act on it, and record the
  assumption"** — unless the decision is load-bearing and genuinely not yours to make, in
  which case park it.
- For a truly hands-off run the human should launch with permissions pre-granted (e.g.
  `claude --dangerously-skip-permissions -p "/spike-goal …"`) and `AskUserQuestion`
  disallowed. You can't enforce that from here — so enforce it by **behavior**: never ask.

## The loop

### 0. Set up (once, before starting `/goal`)

- Read the project's `AGENTS.md` / `CLAUDE.md` so implementation follows house conventions
  (test commands, vertical-slice + TDD + small-commit discipline, etc.).
- Ensure the parked-decisions queue exists: if `docs/pending-decisions/index.html` is absent,
  copy the template from this skill's `assets/pending-decisions.html`. See
  `references/pending-decisions.md`.
- Because `/goal` runs many turns and context can compact, the rules in this file must stay
  available: if a later turn is unsure of the policy, **re-read this SKILL.md** and the
  relevant `references/*.md`.

### 1. Turn the goal into a verifiable completion condition

`/goal`'s evaluator can only check things your output can *prove*. Translate the fuzzy goal
into a concrete, checkable condition — and crucially, **make "remaining work is parked" a
legal terminal state**, or any single parked item makes the goal uncompletable and the loop
runs forever. See `references/goal-condition.md` for how to phrase it (and turn caps). Then
start the goal, e.g.:

```
/goal <verifiable condition> AND every unresolved item is logged in
docs/pending-decisions/index.html — or stop after N turns
```

### 2. Decompose into the smallest verifiable vertical slices

Per the project's working agreement: each unit is a thin end-to-end path you can verify, not
a big-bang pile. Keep a running plan; work one slice at a time.

### 3. Triage each slice — then act

For each slice, decide certain vs uncertain (full heuristic in `references/triage.md`).
**Default to action**: only spike when there's a *specific unknown a small experiment would
resolve*. Otherwise just build it.

- **Certain → implement.** Normal flow: write the failing test, make it pass, refactor,
  verify (run the project's tests/build), commit the slice. Follow `AGENTS.md`.
- **Uncertain → autonomous spike.** Run the de-risking experiment per
  `references/autonomous-spike.md` (it's `/spike` with the dialogue stripped out — explore,
  run real experiments in `.spike/<topic>/`, decide by best judgment, record assumptions).
  Then:
  - **Validated** → consolidate with an autonomous `spike-wrap` (variant: don't ask, don't
    delete `.spike/`), then implement as above.
  - **Disproven** → record why it doesn't work; adapt the plan or park if the path forward is
    a human call.
  - **Still uncertain** (needs a human/business/credential/aesthetic decision) → **park** it.

### 4. Park what isn't yours to decide

Append a card to `docs/pending-decisions/index.html` and leave a code stub
`// TODO(pending-decision: <id>)` at the spot that's blocked, pointing back to the card.
The card carries: the question, why it's blocked, what the spike tried, the candidate options
with your recommendation, and the code location. Full format in
`references/pending-decisions.md`. Then **move on to other slices** — a parked item must not
stall the rest of the goal.

### 5. Completion

The goal is done when every planned slice is either **implemented (tests/build green)** or
**parked**, and the parked items are all in the queue. End with a short summary: what shipped,
what's parked, and that the human should open `docs/pending-decisions/index.html` to continue.

## References

Read these as needed — they hold the detail kept out of this overview:

- `references/triage.md` — the certain-vs-uncertain heuristic, with signals and examples.
- `references/autonomous-spike.md` — how the unattended spike differs from `/spike`
  (every "ask the user" becomes "infer + record" or "park"), and the autonomous `spike-wrap`.
- `references/pending-decisions.md` — the parked-decisions HTML queue structure, the card
  format, and the `TODO(pending-decision: <id>)` code-stub convention.
- `references/goal-condition.md` — translating a fuzzy goal into a verifiable `/goal`
  condition that treats parked items as a valid terminal state.
