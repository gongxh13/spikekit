# Writing the `/goal` completion condition

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

```
/goal <observable success> AND every unresolved item is logged in
docs/pending-decisions/index.html — or stop after N turns
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
