# The autonomous spike (and autonomous spike-wrap)

A normal `/spike` is built around *dialogue*: align with the human, ask what success means,
surface options, let them choose. Unattended, there is no one to talk to. The autonomous
spike keeps everything that makes a spike valuable — **real experiments that establish facts**
— and replaces every interactive step with **infer-and-record** or **park**.

If `/spike` is installed, follow its method; just apply the substitutions below. If it isn't,
the shape is: scratch dir → form a hypothesis → run a throwaway experiment → read the result →
iterate → conclude.

## The substitutions

| `/spike` interactive step | Autonomous replacement |
|---|---|
| Ask "what does success look like?" | Infer the success criterion from the goal + repo context; **write it into `NOTES.md`** as an explicit assumption. |
| Ask the user to choose between approaches | Generate the 2–3 candidates anyway (the divergence is still valuable), pick the best by your own judgment, and **log the alternatives + why you chose** in `NOTES.md`. |
| "Catch the user up, confirm it landed" | Skip the confirmation; just record what you learned in `NOTES.md`. |
| Hit a wall that needs a human/business/credential call | **Park it** (don't ask, don't guess) and stop spiking this topic. |
| Confirm the approach with the user before converging | Converge on the evidence; if the evidence is conclusive, proceed; if it isn't and only a human can break the tie, park. |

Everything else is unchanged: still create `.spike/<topic>/`, still write throwaway scripts,
still run them for real, still keep a terse `NOTES.md` log. The experiments are the whole
point — they're what makes the eventual decision (or parked card) trustworthy rather than a
guess.

## Record assumptions, don't bury them

Every place you'd normally have asked, you've now *assumed*. Those assumptions are the most
likely thing to be wrong, so make them visible:

- In `NOTES.md`: a short `## Assumptions` list.
- If an assumption is load-bearing for code you then ship, leave a brief comment at the code
  site noting it, so a reviewer can find it.
- If an assumption is shaky enough that being wrong would be costly, that's a sign it should
  have been a **parked decision**, not an assumption — park it.

## After the spike

- **Validated** → consolidate with an **autonomous `spike-wrap`** (next section), then
  implement the slice normally (TDD, per `AGENTS.md`).
- **Disproven** → a documented dead end is valuable. Record why in `NOTES.md`; adapt the plan.
  If the way forward is now a human call, park it.
- **Still uncertain** → park it (see `pending-decisions.md`).

## Autonomous spike-wrap

When consolidating, follow `/spike-wrap` if installed, with two changes for unattended mode:

- **Don't ask before deleting `.spike/`. Don't delete it.** Leave the scratch dir in place —
  it's gitignored, costs nothing, and is the evidence trail behind any parked decision. The
  human can clean it up later.
- Don't ask to confirm title/status — infer them and proceed.

The design docs it produces (`docs/designs/agents/<topic>/design.md` + the human HTML) are
exactly what a later human or a fresh implementing agent needs. Producing them unattended is
fine; they're verifiable from the spike's experiments.
