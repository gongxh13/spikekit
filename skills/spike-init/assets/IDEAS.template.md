# 💡 IDEAS — <project> idea & landing board

> The cross-session "idea → landing" ledger. New sessions auto-discover it via memory +
> CLAUDE.md, so threads don't fall through the cracks when you fan out into parallel
> sessions. Ideas not yet on the board are still recoverable via session full-text search.
>
> Last updated: <YYYY-MM-DD> · maintenance notes at the bottom

**Status legend** (progress axis): 💡 idea · 🔬 exploring · 🛠 building · ✅ shipped · 🅿️ parked

**Scene legend** (nature axis, orthogonal to status; tag it on each theme header):
🏗️ feature · 📊 data/eval · 🔬 research · 🧠 learning · 🔧 tooling

> Two axes: **status** = how far it got; **scene** = what kind of work it is. Slice the same
> backlog by theme (project) or by scene (nature).

---

## 🎯 Theme 1 — <name>　〔<scene tag>〕

| # | idea | status | last-touched | next-step |
|---|------|--------|--------------|-----------|
| A1 | <one-line idea> | 💡 idea | MM-DD · *session title* | <next concrete action> |

<!-- Duplicate the section above per theme/initiative.
     Link each ✅ row to its docs/designs/agents/<topic>/design.md when one exists. -->

---

## ⏳ Parked / needs-decision

1. <decisions a human must make / status-uncertain rows>

---

<!-- archived-below -->
## 📦 Archived (shipped & retired)

> Folded-away history — keeps the **active** board above short and skimmable. Move a row here
> once it stops being actionable: ✅ shipped (keep its `docs/designs/agents/<topic>/design.md`
> link) or an abandoned idea (note the one-line "why not"). This section can grow freely;
> de-dup checks and the archive nudge both read it. Don't delete rows — fold them.

### <theme> — archived

| # | idea | status | last-touched | outcome / design.md |
|---|------|--------|--------------|---------------------|
| A2 | <shipped idea> | ✅ shipped | MM-DD | [design](docs/designs/agents/<topic>/design.md) |

---

## 🔧 Maintaining this board

- **An idea progressed**: update its row (`status / last-touched / next-step`).
- **A new idea** (including ones that surfaced in pure discussion/thinking): add a row,
  starting at 💡 — but **first scan existing rows (active *and* archived) for the same topic**
  and update/merge that one instead of duplicating it.
- **An idea landed or died**: when a row reaches ✅ shipped (or is abandoned) and is no longer
  actionable, **fold it down into the Archived section** above so the active board stays short.
- **Recall an old idea**: check the Archived section first, then full-text search past sessions.
- This board is produced by the `spike-init` skill and anchored by a memory note, so new
  sessions know it exists. The `<!-- archived-below -->` marker is machine-read by the guard —
  keep it as the boundary between the active board and the archive.
- If the optional Stop hook is installed (`.claude/hooks/ideas-guard.js`): a substantive
  session that ends without syncing the board (and without the line `[IDEAS reviewed]`) gets
  nudged once — and the same nudge also flags de-duplication and, when done rows pile up on the
  active board, prompts you to archive them.
