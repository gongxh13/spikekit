# spikekit

An AI-native take on *figuring out what to build and how* — shipped as Claude Code skills.

Most of today's "spec engineering" tooling (speckit, openspec, …) keeps the old
**design → develop → test** template and just points an LLM at each box. spikekit drops
the upfront speculative spec. Instead:

1. **`/spike`** — when the path isn't obvious, you and the LLM align on intent, gather
   the inputs that are actually missing (API docs, example payloads, the system being
   integrated), and run *real* throwaway experiments in a `.spike/<topic>/` scratch
   directory until the approach is proven — or proven not to work. Design done
   empirically and in dialogue, not on paper. Re-invoke `/spike` to resume one in
   progress.

2. **`/spike-wrap`** — once it's confirmed, consolidate the spike into two durable docs,
   then delete the scratch dir:
   - `docs/designs/agents/<topic>/design.md` — full detail; the source of truth an agent
     implements from.
   - `docs/designs/humans/<topic>/index.html` — a one-page, skimmable summary, because
     LLMs now produce content faster than people can read it.
   Implementation is a separate step: a fresh agent reads the agent doc and builds it —
   which also tests whether the doc was good enough.

3. **(planned) a project-context skill** — for a new or existing project, research and
   generate a proper `AGENTS.md` plus the standing context an agent needs at each stage
   of the dev/test workflow (how to set up the env, how to run tests, project
   conventions). This one is itself being built via `/spike` — see `docs/designs/` once
   it lands.

## Layout

```
skills/
  spike/          # the /spike skill
  spike-wrap/     # the /spike-wrap skill
docs/designs/     # consolidated design records (created by /spike-wrap)
  README.md         # index
  agents/<topic>/   # detailed, for agents (markdown) — source of truth
  humans/<topic>/   # short, for humans (html) — distilled from the agent doc
.spike/<topic>/   # scratch for an in-progress spike (gitignored; deleted at wrap-up)
```

## Install (Claude Code)

These are personal skills — symlink (or copy) them into `~/.claude/skills/`:

```sh
ln -s "$PWD/skills/spike"      ~/.claude/skills/spike
ln -s "$PWD/skills/spike-wrap" ~/.claude/skills/spike-wrap
```

Then `/spike` and `/spike-wrap` are available in any project.

## Status

Early. `spike` / `spike-wrap` work; the project-context skill is next.
