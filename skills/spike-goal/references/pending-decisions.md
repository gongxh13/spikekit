# The parked-decisions queue

When a decision isn't yours to make (a human/business/credential/aesthetic call, or an
irreducible ambiguity), you **park** it: log it so the human can pick it up after the run, and
leave a breadcrumb in the code so nothing silently ships on a guess. This is the safety valve
that lets an unattended run never stall *and* never guess on the things that matter.

Two artifacts, always together:

1. **A card** in `docs/pending-decisions/index.html` — the human-readable queue.
2. **A code stub** `// TODO(pending-decision: <id>)` at the blocked spot — points back to the
   card so a reader in the code finds the open question, and so the card is greppable.

## Setup

If `docs/pending-decisions/index.html` doesn't exist, copy this skill's
`assets/pending-decisions.html` there. It's a self-contained page (inline CSS, dark/light,
no build step) with a card grid; new cards are appended into the `<div id="cards">` container.

## Card format

Each parked decision is one card. Give it a stable `id` (kebab-case, unique — e.g.
`subscription-tier-pricing`, `gemini-auth-approach`). Append a block like this inside
`<div id="cards">`:

```html
<article class="card" id="subscription-tier-pricing">
  <div class="card-head">
    <span class="cid">subscription-tier-pricing</span>
    <span class="badge needs-human">需要人决定</span>
  </div>
  <h3>付费套餐定价定多少？</h3>
  <div class="field"><span class="lbl">为什么卡住</span>
    商业决策，没有客观答案，实验也回答不了——只能人来定。</div>
  <div class="field"><span class="lbl">已经试过/已知</span>
    上游 Claude Max 官方 $100/月；号池分 N 人；成本与定价的关系已算清（见 design 文档）。</div>
  <div class="field"><span class="lbl">候选方案 + 推荐</span>
    <ul>
      <li>A. 按号池人头均摊 + 20% 毛利（<strong>推荐</strong>，简单、可解释）</li>
      <li>B. 分档（轻度/重度），实现复杂</li>
      <li>C. 不收费只 AA</li>
    </ul></div>
  <div class="field"><span class="lbl">代码位置</span>
    <code>services/gateway/internal/billing/plans.go</code> ·
    桩 <code>TODO(pending-decision: subscription-tier-pricing)</code></div>
</article>
```

Keep the fields consistent so the page stays scannable: **问题（h3）· 为什么卡住 · 已经试过/已知
· 候选方案+推荐 · 代码位置**. If a spike produced a design doc behind this decision, link it.

The badge class signals the kind of call: `needs-human` (default), `needs-credential`,
`needs-business`, `needs-aesthetic`. They're just color keys; the page styles them.

## The code stub

At the exact spot the work is blocked, leave a stub in the comment syntax of that language:

```go
// TODO(pending-decision: subscription-tier-pricing) — 定价未定，见 docs/pending-decisions/index.html
return nil, errNotImplemented
```

This does double duty: a human reading the code lands on the open question, and
`grep -rn "pending-decision:"` lists every parked spot. Don't ship a plausible-looking guess
in place of the stub — a stub the human will see beats a wrong default they won't.

## Rules

- **One card per decision**, stable `id`. If you revisit a parked item and learn more, update
  the existing card rather than adding a duplicate.
- **Park, then move on.** A parked item must not block the rest of the goal — keep working
  other slices. (This is also why the goal's completion condition counts parked items as a
  valid terminal state — see `goal-condition.md`.)
- **Recommend, don't abdicate.** Always include your best recommendation and reasoning. You
  did the spike; you know the most. The human is deciding, not starting from zero.
- **Only park what truly needs a human.** If an experiment could answer it, that's a spike,
  not a parked decision. If a reasonable default is fine and cheap to change, just assume it
  and record the assumption. Parking is for the genuinely-not-yours calls.

## Close the loop — the queue is a *living* doc, not an append-only log

Parking is half the job; **un-parking is the other half**. A parked card becomes stale the
moment its decision is answered or its work is built — and a queue full of stale "still
pending" cards is worse than no queue: the human can't tell what actually needs them. So:

- **The instant a parked item is resolved, close its card in the same turn.** Resolved =
  the user confirmed the decision, OR you implemented it, OR a spike answered it. Don't leave
  it for "later" — later is how the queue rots.
- **Closing a card means:** mark it resolved (record *what was decided* — the decision is
  worth keeping), move it out of the "needs you" view (a separate "已决定 / resolved" group,
  or a `resolved` badge), **and remove the matching `TODO(pending-decision: <id>)` code stub**
  (or downgrade it to a plain `TODO(impl)` if only the build remains). Grep
  `pending-decision:` should only ever list genuinely-open items.
- **Reconcile at the top of every turn that has new user input.** Before doing new work,
  scan the queue against what the user just said or what you just shipped, and close anything
  now resolved. This is the step that was easy to skip in a long mixed interactive/autonomous
  run — make it a reflex.
- **"Decision made" ≠ "work done."** If the user decided *what* but the build is still
  pending, the *decision* card is resolved — re-file the remaining work as an ordinary
  implementation TODO, not a "pending decision". Keep the two distinct.

The test: at any moment, the "needs you" section should contain *only* things genuinely
waiting on the human right now. If it shows something already decided or already built, the
loop wasn't closed.
