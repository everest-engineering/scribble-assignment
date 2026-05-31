---
description: "Auto-commit changes after a Spec Kit command completes"
---

# Auto-Commit Changes

Automatically stage and commit all changes after a Spec Kit workflow phase completes.

## When This Command Runs (Mandatory)

**Must run** at the end of these parent commands when they finish successfully:

| Parent command | Hook event | Commit message (configured) |
|----------------|------------|----------------------------|
| `/speckit-specify` | `after_specify` | `[Spec Kit] Add specification` |
| `/speckit-clarify` | `after_clarify` | `[Spec Kit] Clarify specification` |
| `/speckit-plan` | `after_plan` | `[Spec Kit] Add implementation plan` |
| `/speckit-tasks` | `after_tasks` | `[Spec Kit] Add tasks` |
| `/speckit-implement` | `after_implement` | `[Spec Kit] Implementation progress` |
| Acceptance-criteria validation | `after_validate` | `[Spec Kit] Validate acceptance criteria` |
| `/speckit-checklist` | `after_checklist` | `[Spec Kit] Add checklist` |
| `/speckit-analyze` | `after_analyze` | `[Spec Kit] Add analysis report` |

These hooks are mandatory in `.specify/extensions.yml` and enabled in `.specify/extensions/git/git-config.yml`.

## Behavior

This command is invoked as a hook after core commands. It:

1. Determines the event name from the hook context (e.g., `after_specify`, `after_validate`)
2. Checks `.specify/extensions/git/git-config.yml` for the `auto_commit` section
3. Looks up the specific event key to see if auto-commit is enabled
4. Falls back to `auto_commit.default` if no event-specific key exists
5. Uses the per-command `message` if configured, otherwise a default message
6. If enabled and there are uncommitted changes, runs `git add .` + `git commit`

## Execution

Determine the event name from the hook that triggered this command, then run the script:

- **Bash**: `.specify/extensions/git/scripts/bash/auto-commit.sh <event_name>`
- **PowerShell**: `.specify/extensions/git/scripts/powershell/auto-commit.ps1 <event_name>`

Replace `<event_name>` with the actual hook event (e.g., `after_specify`, `after_plan`, `after_validate`).

For the lab **Validate** step (no dedicated Spec Kit command), run `after_validate` after acceptance criteria pass.

## Configuration

In `.specify/extensions/git/git-config.yml`:

```yaml
auto_commit:
  default: false
  after_specify:
    enabled: true
    message: "[Spec Kit] Add specification"
  after_clarify:
    enabled: true
    message: "[Spec Kit] Clarify specification"
  after_plan:
    enabled: true
    message: "[Spec Kit] Add implementation plan"
  after_tasks:
    enabled: true
    message: "[Spec Kit] Add tasks"
  after_implement:
    enabled: true
    message: "[Spec Kit] Implementation progress"
  after_validate:
    enabled: true
    message: "[Spec Kit] Validate acceptance criteria"
  after_checklist:
    enabled: true
    message: "[Spec Kit] Add checklist"
  after_analyze:
    enabled: true
    message: "[Spec Kit] Add analysis report"
```

## Graceful Degradation

- If Git is not available or the current directory is not a repository: skips with a warning
- If no config file exists: skips (disabled by default)
- If no changes to commit: skips with a message
