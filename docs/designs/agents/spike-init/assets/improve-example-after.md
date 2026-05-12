<!-- Updated by the project-context skill on 2026-05-13. Setup/test/lint commands below were
     executed and verified on this date. Corrections from the previous version are noted in
     the skill's run summary. -->

# Agent guide — commander.js

The complete solution for node.js command-line programs (a CommonJS args parser, ships ESM +
TypeScript typings). See `Readme.md` for usage.

## Setup  ✅ verified 2026-05-13

- Node **≥ 20** (`engines.node`; CI tests 20 / 22 / 24).  <!-- was: "Node 14+" -->
- `npm ci` — clean install from `package-lock.json`. (Don't use `yarn`; the lockfile is
  npm's and CI caches npm.)  <!-- was: "yarn install" -->

## Tests  ✅ verified 2026-05-13

- `npm test` — runs Jest + the TS typings check (`jest && npm run check:type:ts`), ~1400 tests.
  <!-- was: "yarn test" -->
- `npm run test-all` — Jest + ESM import test + full `check` (lint/format/type); this is the
  CI-equivalent.
- One file: `npx jest tests/options.test.js`. By name: `npx jest -t "name"`.

## Lint, format & type checks  ✅ verified 2026-05-13

- `npm run check` — `tsc` (JS + TS) + `eslint` + `prettier --check`.
- `npm run fix` — `eslint --fix` + `prettier --write`. Run this (or `check`) before committing.

## Style

- Match the existing code style; `npm run check` is the source of truth (prettier + eslint
  configs in `.prettierrc.js` / `eslint.config.js`).
- Typings in `typings/` are hand-maintained and tested with `tsd` — update them on API changes.
- Add a `CHANGELOG.md` entry for user-visible changes.

## Notes

<!-- The previous version referenced a "custom build script in scripts/build.sh", but there is
     no scripts/ directory in the repo — line removed; flagged to the maintainer in case it's
     something not checked in. -->
- The release process is documented in the wiki.  <!-- kept: human knowledge, not contradicted -->
