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

## 🔧 Maintaining this board

- **An idea progressed**: update its row (`status / last-touched / next-step`).
- **A new idea** (including ones that surfaced in pure discussion/thinking): add a row,
  starting at 💡.
- **Recall an old idea**: full-text search past sessions.
- This board is produced by the `spike-track` skill and anchored by a memory note, so new
  sessions know it exists.
- If the optional Stop hook is installed (`.claude/hooks/ideas-guard.py`): a substantive
  session that ends without syncing the board (and without the line `[IDEAS reviewed]`) gets
  nudged once.
