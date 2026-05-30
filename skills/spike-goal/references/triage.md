# Triage: certain vs uncertain

You decide this once per slice, fast. The goal of triage is **not** to be cautious — it's to
spend exploration budget only where it actually buys down risk. Over-spiking is the common
failure mode: it turns a one-hour build into a day of ceremony. So the rule is:

> **Bias to action. Spike only when there is a *specific unknown* that a *small experiment*
> would resolve, and getting it wrong would be expensive to undo.** Otherwise, build it.

## Signals → just implement (the default)

Reach for normal TDD implementation when the slice is *determinable from what you already
have*:

- Requirements are clear and the acceptance check is obvious (a test you can already write).
- There's an existing pattern/convention in the repo to follow (you can point at a sibling
  that does the same kind of thing).
- It's mechanical: CRUD endpoint, a form, a migration, wiring, a refactor with test cover.
- The libraries/APIs involved are ones whose behavior you're confident about.
- Worst case of being slightly wrong is cheap: a quick edit, caught by a test.

When in doubt between "implement" and "spike" and the cost of a wrong guess is low —
**implement**. A failing test will tell you more, faster, than a speculative spike.

## Signals → autonomous spike first

De-risk with an experiment when there's a **concrete unknown** and **building on a wrong
assumption would be costly**:

- **Unverified external behavior** — "does this API actually return X?", "does this token
  refresh flow work?", "what does the SSE stream really look like?" — answerable by one real
  call, and everything downstream depends on the answer.
- **Integration feasibility in doubt** — two systems that have to fit and you're not sure they
  do.
- **Multiple viable approaches with unclear tradeoffs** — a small prototype of the riskiest
  one tells you which to commit to before you build the whole thing.
- **A load-bearing assumption you can cheaply test** — testing it now is minutes; discovering
  it's wrong after building on it is hours.

The test for a good spike: *"Is there one experiment whose result changes what I build?"* If
yes, spike it. If you can't name the experiment, you don't have a spike — you have either a
slice to build or a decision to park.

## The third outcome: park (not implement, not spike)

Some unknowns aren't resolvable by an experiment at all — they need a *person*. Don't spike
these (an experiment won't answer them) and don't guess:

- A business/product call (pricing, which feature first, what's acceptable to users).
- Something needing a credential, account, or access you don't have.
- An aesthetic/brand preference with no objective answer.
- An ambiguity in the goal itself that materially changes the outcome.

These go to the parked-decisions queue (see `pending-decisions.md`).

## Examples

- *"Add an email-registration endpoint; users table already exists, there's an existing
  password-reset endpoint to mirror."* → **implement.** Clear, has a pattern, testable.
- *"Make claude-code requests work through our gateway using a pooled OAuth subscription
  token."* → **spike.** Concrete unknown (does the OAuth call return rate-limit headers? does
  streaming pass through?), one real call answers it, everything downstream depends on it.
- *"Pick the subscription tier prices for the paid plans."* → **park.** No experiment answers
  it; it's a business decision.
- *"Refactor the proxy router to a cleaner dispatch table; tests cover it."* → **implement.**
  Mechanical, test-covered, cheap to get slightly wrong.
