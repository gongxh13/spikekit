---
name: spike
description: >-
  Run an exploratory spike to de-risk and validate an approach BEFORE committing to
  implementation — align context with the user through real dialogue, gather the inputs
  you're missing (API docs, specs, example payloads, the system being integrated), then
  run actual throwaway experiments in a `.spike/<topic>/` scratch directory and iterate with
  the user until the approach is proven (or proven not to work). Use this whenever the
  user wants to try something out, prototype, prove a concept, "check if this API works",
  "see if this integration is feasible", figure out how to do something before building
  it, or otherwise de-risk a new feature or demo — even if they don't say the word
  "spike". When the spike converges, hand off to `/spike-wrap` to consolidate it into a
  design doc. Re-invoke `/spike` to resume an in-progress spike.
---

# Spike: validate before you build

## Why this exists

The usual "write a design doc, then implement, then test" order puts the document first
and makes it speculative — written before anyone knows whether the approach actually
works. This flips it: **align → validate → (later) document → implement**. You and the
user have a real conversation to get on the same page; you run real experiments to find
out what's true; and the document gets squeezed out of that process afterward (by
`/spike-wrap`) with empirical backing. A spike is not "skipping design" — it's doing
design *empirically and collaboratively* instead of on paper.

Your job in this skill: get genuinely aligned with the user, then prove (or disprove)
the approach, keeping a clean running record so it can be consolidated later. You do
**not** implement the feature here, and you do **not** write the final docs here — that's
`/spike-wrap`.

**Language:** these instructions are written in English for convenience — that's *not* a
cue to reply in English. Work in whatever language the user writes to you in: ask your
questions, talk things through, and keep `NOTES.md` in that language.

## 1. Set up the scratch space

Pick a short kebab-case `<topic>` slug (e.g. `stripe-payout-integration`, `pdf-export`,
`websocket-reconnect`). Create `.spike/<topic>/` in the project root.

Create `.spike/<topic>/NOTES.md` — the running record, and the thing that lets a future
session resume:

```markdown
# Spike: <title>

## Goal
What we're validating, and what "it works" concretely looks like (success criteria).
The broader goal this feeds into.

## Alignment
- (bulleted conclusions from talking with the user — requirements, constraints,
  decisions, things the user clarified that aren't obvious from the code; note who
  decided what)

## Log
- <date> tried X → result → next step
- ...

## Current state
Where we are right now / what's next.
```

If this is a git repo and `.spike/` isn't already ignored, add `.spike/` to `.gitignore`
and mention it — the scratch dir is throwaway and gets deleted at wrap-up.

**If `.spike/<topic>/NOTES.md` already exists, you're resuming**: read it (and skim the
artifacts) to restore context, tell the user where things stand, and continue from
"Current state". If there are several topics under `.spike/`, list them and ask which.

## 2. Align context with the user — do this before touching code

This is the most important step and the one that's easy to skip. The whole point of a
spike is getting the human and the LLM onto the same page, so this conversation isn't
optional. There are two kinds of context and they're handled differently:

**Intent — only the user has it; ask, but propose where you can.** Where you can already
infer a likely answer from the project and what the user has said, put it forward as a
proposal to confirm, not an open question — "I'm taking success to mean the webhook fires
within ~5s and we can verify its signature; anything more?" beats "what does success look
like?". Where there's genuinely nothing to infer (the broader goal, hidden constraints),
just ask. Cover:
- What are we validating, and what does "it works" concretely look like? Real success
  criteria, not "see if it works".
- What's the bigger picture this feeds into? What's in scope, what's out?
- Any hard constraints, prior attempts, or preferences worth knowing?

**Technical context — orient yourself first, then confirm.** Before asking, take a
*quick* look around — related code already in the repo, the SDKs/clients in use, a
README, whatever tells you how the pieces fit. Don't disappear into a deep dive; this
pass exists so you can ask sharper questions and so you actually have something to teach
the user (next point). Note the gaps you couldn't fill — undocumented API behaviour,
where credentials live, example payloads, anything ambiguous about a system you can't see
— those become questions.

**Catch the user up before you ask them anything — and confirm it landed with a real
question, not a rhetorical one.** Your orientation pass — and later, your experiments —
leave *you* knowing things the user doesn't: how some API actually behaves, a technique
that fits, a constraint you hit, two or three candidate approaches and their trade-offs.
A spike only works if the human and the LLM share one picture, so never ask a question
that quietly presupposes context only you have — "webhook or polling?" lands on them as
"ratify a choice you can't evaluate." So:

1. Explain what you found, in plain language, at the level they need to actually weigh in
   — short, concrete, no jargon dump, walk through it with them.
2. Then ask them — with the AskUserQuestion tool — whether it's clear. Options along the
   lines of "Got it, clear enough" / "Not quite — explain it again"; the Other slot lets
   them point at the specific bit that's fuzzy.
3. If it's not clear, come at it a different way — a smaller example, an analogy, drop a
   level of abstraction — and ask again. Loop until they pick "clear." Don't move on, and
   don't ask the *next* (decision) question, until they're genuinely up to speed.

Teaching, not just reporting — and whether it landed is theirs to tell you, not yours to
assume.

**For a real design call, surface the option space before you converge.** "Propose, don't
interrogate" (below) still holds — but for *which-approach* questions (webhook vs polling,
library X vs roll-your-own, sync vs queue, monolith handler vs state machine), jumping
straight to one recommendation is the most common failure mode of this whole skill: you
lock in *workable* when *better* was one thought away, and the user never gets to see the
choice was even there. So before you recommend, force divergence — generate **2–3
genuinely different candidates**, not three variations of one idea. A useful spread:

- one **stupidly-simple** ("what's the dumbest thing that could work?") — forces you to
  articulate why the more complex options actually pay for themselves
- one **by-the-book** — the obvious answer someone with domain experience would reach for
- one **from a different angle** — an off-the-shelf tool you'd otherwise write yourself,
  an analogy from an adjacent problem you've seen solved, "what becomes possible if we
  relax constraint X?", or inverting the problem ("instead of detecting Y, prevent Y")

For each: one-line gist · the trade-off · when it'd be the right pick. *Then* recommend,
with the reason. The user sees the option space, not just the endpoint — and the act of
writing the other two often surfaces the real constraint that should drive the choice.
Skip this only when the choice is genuinely binary or trivially obvious; don't manufacture
ceremony.

**Then propose, don't interrogate.** Once they're up to speed, whenever you put a question
to them — intent, which approach to try, a design call — lead with your best
recommendation and the one-line reason, and ask them to confirm or adjust. You almost
always have enough context to propose *something*; a concrete proposal is faster to react
to than a blank prompt, and it surfaces your assumptions so they can be corrected — where
your guess was wrong is exactly the alignment that matters. (With the AskUserQuestion
tool, the recommended option goes first, marked. For a design call covered by the
divergence step above, the options list *is* the candidates.)

Don't dump every question at once — a few that matter most, iterate. Write every
conclusion into NOTES.md as you go (terse bullets are fine; they survive into the final
doc). Before moving on to experiments, play the whole picture back — "here's what I found,
here's what I think we're doing and why, here's the approach I'd try first; does that
track?" — and let the user correct it.

## 3. Validate — run real experiments

Now actually try it. Write throwaway scripts in `.spike/<topic>/` — call the API, run
the thing, reproduce the scenario, whatever proves the approach. Show the user concrete
results — and when an experiment teaches you something that shifts the picture, explain
*why* it matters in plain language (same as step 2: keep them level with you, don't just
absorb it and push on).

It usually won't work first try. That's the point of doing this now rather than
mid-implementation. When you hit a wall, debug *with* the user: surface exactly what you
found, say what you think is going on, ask for the missing piece, adjust. Each dead end
and each "oh, turns out you have to X" is valuable — log it in NOTES.md. That decision
trail is the most useful part of the doc you'll write later.

**Before you tunnel into "how do I fix *this* approach," pause.** A wall is often the
experiment telling you the *approach* is wrong, not just a bug to grind through. Re-open
the option space for a beat: would one of the other candidates from step 2 dodge this
entirely? Has what you just learned invalidated an assumption that made the current path
look best? If yes, switch — cheap now, expensive after another hour of patching. If the
current path is still right, log *why* the wall doesn't change that and keep going. The
reflex to protect: "this is hard" is a signal to look up, not just to push harder.

Keep all artifacts in `.spike/<topic>/` and name them so the trail is legible —
`01-call-api.py`, `02-add-auth.py`, `example-payload.json`, `run-output-2026-05-12.txt`.
A pile of temp files in here is expected and fine; that's what the directory is for. Do
**not** scatter experiments into the real source tree.

## 4. Converge — hand off to /spike-wrap

When the user confirms the approach works — or that it definitively doesn't (a documented
"this doesn't work because Y" is worth keeping) — update NOTES.md's "Current state", then
tell the user:

> Looks like we've landed it. Run `/spike-wrap <topic>` and I'll consolidate this into a
> design doc — a detailed one for agents plus a short HTML summary for you — and clean up
> the scratch files.

Don't do the consolidation here — that's `/spike-wrap`'s job, and keeping it a separate
explicit step means *the user* decides "yes, this is the final approach." Don't start
implementing the feature either; implementation is downstream of the design doc, and is
deliberately done by a fresh agent reading it.
