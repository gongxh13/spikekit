---
name: spike-init
description: >-
  Research a repo, then actually *run* the "how to set up the env / run tests / lint /
  type-check" commands, and produce a clean pair of agent-context files for the project —
  `AGENTS.md` (the cross-tool convention every coding agent reads) plus a repo-root
  `CLAUDE.md` that `@AGENTS.md`-imports it (Claude Code only reads `CLAUDE.md`, not
  `AGENTS.md`). If those files already exist, *improve* them rather than overwrite —
  re-research, re-verify, and reconcile each existing claim. Verified commands get a
  `✅ verified <date>` marker so downstream agents and human reviewers know they were
  actually executed, not guessed. Use this when the user wants to "set up AGENTS.md /
  agent context for this project", "this repo has no CLAUDE.md, create one", "the
  AGENTS.md is out of date, fix it", "bootstrap project context", or "/spike-init". The
  difference from Claude Code's built-in `/init`: `/init` analyzes the codebase and
  writes down the commands it *infers*; `/spike-init` runs those commands first and only
  writes the ones that actually worked.
---

# spike-init: agent project context, with the commands actually run

## Why this exists

When an agent drops into a project, the first thing it gets stuck on is "how do I set up
the environment, how do I run the tests." Claude Code's built-in `/init` analyzes the
codebase and writes a starter `CLAUDE.md` with build/test commands — but those commands
are *inferred*, and inference is often wrong (the classic: see a `pyproject.toml`, write
`pip install -e .` + `pytest`, then it blows up because the system Python is too old or
the project actually uses uv/poetry/pdm).

`/spike-init`'s whole reason to exist: **run the commands you're about to recommend, keep
only the ones that actually work, and stamp them `✅ verified <date>`** — so the next
agent (and the human reviewing the file) knows they're real, not a guess. That's the
"spike" in the name: like `/spike`, it establishes facts with real experiments instead of
on paper. If your difference from `/init` isn't "I verified", you're just re-running
`/init` — so verify is not optional and there is no `--no-verify`.

The output is **a pair of files committed to the repo** (project-level, team-shared — not
the user's `~/.claude/`):

- **`AGENTS.md`** at the repo root — the cross-tool convention; Cursor, Codex, Aider,
  VS Code agents, etc. all read it. Free-form Markdown.
- **`CLAUDE.md`** at the repo root — first line `@AGENTS.md` to import it, then an
  optional short "Claude Code notes" section. **You cannot ship only `AGENTS.md`** —
  Claude Code doesn't read `AGENTS.md` directly, only `CLAUDE.md`.

This skill does *not* touch `.claude/rules/*`, `settings.json`, hooks, or Claude Code's
auto-memory at `~/.claude/projects/<project>/memory/` — leave all of that alone (note
`.claude/rules/` as a "next step" only, see step 6).

**Language:** these instructions are written in English for convenience — that's *not* a
cue to reply in English. Talk to the user, and write the `AGENTS.md` / `CLAUDE.md` prose,
in whatever language the user works in. Keep machine-facing bits as-is: the `@AGENTS.md`
import line, command names, the `✅ verified <date>` marker, the provenance HTML comment's
structure.

## 1. Decide the mode: generate or improve

Look for existing agent-context files at the repo root and the usual spots:
`AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md` — and also `.cursorrules`,
`.windsurfrules`, `.github/copilot-instructions.md`.

- **None found → `generate` mode.**
- **Any of them found → `improve` mode.** Read them all in. Treat every *specific* claim
  inside them ("Node 14+", "`yarn test`", "handlers live in `src/api/`") as a hypothesis
  to verify, not as truth — you'll reconcile each one in step 4.

Tell the user which mode you're in and what you found.

## 2. Research pass — read-only, fast

Gather the signals that pin down the **environment + dev/test workflow**. This is a
quick orientation, not a deep dive — you can run it in a subagent to save main context if
the repo is large. Roughly in priority order:

- **Lockfile → language/runtime & package manager (highest signal).** The lockfile, not
  the manifest, tells you which tool the maintainers actually use:
  - Node: `pnpm-lock.yaml` → pnpm · `yarn.lock` → yarn · `bun.lockb` → bun ·
    `package-lock.json` → npm
  - Python: `uv.lock` → uv · `poetry.lock` → poetry · `pdm.lock` → pdm ·
    `Pipfile.lock` → pipenv · else `pyproject.toml` / `requirements*.txt` → pip + venv
  - Other: `Cargo.lock` → cargo · `go.mod` / `go.sum` → go · `Gemfile.lock` → bundler ·
    `pom.xml` → maven · `build.gradle(.kts)` → gradle · `composer.lock` → composer · etc.
- **Version pins:** `.nvmrc` / `.node-version` / `package.json` `engines`;
  `pyproject.toml` `requires-python` / `.python-version`; `rust-toolchain(.toml)`; etc.
- **CI config** (`.github/workflows/*`, `.gitlab-ci.yml`, `.circleci/config.yml`, …) —
  the setup + test + lint commands the maintainers *actually trust and run*. Often the
  single best source.
- **Task / script definitions:** `package.json` `scripts`, `Makefile`, `justfile`,
  `tox.ini` / `pyproject.toml [tool.tox]`, `noxfile.py`, `composer.json` `scripts`,
  `Taskfile.yml`.
- **Dev container / nix:** `.devcontainer/`, `flake.nix`, `shell.nix`,
  `.tool-versions` (asdf/mise).
- **Human-written docs:** `README`, `CONTRIBUTING`, `docs/` — look for conventions and a
  "how to develop / hack on this" section.
- **Repo shape:** top-level directories, where source vs. tests live, whether it's a
  monorepo (workspaces / `packages/*`). (v1 still produces a single root `AGENTS.md` —
  see step 5 — but you want to know.)

**Don't infer the install command straight from the manifest.** `pyproject.toml`
existing ≠ use pip; `package.json` existing ≠ use npm. Priority is **lockfile → its
package manager > the command CI actually runs > README/CONTRIBUTING** — then verify it.

## 3. Verify pass — the differentiator: actually run the commands

This is the step that makes `/spike-init` worth using. **It always runs — no
`--no-verify`, no escape hatch.** Before running anything, tell the user "I'm going to run
`X` to verify the setup/test commands" — warn, then run. Try not to dirty tracked files
(install artifacts like `node_modules/`, `.venv/` are usually already gitignored; if
they're *not*, warn the user before you create them, or note it as a caveat).

1. **Set up the environment.** Run the install command for the package manager you
   detected: `npm ci` / `pnpm install --frozen-lockfile` / `yarn install --frozen-lockfile`
   / `uv sync --locked` / `poetry install` / `pdm install` / `cargo fetch` /
   `go mod download` / `bundle install` / … Record the exit code and the tail of the
   output. If it fails, fall back to the next candidate (e.g. `npm install`; for Python
   with no lockfile, `python -m venv .venv && pip install -e ".[dev]"`) — **and record the
   dead end** in the output's "known gotchas" / reconcile notes. A failed verify isn't a
   stop sign, it's information; that decision trail is exactly what's most useful to the
   next agent.
   - **Don't install against the system interpreter blind.** Python especially: the system
     Python frequently doesn't satisfy `requires-python`. Tools like uv/poetry pick or
     fetch a suitable interpreter; a bare `pip install -e .` against system Python fails
     with `requires a different Python`. If that's what you hit, that's a fact to put in
     the `AGENTS.md` Environment setup section ("use uv, not bare `pip install`").
2. **Run the tests.** Run the detected test command: `npm test` / `uv run pytest` /
   `pytest` / `cargo test` / `go test ./...` / `tox` / `make test` / … Confirm it
   *actually executed the suite* (not "no tests found"). Record a one-line result, e.g.
   "1493 passed, 24 skipped".
3. **Lint / format / type check.** Run them too if you reasonably can (`npm run check`,
   `ruff check`, `mypy`, `tsc --noEmit`, …). Less critical than the test run, but a
   confirmed command beats an inferred one.
4. **Needs an external dependency to run** (a DB, Redis, a secret you don't have)? **Do
   not fake it.** Write it in the output as a known prerequisite ("the test suite needs a
   local Postgres — see X") rather than claiming it ran green. The model's instinct here
   is to pretend it passed; resist that.
5. **New / empty project** — no test suite, no real build? Nothing to verify — **say so
   plainly.** The file then only records the conventions you *intend to adopt* (marked
   "not yet verified") plus whatever the user tells you; this branch degrades to "roughly
   what `/init` does + the `AGENTS.md`/`CLAUDE.md` pairing". You may *offer* to help set
   up a minimal test target, but don't push it.

## 4. Reconcile — improve mode only

For each *specific* claim in the existing file(s):

- **Contradicted by a verified fact** → fix it in place, and tell the user what changed
  and why ("`yarn test` → `npm test`: the lockfile is `package-lock.json` and CI caches
  npm").
- **Confirmed** → keep it (tighten the wording if it helps).
- **Unverifiable but not contradicted** (release process, "ask Bob", a business rule) →
  **leave it untouched.** Human knowledge an agent can't verify is still valuable.
- **References a path/script that doesn't exist** (e.g. mentions `scripts/build.sh` but
  there's no `scripts/` directory) → **don't silently delete it — raise it with the
  user**: "the file mentions `scripts/build.sh` but there's no `scripts/` directory —
  remove that line? or is it something not checked in?"
- **Too vague to be useful** ("keep it clean", "use the existing style") → keep the
  human's intent, but strengthen it with the concrete facts you verified (`npm run check`
  / prettier / eslint configs) — don't just delete it.

Preserve the existing file's structure and headings; minimize churn so the diff is easy
to review.

## 5. Ask only the gaps

After research + verify you usually have what you need. Ask only about — and propose your
best guess for each, don't interrogate:

- What you couldn't verify (which services/secrets a full test run needs).
- Conventions that aren't written down anywhere.
- Scope — monorepo: one root `AGENTS.md`, or per-package? (v1 default: root only;
  per-package is an open question.)
- Any contradictions you hit.

A short list, each item pre-filled with your recommendation. Not an interview.

## 6. Write the pair of files

**`AGENTS.md`** (repo root). Suggested sections — adapt to the project, drop ones that
don't apply:

> *Project layout · Environment setup · Running tests · Lint & format · Type checking ·
> Conventions · Build & misc*

- Keep it **compact** — the < ~200-line guidance applies (it's pulled into every session's
  context via the import; longer = worse adherence + more burned context). If it's heading
  past ~200 lines, **say so in the file**: note that splitting topics into `.claude/rules/`
  is the next step (don't actually create those files in v1).
- Instructions must be **specific and checkable** — "`uv run pytest`" not "run the tests";
  "2-space indent" not "format nicely"; "API handlers live in `src/api/handlers/`" not
  "keep it organized".
- **Stamp verified commands `✅ verified <YYYY-MM-DD>`** — put it next to the section
  heading, e.g. `## Running tests  ✅ verified 2026-05-13`. Only on what you actually ran.
- **Top-of-file provenance HTML comment** — block HTML comments are stripped from
  `CLAUDE.md` before it's injected into context, so this is free, and it gives the next
  re-run an anchor:

  ```
  <!-- Generated by spike-init on <date>. The commands under "Environment setup",
       "Running tests", and "Lint & format" / "Type checking" were executed and verified
       on this date. Re-run /spike-init to refresh. -->
  ```

  In improve mode, say "Updated by spike-init on <date>" and note that corrections from
  the previous version are listed in the run summary (and/or inline `<!-- was: ... -->`
  comments next to the lines you changed).

**`CLAUDE.md`** (repo root):

- First line: `@AGENTS.md`.
- Then an optional short "Claude Code notes" section, e.g.: "The standing project context
  (env setup, tests, lint, conventions) lives in `AGENTS.md`, imported above — edit it
  there so Cursor/Codex/other agents stay in sync." and "Commands marked `✅ verified` in
  `AGENTS.md` were actually run when this file was generated — trust them over guessing."
- **If the repo already has a non-empty `CLAUDE.md`**, fold the `@AGENTS.md` import line
  in at the top — don't clobber its existing content. (A symlink — `ln -s AGENTS.md
  CLAUDE.md` — is an alternative, but on Windows symlinks need admin/developer mode, so
  prefer the import; it's more portable.)

v1 does **not** generate `.claude/rules/*` or touch `settings.json`/hooks. If something
must run at a fixed lifecycle point ("run lint before every commit"), that belongs in a
hook in `settings.json` — out of scope here; mention it as a follow-up if it comes up,
don't implement it.

## 7. Show the user, then write

Show the proposed files before writing anything to disk:

- **generate mode** — show the full `AGENTS.md` and `CLAUDE.md` you intend to write.
- **improve mode** — show the diff against the existing file(s), plus a short list of the
  corrections you made and *why* (and flag anything you're raising rather than changing —
  the missing-path case, contradictions).

Write to disk only after the user confirms. When it's done, say so:

> Done. Wrote `AGENTS.md` + `CLAUDE.md` (which `@AGENTS.md`-imports it). The commands
> under the `✅ verified` sections were actually run just now — a fresh agent reading
> `CLAUDE.md`/`AGENTS.md` should be able to set up the env and run the tests first try,
> without guessing.
