# spikekit

An AI-native take on *figuring out what to build and how* — shipped as Claude Code skills.

Most of today's "spec engineering" tooling (speckit, openspec, …) keeps the old
**design → develop → test** template and just points an LLM at each box. spikekit drops
the upfront speculative spec. You don't write down what you *think* will work and hope —
you go and *find out*, in dialogue, with throwaway code, and only then write the design
down as a record of what you actually proved.

![The spike lifecycle: a path is unclear → /spike runs throwaway experiments in a .spike/ scratch dir until proven → /spike-wrap consolidates the result into an agent-facing design.md (source of truth) and a human-facing one-pager → a fresh agent implements from design.md, which also tests whether the doc was good enough](./images/spike-lifecycle.png)

## The skills

Six skills, in four groups.

### Explore, then record it — `/spike` → `/spike-wrap`

**`/spike`** — when the path isn't obvious, you and the LLM align on intent, gather the
inputs that are actually missing (API docs, example payloads, the system being
integrated), and run *real* throwaway experiments in a `.spike/<topic>/` scratch directory
until the approach is proven — or proven not to work. Design done empirically and in
dialogue, not on paper. Re-invoke `/spike` to resume one in progress.

**`/spike-wrap`** — once it's confirmed, consolidate the spike into two durable docs, then
delete the scratch dir:

- `docs/designs/agents/<topic>/design.md` — full detail; the source of truth an agent
  implements from.
- `docs/designs/humans/<topic>/index.html` — a skimmable HTML one-pager (status badge,
  evidence and before/after cards, an experiments appendix), because LLMs now produce
  content faster than people can read it.

Implementation is a separate step: a fresh agent reads the agent doc and builds it — which
also tests whether the doc was good enough.

![A real /spike-wrap human one-pager — the spike-init design summary: a validated status badge, a "what / how it works" walkthrough, and a before/after card contrasting commands a model merely infers (and gets wrong) against commands actually run and stamped ✅ verified](./images/human-doc-onepager.png)

*A real `/spike-wrap` output — `docs/designs/humans/spike-init/index.html`, rendered.*

### Hand off the whole build — `/spike-goal`

**`/spike-goal`** — the policy layer that runs the loop above *unattended*. Claude Code's
built-in `/goal "<condition>"` is a good engine — it iterates across turns until a small
evaluator judges the condition met — but it's policy-free: it doesn't know which work it can
just build versus which to de-risk first, and when something needs a human it stalls or
guesses. `/spike-goal` supplies the missing policy. On **every turn** it *triages* the next
verifiable slice:

- **Certain** → implement it TDD-style (failing test → green → commit), following the repo's
  `AGENTS.md`.
- **Uncertain** → run an autonomous `/spike` (the same explore-with-throwaway-code loop, but
  with the dialogue stripped — it infers and records assumptions instead of asking), prove the
  approach, `/spike-wrap` it, then build.
- **Not the model's call** — a credential, a business or aesthetic decision — → **park** it as
  a card in `docs/pending-decisions/index.html`, leave a `TODO(pending-decision: <id>)` stub at
  the blocked spot, and move on. A parked item never stalls the rest of the goal.

One thing to get straight: the skill **can't fire `/goal` itself** — no agent turn can start a
built-in slash command. You launch the loop with permissions pre-granted; the skill governs how
the model behaves on every turn of it:

```sh
claude --dangerously-skip-permissions -p "/goal <verifiable condition> — follow the spike-goal skill"
```

Or run `/spike-goal <高层目标>` interactively first: it translates the fuzzy goal into a
verifiable condition, makes sure the parked-decisions queue exists, and hands you the exact
launch command to run. Either way — kick it off, walk away, and come back to either a finished
goal or a short, well-organized queue of decisions only a human could make.

![Per-turn triage in a /goal loop: each verifiable slice is sorted into certain (TDD build and commit), uncertain (autonomous spike to prove the approach, then wrap and build), or not-the-model's-call (parked as a card in docs/pending-decisions/index.html with a TODO stub) — buildable work ships, human decisions queue up, and the loop never stalls](./images/spike-goal-triage.png)

*The policy `/spike-goal` applies on every turn of the `/goal` loop.*

### Bootstrap a repo — `/spike-init`

**`/spike-init`** — for a new or existing project, research the repo and then *actually
run* the "set up the env / run tests / lint / type-check" commands, then write a clean pair
of agent-context files: `AGENTS.md` (the cross-tool convention) plus a repo-root
`CLAUDE.md` that `@AGENTS.md`-imports it. Verified commands get a `✅ verified <date>`
stamp. If those files already exist it improves them in place rather than overwriting. The
difference from Claude Code's built-in `/init`: `/init` writes the commands it *infers*;
`/spike-init` runs them first and writes only the ones that worked. See
`docs/designs/agents/spike-init/`.

### Write it up with visuals — `/spike-doc` + `/spike-screenshot`

**`/spike-doc`** — write documents that interleave prose with images and video (articles,
tutorials, design docs, READMEs). It doesn't replace your writing; it adds the two parts
models routinely get wrong: *judging where a visual genuinely earns its place*, and
*actually producing and embedding it* instead of leaving a "[screenshot here]" stub.

**`/spike-screenshot`** — the capture engine `/spike-doc` drives: screenshot a live page
or one element, render data into a clean figure (directory trees, comparison tables,
before/after cards) from purpose-built HTML/CSS, or record a short demo video — all
through bundled Playwright scripts. *(The two figures above were made with it.)*

## Layout

```
skills/
  spike/             # /spike — run throwaway experiments to de-risk an approach
  spike-wrap/        # /spike-wrap — consolidate a finished spike into design docs
  spike-goal/        # /spike-goal — policy for an unattended /goal loop (triage + park)
  spike-init/        # /spike-init — research a repo, write its AGENTS.md/CLAUDE.md
  spike-doc/         # /spike-doc — write docs rich with images & video
  spike-screenshot/  # /spike-screenshot — capture screenshots, figures, short videos
docs/designs/        # consolidated design records (created by /spike-wrap)
  README.md          # index
  agents/<topic>/    # detailed, for agents (markdown) — source of truth
  humans/<topic>/    # short, for humans (html) — distilled from the agent doc
docs/pending-decisions/  # parked human decisions from a /spike-goal run (index.html queue)
.spike/<topic>/      # scratch for an in-progress spike (gitignored; deleted at wrap-up)
```

## Install (Claude Code)

These are personal skills — symlink (or copy) them into `~/.claude/skills/`:

```sh
for s in spike spike-wrap spike-goal spike-init spike-doc spike-screenshot; do
  ln -s "$PWD/skills/$s" ~/.claude/skills/"$s"
done
```

Then `/spike`, `/spike-wrap`, `/spike-goal`, `/spike-init`, `/spike-doc`, and
`/spike-screenshot` are available in any project.

## Status

Early, but usable. All six skills work.
