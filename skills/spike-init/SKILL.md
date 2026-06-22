---
name: spike-init
description: >-
  Initialize a project for spikekit's way of working: set up the cross-session
  "idea → landing" board that stops ideas from getting lost after parallel sessions. A
  ONE-SHOT scaffolder — it creates a project-root `IDEAS.md` with a two-axis schema (a
  STATUS axis: 💡 idea / 🔬 exploring / 🛠 building / ✅ shipped / 🅿️ parked, and a
  SCENE/category axis: feature / data-eval / research / learning / tooling), anchors it
  with an auto-loaded memory pointer plus a CLAUDE.md convention (so headless
  `/spike-goal` runs and sub-agents honor it too), can bootstrap the board by mining the
  project's past session transcripts, and OPTIONALLY installs a Stop-hook guard (Node)
  that nudges you to sync the board before a substantive session ends. After it runs,
  the skill steps aside — day-to-day tracking is carried by the convention + the guard,
  not by re-invoking it. Use this when the user says things like "set up spikekit in
  this project", "initialize idea tracking", "I keep losing track of my ideas", "track
  ideas across sessions", "make an idea / landing board", "build a backlog / kanban for
  this project", or "/spike-init". Distinct from Claude Code's built-in `/init`
  (codebase doc) and from `/spike-runbook` (verified `AGENTS.md`/`CLAUDE.md` context
  files). Pairs with `/spike-wrap`: spike-wrap archives ONE finished spike into a design
  doc; the board spike-init sets up is the GLOBAL index across all of them (each ✅ row
  links to its design.md).
---

# Spike-init: initialize the cross-spike landing board

## Why this exists

`/spike` validates one idea; `/spike-wrap` archives that one idea into a per-topic design
doc. But across many parallel sessions there is no **portfolio view**: which ideas exist,
what state each is in, and what the next concrete step is. Ideas raised in pure-discussion
sessions (no file touched, so `/spike-wrap` never fires) are the easiest to lose.

`spike-init` closes that gap by **initializing** the missing layer — one durable board plus
the conventions that keep it alive. It is invoked once per project (and re-invoked only to
restructure or re-bootstrap); the *ongoing* tracking is not the skill's job but the system
it leaves behind:

1. **Data** — `IDEAS.md` at the project root (the board).
2. **Anchor (soft)** — a memory pointer so interactive sessions auto-know it exists.
3. **Convention (soft)** — a `CLAUDE.md` block so headless `/spike-goal` runs and sub-agents
   (which don't load personal memory) honor it.
4. **Guard (hard, optional)** — a `Stop` hook (Node) that nudges once if a substantive
   session ends unsynced. Bundled as an asset; installed only when the user opts in.

**Language:** these instructions are English for convenience — produce the board, the memory
note, and the CLAUDE.md text in the user's working language. Keep the status/scene emoji and
the literal sentinel marker as-is (they are machine-facing).

## The board format (two orthogonal axes)

Start from `assets/IDEAS.template.md`. Core ideas:

- **Status axis (progress):** `💡 idea · 🔬 exploring · 🛠 building · ✅ shipped · 🅿️ parked`.
- **Scene axis (nature):** `🏗️ feature · 📊 data/eval · 🔬 research · 🧠 learning · 🔧 tooling`.
  Tag it on each section header (most themes are mono-scene). Add a per-row category column
  only if single ideas genuinely span scenes.
- **Sections = themes/initiatives**, each a table. One sub-idea per row, id-prefixed
  (A1, A2, B1…). Row schema: `# | idea | status | last-touched | next-step`.
  - `last-touched` = `MM-DD · *session title*` (traceable back to where it was discussed).
  - `next-step` = the next concrete action, not a vague aspiration.
- A `Parked / needs-decision` section collects open decisions and status-uncertain rows.
- Each `✅` row should link to its `docs/designs/agents/<topic>/design.md` when one exists
  (the `/spike-wrap` output) — the board indexes them.
- **One file, kept short by folding — not split.** The board stays a single `IDEAS.md`. A
  trailing `📦 Archived` section, marked by the literal `<!-- archived-below -->` line, holds
  rows that have stopped being actionable (✅ shipped, abandoned). The active board above the
  marker is the part that must stay skimmable; the archive can grow freely. The marker is
  machine-read by the guard to measure active-board length — keep it verbatim.

## 1. Bootstrap the board from history (best-effort)

If the project already has sessions, reconstruct the board instead of starting blank:

- List past sessions for this project. If session-management MCP tools are available, use
  them; otherwise read transcripts directly from `~/.claude/projects/<encoded-cwd>/*.jsonl`
  (encoded-cwd = the absolute path with `/` → `-`).
- Extract the highest-signal content cheaply: the **human turns** are the ideas. A compact
  pass (skip tool noise / system reminders / command output):
  `jq -r 'select(.type=="user") | .message.content as $c | (if ($c|type)=="string" then $c else ([$c[]?|select(.type=="text")|.text]|join(" ")) end)' <file>.jsonl`
- Group extracted ideas into themes, infer each one's status from what actually shipped
  (check the filesystem: design docs, code, tests), tag scenes, and write `IDEAS.md`.
- Flag anything you can't confirm as `🛠 needs-confirm` under the parked section rather than
  guessing — accuracy is the whole point.

If there's no history, just instantiate the template and grow it from here.

## 2. Anchor it (so every future session knows)

- **Memory pointer:** write a small project-scoped memory note saying the board lives at
  `IDEAS.md`, summarizing the two axes, and instructing: *keep rows updated proactively when
  any idea changes state — pure-discussion / thinking sessions count too.*
- **CLAUDE.md convention:** add (or append) a section to the project-root `CLAUDE.md` that
  states the same rule as a **default session responsibility** (so `/spike-goal` and
  sub-agents obey it). Include the reconciliation contract from step 3.

## 3. The contract you leave behind (every future session)

- Before finishing a session, review whether any idea **changed state** or a **new
  idea/insight emerged** — *pure discussion, thinking, and Q&A count*, and are often the most
  valuable and easiest to lose.
- If yes → update the matching row (`status / last-touched / next-step`) or add a row (new
  idea starts at 💡). **Before adding a row, scan existing rows — active *and* the archived
  section — for the same topic, and update/merge that one instead of creating a duplicate.**
- **Keep the active board short by folding, not deleting.** When a row reaches ✅ shipped (or
  is abandoned) and is no longer actionable, move it below the `<!-- archived-below -->` marker
  into the `📦 Archived` section, keeping its `design.md` link. The single `IDEAS.md` is never
  split into separate files.
- If a substantive session genuinely produced no board change → end the reply with the
  literal sentinel line `[IDEAS reviewed]`.
- Trivial typo / one-liner / quick-lookup sessions → skip; don't touch the board.

## 4. Optional: install the enforcement guard (opt-in)

spikekit ships no hooks by default, so this is **per-project and opt-in**. When the user
wants enforcement (mirrors how `/spike-doc` and `/spike-screenshot` bundle their scripts;
the guard is Node — no extra runtime, Claude Code itself runs on it):

1. `mkdir -p <project>/.claude/hooks && cp assets/ideas-guard.js <project>/.claude/hooks/ && chmod +x <project>/.claude/hooks/ideas-guard.js`
2. Merge `assets/stop-hook.settings.json` into `<project>/.claude/settings.json` (create it
   if absent; merge into the `hooks.Stop` array if it exists — don't clobber other hooks).
3. **Verify, don't assume** — feed the script synthetic transcripts on stdin and confirm:
   trivial → pass; substantive-unsynced → blocks with a sync reason; sentinel present →
   pass; `stop_hook_active:true` → pass (never traps); and an active board with more than
   `ACTIVE_SHIPPED_SOFT_MAX` ✅ rows *above* the `<!-- archived-below -->` marker → blocks with
   an archive reason (even when the board was edited). Then tell the user it's live from the
   *next* session (hooks load at session start).

Behavior is intentionally mild: at most one nudge per stop, judged by whether the session had
real content (not by whether files changed). The nudge does triple duty — sync the board,
**de-duplicate** before adding a row, and **archive** done rows once they pile up on the active
board. Tune via the `TRIVIAL_MAX_*` and `ACTIVE_SHIPPED_SOFT_MAX` constants at the top of
`ideas-guard.js`; remove the `stop_hook_active` early-return to make it a hard gate.

## Relationship to the rest of spikekit

- `/spike` → explore one idea. `/spike-wrap` → archive that one idea (design.md).
- `/spike-init` → **initialize the index over all of them**: status, scene, next step, and a
  link to each design.md. Init once; the convention + guard keep the portfolio honest; run
  spike-wrap when an entry graduates to ✅ and deserves a full write-up.
- `/spike-runbook` (formerly named spike-init) is unrelated to the board: it researches the
  repo, *runs* the setup/test/lint commands, and writes the verified `AGENTS.md`/`CLAUDE.md`
  agent-context pair.

## Files in this skill

- `assets/IDEAS.template.md` — starter board (two-axis schema + maintenance footer).
- `assets/ideas-guard.js` — the optional Stop-hook guard (Node, bundled asset).
- `assets/stop-hook.settings.json` — the `hooks.Stop` snippet to merge into settings.json.
