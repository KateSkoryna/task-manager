#!/usr/bin/env python3
"""Block publication commands while a task workflow is active."""

import json
import re
import subprocess
import sys
from pathlib import Path


ACTIVE_STATUSES = {"planning", "implementing", "testing", "repairing"}
BLOCKED_TOOL_MARKERS = (
    "create_pull_request",
    "create_pr",
    "merge_pull_request",
    "create_deployment",
    "start_deployment",
    "trigger_deploy",
    "deploy_project",
)
BLOCKED_COMMANDS = (
    re.compile(r"\bgit(?:\s+-C\s+\S+)?\s+(?:commit|push|merge)\b", re.IGNORECASE),
    re.compile(r"\bgh\b[^\n;&|]*\bpr\s+(?:create|merge)\b", re.IGNORECASE),
    re.compile(r"\bvercel\s+(?:deploy\b|--prod\b)", re.IGNORECASE),
    re.compile(r"\bfirebase\s+deploy\b", re.IGNORECASE),
    re.compile(r"\b(?:npm|pnpm|yarn)\s+(?:run\s+)?deploy\b", re.IGNORECASE),
    re.compile(
        r"\b(?:nx|npm\s+exec\s+nx|pnpm\s+(?:exec\s+)?nx|yarn\s+nx)\s+[^\n;&|]*\bdeploy\b",
        re.IGNORECASE,
    ),
)
SHELL_TOOL_NAMES = {"bash", "exec_command", "shell"}


def repository_root(cwd: str) -> Path | None:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        cwd=cwd,
        capture_output=True,
        check=False,
        text=True,
        timeout=2,
    )
    if result.returncode != 0:
        return None
    return Path(result.stdout.strip())


def current_branch(root: Path) -> str | None:
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        cwd=root,
        capture_output=True,
        check=False,
        text=True,
        timeout=2,
    )
    branch = result.stdout.strip()
    return branch or None


def active_workflow(root: Path, branch: str | None) -> str | None:
    tasks = root / "docs" / "tasks"
    if not tasks.is_dir() or not branch:
        return None

    for state_file in tasks.glob("*/workflow-state.md"):
        content = state_file.read_text(errors="replace")
        match = re.search(
            r"^- Status:\s*(.+?)\s*$",
            content,
            re.IGNORECASE | re.MULTILINE,
        )
        branch_match = re.search(
            r"^- Branch:\s*`?(.+?)`?\s*$",
            content,
            re.IGNORECASE | re.MULTILINE,
        )
        state_branch = branch_match.group(1).strip(" `") if branch_match else None
        if (
            match
            and match.group(1).strip().lower() in ACTIVE_STATUSES
            and state_branch == branch
        ):
            return state_file.parent.name
    return None


def blocked_action(payload: dict) -> str | None:
    tool_name = str(payload.get("tool_name", ""))
    normalized_name = tool_name.lower()
    if any(marker in normalized_name for marker in BLOCKED_TOOL_MARKERS):
        return tool_name

    if normalized_name not in SHELL_TOOL_NAMES and not normalized_name.endswith("exec_command"):
        return None

    tool_input = payload.get("tool_input") or {}
    command = str(tool_input.get("command") or tool_input.get("cmd") or "")
    for pattern in BLOCKED_COMMANDS:
        match = pattern.search(command)
        if match:
            return match.group(0)
    return None


def main() -> int:
    try:
        payload = json.load(sys.stdin)
        root = repository_root(str(payload.get("cwd") or "."))
        branch = current_branch(root) if root else None
        task_id = active_workflow(root, branch) if root else None
        action = blocked_action(payload) if task_id else None
    except Exception as error:  # Fail visibly without blocking unrelated work.
        print(json.dumps({"systemMessage": f"Workflow guard check failed: {error}"}))
        return 0

    if not action:
        return 0

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": (
                        f"Blocked '{action}' while task workflow {task_id} is active. "
                        "Finish with uncommitted local changes for user review."
                    ),
                }
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
