#!/usr/bin/env node
"use strict";
/*
 * Stop-hook guard for the spike-init cross-session idea board (IDEAS.md).
 *
 * Bundled asset of the `spike-init` skill. Install into a project on request:
 *   1. copy this file to  <project>/.claude/hooks/ideas-guard.js  (chmod +x)
 *   2. merge assets/stop-hook.settings.json into <project>/.claude/settings.json
 *
 * Behavior: fires when an assistant turn ends. If the session was *substantive* (not a
 * trivial typo/one-liner) and the board was neither updated nor explicitly reconciled,
 * it blocks ONCE and nudges the model to sync IDEAS.md — or to acknowledge "no change".
 * It judges by whether the session had REAL content, NOT by whether files changed:
 * pure-discussion / deep-thinking sessions are exactly the ones worth capturing and the
 * easiest to lose. It never traps the user in a loop, and fails open on any error
 * (never wedge a session because the guard misbehaved).
 *
 * The nudge does double duty. Beyond "sync the board" it also reminds the model to (a)
 * de-duplicate — scan existing rows for the same topic before adding a new one — and (b)
 * archive: when too many done/retired rows pile up on the ACTIVE board (counted above the
 * ARCHIVE_MARKER), nudge to move them into the folded archived section so the live board
 * stays short. One board file, kept short by folding — not split across files.
 *
 * The "no change" acknowledgement is the literal sentinel line `[IDEAS reviewed]` — the
 * spike-init SKILL.md instructs the model to emit it. Keep both in sync if you change it.
 */
const fs = require("fs");
const path = require("path");

const TRIVIAL_MAX_TURNS = 1;
const TRIVIAL_MAX_ASSISTANT_CHARS = 600;
const SENTINEL = "[IDEAS reviewed]";
const BOARD = "IDEAS.md";
const EDIT_TOOLS = new Set(["Edit", "Write", "MultiEdit"]);
// Everything below this literal marker in IDEAS.md is the folded "archived" section and is
// ignored when measuring how long the ACTIVE board has grown. Keep in sync with the template.
const ARCHIVE_MARKER = "<!-- archived-below -->";
// How many ✅-shipped rows may sit on the ACTIVE board before we nudge to archive them.
const ACTIVE_SHIPPED_SOFT_MAX = 6;

function userText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((it) => it && it.type === "text")
      .map((it) => it.text || "")
      .join(" ");
  }
  return "";
}

// True when the ACTIVE board (everything above ARCHIVE_MARKER) carries more ✅-shipped table
// rows than ACTIVE_SHIPPED_SOFT_MAX — i.e. done work is cluttering the live board and should
// be folded down. Rows already in the archived section don't count. Fails open (false).
function boardNeedsArchive(boardPath) {
  let text;
  try {
    text = fs.readFileSync(boardPath, "utf8");
  } catch (e) {
    return false;
  }
  const idx = text.indexOf(ARCHIVE_MARKER);
  const active = idx === -1 ? text : text.slice(0, idx);
  let shippedRows = 0;
  for (const raw of active.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("|") && line.includes("✅")) shippedRows++;
  }
  return shippedRows > ACTIVE_SHIPPED_SOFT_MAX;
}

function main() {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(0, "utf8"));
  } catch (e) {
    process.exit(0); // fail open
  }

  // Already nudged once this stop-cycle -> let it stop (nudge, don't trap).
  if (data.stop_hook_active) process.exit(0);

  const cwd = data.cwd || process.cwd();
  if (!fs.existsSync(path.join(cwd, BOARD))) process.exit(0); // no board here -> skip

  const transcript = data.transcript_path || "";
  if (!transcript || !fs.existsSync(transcript)) process.exit(0);

  let userTurns = 0;
  let assistantChars = 0;
  let boardEdited = false;
  let lastAssistantText = "";

  let lines;
  try {
    lines = fs.readFileSync(transcript, "utf8").split("\n");
  } catch (e) {
    process.exit(0);
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch (e) {
      continue;
    }
    const content = rec.message && rec.message.content;

    if (rec.type === "user") {
      const text = userText(content).trim();
      if (
        text &&
        !text.startsWith("<system-reminder") &&
        !text.includes("<command-") &&
        !text.includes("<local-command")
      ) {
        userTurns++;
      }
    } else if (rec.type === "assistant" && Array.isArray(content)) {
      for (const it of content) {
        if (!it || typeof it !== "object") continue;
        if (it.type === "text") {
          const txt = it.text || "";
          assistantChars += txt.length;
          if (txt.trim()) lastAssistantText = txt;
        } else if (it.type === "tool_use" && EDIT_TOOLS.has(it.name)) {
          const fp = (it.input && it.input.file_path) || "";
          if (path.basename(fp) === BOARD) boardEdited = true;
        }
      }
    }
  }

  // Trivial session (typo / one quick thing) -> let it pass.
  if (userTurns <= TRIVIAL_MAX_TURNS && assistantChars < TRIVIAL_MAX_ASSISTANT_CHARS) {
    process.exit(0);
  }

  // Explicit reconciliation this session -> full review acknowledged, pass.
  if (lastAssistantText.includes(SENTINEL)) process.exit(0);

  // Two independent reasons to nudge: the board wasn't synced, and/or done rows have piled
  // up on the active board and want archiving. Either can fire; both share one block.
  const needsSync = !boardEdited;
  const needsArchive = boardNeedsArchive(path.join(cwd, BOARD));
  if (!needsSync && !needsArchive) process.exit(0);

  const parts = ["[spike-init board guard]"];
  if (needsSync) {
    parts.push(
      "This session had substantive content but IDEAS.md was not synced. " +
        "Review: did any idea change state, or did a new idea / conclusion emerge " +
        "(pure discussion, thinking, and Q&A count — often more important than code)?\n" +
        "- If yes -> update the matching IDEAS.md row (status / last-touched / next-step), or add a row.\n" +
        "  Before adding, scan existing rows (active AND the archived section) for the same topic — " +
        "update or merge that one instead of creating a duplicate.\n" +
        "- If genuinely none -> end your reply with the line " + SENTINEL + ".\n" +
        "(Trivial typo / one-line changes can be ignored.)"
    );
  }
  if (needsArchive) {
    parts.push(
      "The active board has accumulated done/retired rows. Fold ✅-shipped and abandoned ideas " +
        "down into the archived section (below the \"" + ARCHIVE_MARKER + "\" marker), keeping each " +
        "design.md link, so the live board stays short. If it's already tidy, end your reply with the line " +
        SENTINEL + "."
    );
  }
  process.stdout.write(JSON.stringify({ decision: "block", reason: parts.join("\n\n") }));
  process.exit(0);
}

main();
