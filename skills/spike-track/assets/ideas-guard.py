#!/usr/bin/env python3
"""Stop-hook guard for the spike-track cross-session idea board (IDEAS.md).

Bundled asset of the `spike-track` skill. Install into a project on request:
  1. copy this file to  <project>/.claude/hooks/ideas-guard.py  (chmod +x)
  2. merge assets/stop-hook.settings.json into <project>/.claude/settings.json

Behavior: fires when an assistant turn ends. If the session was *substantive* (not a
trivial typo/one-liner) and the board was neither updated nor explicitly reconciled, it
blocks ONCE and nudges the model to sync IDEAS.md — or to acknowledge "no change". It
judges by whether the session had REAL content, NOT by whether files changed:
pure-discussion / deep-thinking sessions are exactly the ones worth capturing and the
easiest to lose. It never traps the user in a loop, and fails open on any error (never
wedge a session because the guard misbehaved).

The "no change" acknowledgement is the literal sentinel line `[IDEAS reviewed]` — the
spike-track SKILL.md instructs the model to emit it. Keep it in sync if you change it here.
"""
import json
import os
import sys

TRIVIAL_MAX_TURNS = 1
TRIVIAL_MAX_ASSISTANT_CHARS = 600
SENTINEL = "[IDEAS reviewed]"
BOARD_FILENAME = "IDEAS.md"
EDIT_TOOLS = {"Edit", "Write", "MultiEdit"}


def _user_text(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(
            it.get("text", "")
            for it in content
            if isinstance(it, dict) and it.get("type") == "text"
        )
    return ""


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    # Already nudged once this stop-cycle -> let it stop (nudge, don't trap).
    if data.get("stop_hook_active"):
        sys.exit(0)

    cwd = data.get("cwd") or os.getcwd()
    board_path = os.path.join(cwd, BOARD_FILENAME)
    if not os.path.exists(board_path):
        sys.exit(0)  # no board in this project -> nothing to guard

    transcript = data.get("transcript_path") or ""
    if not os.path.exists(transcript):
        sys.exit(0)

    user_turns = 0
    assistant_chars = 0
    board_edited = False
    last_assistant_text = ""

    try:
        with open(transcript, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                except Exception:
                    continue
                rtype = rec.get("type")
                content = (rec.get("message") or {}).get("content")

                if rtype == "user":
                    text = _user_text(content).strip()
                    if (
                        text
                        and not text.startswith("<system-reminder")
                        and "<command-" not in text
                        and "<local-command" not in text
                    ):
                        user_turns += 1

                elif rtype == "assistant" and isinstance(content, list):
                    for it in content:
                        if not isinstance(it, dict):
                            continue
                        if it.get("type") == "text":
                            txt = it.get("text", "")
                            assistant_chars += len(txt)
                            if txt.strip():
                                last_assistant_text = txt
                        elif it.get("type") == "tool_use" and it.get("name") in EDIT_TOOLS:
                            fp = (it.get("input") or {}).get("file_path", "") or ""
                            if os.path.basename(fp) == BOARD_FILENAME:
                                board_edited = True
    except Exception:
        sys.exit(0)

    # Trivial session (typo / one quick thing) -> let it pass.
    if user_turns <= TRIVIAL_MAX_TURNS and assistant_chars < TRIVIAL_MAX_ASSISTANT_CHARS:
        sys.exit(0)

    # Already reconciled this session -> pass.
    if board_edited or SENTINEL in last_assistant_text:
        sys.exit(0)

    reason = (
        "[spike-track] This session had substantive content but IDEAS.md was not synced. "
        "Review: did any idea change state, or did a new idea / conclusion emerge "
        "(pure discussion, thinking, and Q&A count — often more important than code)?\n"
        "- If yes -> update the matching IDEAS.md row (status / last-touched / next-step), "
        "or add a row.\n"
        "- If genuinely none -> end your reply with the line [IDEAS reviewed].\n"
        "(Trivial typo / one-line changes can be ignored.)"
    )
    print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


if __name__ == "__main__":
    main()
