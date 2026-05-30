---
name: spike-goal
description: >-
  The POLICY LAYER for Claude Code's built-in /goal — it turns a bare goal loop into an
  autonomous, unattended development pass with per-task TRIAGE (certain work → TDD
  implementation; uncertain work → an autonomous spike to de-risk it first) and a
  PARKED-DECISIONS queue (anything needing a human / business / credential / aesthetic call
  is logged to docs/pending-decisions/index.html instead of blocking the run). IMPORTANT: this
  skill does NOT fire /goal itself — nothing inside an agent turn can start a built-in slash
  command; the loop is launched by you or by `claude -p "/goal …"`, and this skill governs how
  the model behaves on every turn of it. Invoked interactively as `/spike-goal <goal>`, it
  prepares the run and hands you the exact launch command. Use this whenever the user wants to
  hand off a whole feature, milestone, or project and have it built end-to-end WITHOUT
  approving each step — phrases like "自主完成 / 无人值守 / 帮我把整个项目迭代完成 / 让它自己跑到完成 /
  run until done / autonomously implement / 用 /goal 把 X 做完", or any setup of a headless
  `claude -p` run that mixes "just build it" work with "not sure how yet" unknowns. Do NOT use
  for a single well-specified change a normal turn can finish.
---

# spike-goal — the policy a `/goal` loop follows (triage + parked decisions)

## What this is, and the one thing to get straight first

Claude Code's built-in `/goal "<condition>"` iterates across turns until a small evaluator
model judges the condition met. Great engine, but policy-free: it doesn't know *which* work
it can just build versus which it should de-risk with an experiment first, and it has no
graceful way to handle "this needs a human call" — it guesses or stalls.

`spike-goal` supplies that policy. **But it does not — cannot — start `/goal` itself.** Nothing
inside an agent turn can fire a built-in slash command; only a human keystroke, or the
`claude -p "/goal …"` launch, does. So the division of labor is fixed:

- **The launch** (you, or `claude -p`) fires `/goal <verifiable condition>`.
- **This skill** governs what the model does on *every turn* of that loop: triage each slice,
  spike the uncertain ones, park what isn't the model's to decide — and never stall, never
  silently guess.

The payoff is the same as before: kick it off, walk away, come back to either a finished goal
or a short, well-organized list of decisions only a human could make.

## How to run it (two modes)

### A. Truly unattended — the main mode

Launch the goal loop headless, with this policy attached and permissions pre-granted:

```
claude --dangerously-skip-permissions -p "/goal <verifiable condition> — follow the spike-goal skill"
```

- The model runs the `/goal` loop; each turn it consults this skill and applies the policy below.
- **Keep the policy in context for the whole loop.** A long loop compacts context, and skills
  are pull-model (loaded on demand, not pinned). So either name the skill in the launch prompt
  (as above) *and* re-read this `SKILL.md` whenever a later turn is unsure of the policy, or —
  more durably — import the policy into the project's `CLAUDE.md` so it's always present.

### B. Interactive prep + handoff

Run `/spike-goal <高层目标>` in a normal session. It will **not** fire `/goal` (it can't) — it
prepares the run and hands you the command:

1. Read the project's `AGENTS.md` / `CLAUDE.md` (so implementation follows house conventions).
2. Ensure the parked-decisions queue exists: if `docs/pending-decisions/index.html` is absent,
   copy this skill's `assets/pending-decisions.html` there.
3. Translate the fuzzy goal into a **verifiable** `/goal` condition — see
   `references/goal-condition.md`.
4. Output the exact launch command for the user to run:
   `claude --dangerously-skip-permissions -p "/goal <condition> — follow the spike-goal skill"`.

Then the user launches it (mode A). Be honest that the launch keystroke is theirs.

## The autonomy contract (governs every turn)

The loop runs **unattended**, so **you may not ask the user anything mid-run.** The normal
`/spike` flow is built on dialogue; here there is no one to answer.

- **Do not call `AskUserQuestion`.** Reaching for it is the signal to **park** instead
  (see `references/pending-decisions.md`).
- Replace "ask the user" with **"infer the most reasonable answer, act, and record the
  assumption"** — unless the decision is load-bearing and genuinely not yours, then park it.
- True hands-off needs permissions pre-granted at launch (`--dangerously-skip-permissions`).
  You can't enforce that from here — enforce it by **behavior**: never ask.

## The policy — what to do on each turn of the loop

### Set up once (first turn)

Read `AGENTS.md`/`CLAUDE.md`; ensure `docs/pending-decisions/index.html` exists (copy from
`assets/pending-decisions.html` if not). The `/goal` is already running — you don't start it.

**Check the goal is terminable before you sink hours into it.** If a human typed a raw `/goal`
(not one this skill prepared), its condition may lack the "parked == done" escape and a turn cap
— which means it can *never* self-clear once anything needs a human unlock. On turn one, if the
condition isn't terminable and the work clearly contains human-only items (credentials, infra,
business calls), **say so to the user up front** and recommend re-issuing a terminable condition
or `/goal clear`. And when you later reach "every buildable slice done, the rest parked", stop
there and report — don't grind marginal scaffolding to satisfy an unterminable hook. Full
guidance: `references/goal-condition.md` → "When you're *already inside* a goal with a
non-terminating condition".

### Decompose into the smallest verifiable vertical slices

Each unit is a thin end-to-end path you can verify, not a big-bang pile (per the project's
working agreement). Keep a running plan; work one slice at a time.

### Triage each slice, then act

Decide certain vs uncertain (full heuristic in `references/triage.md`). **Default to action**:
only spike when a *specific unknown a small experiment would resolve* is in the way.

- **Certain → implement.** Write the failing test, make it pass, refactor, run the project's
  tests/build, commit the slice. Follow `AGENTS.md`.
- **Uncertain → autonomous spike** (`references/autonomous-spike.md` — `/spike` with the
  dialogue stripped: explore, run real experiments in `.spike/<topic>/`, decide by judgment,
  record assumptions). Then:
  - **Validated** → consolidate with an autonomous `spike-wrap` (don't ask, don't delete
    `.spike/`), then implement.
  - **Disproven** → record why; adapt the plan, or park if the way forward is a human call.
  - **Still uncertain** (needs a human/business/credential/aesthetic decision) → **park**.

### Park what isn't yours to decide

Append a card to `docs/pending-decisions/index.html` and leave a `// TODO(pending-decision: <id>)`
stub at the blocked spot. Format in `references/pending-decisions.md`. Then **move on** — a
parked item must not stall the rest of the goal.

### Completion

The condition is met when every slice is **implemented (tests/build green)** or **parked**, and
the parked items are all in the queue. (This is why the condition must count "parked == done" as
a terminal state — see `references/goal-condition.md`.) End with a short summary: what shipped,
what's parked, and that the human should open `docs/pending-decisions/index.html` to continue.

## References

- `references/triage.md` — the certain-vs-uncertain heuristic, signals and examples.
- `references/autonomous-spike.md` — how the unattended spike differs from `/spike` (every
  "ask the user" becomes "infer + record" or "park"), and the autonomous `spike-wrap`.
- `references/pending-decisions.md` — the parked-decisions HTML queue, card format, and the
  `TODO(pending-decision: <id>)` code-stub convention.
- `references/goal-condition.md` — writing the verifiable condition you put into the
  `claude -p "/goal …"` launch, including the "parked == done" terminal state.
