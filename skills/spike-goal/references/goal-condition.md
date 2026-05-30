# Writing the `/goal` completion condition

This condition goes **into the launch command** — `claude -p "/goal <condition> — follow the
spike-goal skill"` — written by you, or produced for you by the interactive `/spike-goal` prep
helper (mode B in `SKILL.md`). The model running the loop does **not** fire `/goal`; it only
follows the policy once the loop is launched. So the condition has to be right at launch time.

`/goal`'s evaluator (a small fast model) decides each turn whether you're done. It can only
judge what your output can **prove**. So a good condition is concrete, observable, and — for
an unattended run — explicitly treats **parked items as a valid way to be done**. Get this
wrong and the loop either stops too early (vague condition the evaluator green-lights
prematurely) or never stops (a single unresolved item it keeps failing on).

## Three properties of a good condition

1. **Verifiable from output.** Tie it to things you can show: a test command passing, a build
   succeeding, a file existing with certain content. Not "the feature is good" — that's not
   checkable. "`go test ./...` and `pnpm build` both pass" — that is.

2. **Parked == done.** Include the escape hatch so progress can't be held hostage by a
   decision only a human can make:
   > …**or** every remaining item is logged in `docs/pending-decisions/index.html`.
   Without this, one parked decision makes the condition permanently false and the goal spins.

3. **A turn cap as a backstop.** `/goal` supports "…or stop after N turns". Always include one
   so a pathological loop is bounded. Pick N from the goal's size (a feature: ~15–30; a small
   milestone: more).

## Shape

The condition (the part after `/goal`) looks like:

```
<observable success> AND every unresolved item is logged in
docs/pending-decisions/index.html — or stop after N turns
```

Dropped into the actual launch the human runs:

```
claude --dangerously-skip-permissions -p "/goal <observable success> AND every unresolved
item is logged in docs/pending-decisions/index.html — or stop after N turns — follow the spike-goal skill"
```

## From fuzzy goal → condition

Translate the human's high-level ask into observable proof. Examples:

- **"把邮箱注册做完"** →
  `/goal POST /api/auth/register 的端到端测试通过、go test ./... 与 pnpm build 均绿，前端能显示注册成功
  AND 任何未决项已记入 docs/pending-decisions/index.html — or stop after 15 turns`

- **"把网关的 claude code 转发跑通"** →
  `/goal 一个集成测试证明 claude code 经网关能拿到上游流式响应、go test -tags=integration 通过
  AND 未决项已记入 docs/pending-decisions/index.html — or stop after 25 turns`
  (if the credential to run that integration test is missing, that becomes a parked card —
  and the "parked == done" clause lets the goal complete honestly rather than faking a pass.)

- **"把整个 MVP 的用户面做出来"** (a milestone — decompose, then condition on the slice set) →
  `/goal 注册/登录/套餐余量/我的key 四条端到端路径各有通过的测试、pnpm build 与 go test ./... 绿
  AND 其余未决项已记入 docs/pending-decisions/index.html — or stop after 40 turns`

## Anti-patterns

- **Unverifiable condition** — "the gateway works well". The evaluator can't check it; it'll
  either pass on vibes or never pass. Anchor to a command or artifact.
- **No parked clause** — guarantees a hang the moment anything needs a human.
- **No turn cap** — an unbounded loop if something goes sideways.
- **Condition that rewards faking** — e.g. "tests pass" with no "or parked" clause tempts the
  loop to weaken/skip tests to satisfy it. The "parked == done" escape removes that pressure:
  the honest move (park the blocker) is also the one that completes the goal.

## When you're *already inside* a goal with a non-terminating condition

Documenting the anti-patterns above isn't enough: a human can start a goal by typing a raw
`/goal …` that this skill never prepared — so the condition may have **no "parked == done"
clause and no turn cap**. When you (the policy) wake up inside such a loop, the failure mode is
silent and expensive: you keep building, the evaluator keeps saying "not complete" (because the
project genuinely needs a human unlock it can't see), and the loop never clears. The prepared
condition prevents this, but you don't always get the prepared condition — so handle it
explicitly:

**1. Check terminability on the first turn — before doing hours of work.** Look at the active
goal condition. If it lacks a parked/turn-cap escape *and* the work plainly contains items that
will need a human (credentials, infra you can't stand up, a business/aesthetic call), then this
goal **cannot self-terminate**. Say so to the user up front — don't let them discover it after
20 turns. Recommend they re-issue with a terminable condition (hand them the exact line, per
"Shape") or `/goal clear`. You can still do useful buildable work meanwhile, but surface the
non-termination first, not last.

**2. Define your terminal state and stop there — don't grind.** When every currently
buildable-and-verifiable slice is implemented and everything left is parked, you've reached
spike-goal's legitimate terminal state. Under a *well-formed* condition the evaluator now clears
and you're done. Under a *malformed* one it won't clear — and that is **not** a signal to keep
going. Report the terminal state plainly (what shipped, what's parked, why the rest needs the
user) and hand the decision back: unlock a parked item, re-issue a terminable goal, or clear it.

**Never** answer an unterminable hook by (a) faking completion, (b) weakening tests to pass, or
(c) grinding ever-more-marginal scaffolding to look busy — all three violate the skill's honesty
principle. The honest terminal state — "the buildable work is done and verified; the rest is
parked and needs you" — is a *complete and correct* outcome for an unattended run, even when the
literal `/goal` string isn't satisfied. Stopping there, clearly, **is** the job.
