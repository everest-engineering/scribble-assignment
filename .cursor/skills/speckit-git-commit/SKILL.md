---
name: speckit-git-commit
description: Auto-commit changes after a Spec Kit command completes (specify, clarify, plan, tasks, implement, validate, checklist, analyze)
compatibility: Requires spec-kit project structure with .specify/ directory
metadata:
  author: github-spec-kit
  source: git:commands/speckit.git.commit.md
---

# Auto-Commit Changes

Automatically stage and commit all changes after a Spec Kit workflow phase completes.

## When This Skill Runs (Mandatory)

**You MUST invoke this skill** at the end of these parent commands when they finish successfully:

| Parent command | Hook event | Commit message (configured) |
|----------------|------------|----------------------------|
| `/speckit-specify` | `after_specify` | `[Spec Kit] Add specification` |
| `/speckit-clarify` | `after_clarify` | `[Spec Kit] Clarify specification` |
| `/speckit-plan` | `after_plan` | `[Spec Kit] Add implementation plan` |
| `/speckit-tasks` | `after_tasks` | `[Spec Kit] Add tasks` |
| `/speckit-implement` | `after_implement` | `[Spec Kit] Implementation progress` |
| Acceptance-criteria validation (two-browser test) | `after_validate` | `[Spec Kit] Validate acceptance criteria` |
| `/speckit-checklist` | `after_checklist` | `[Spec Kit] Add checklist` |
| `/speckit-analyze` | `after_analyze` | `[Spec Kit] Add analysis report` |

These hooks are **mandatory** (`optional: false`) in `.specify/extensions.yml` and **enabled** in `.specify/extensions/git/git-config.yml`.

Do not skip auto-commit when uncommitted artifact or implementation changes exist, unless the auto-commit script reports no changes or Git is unavailable.

## Behavior

1. Determine the event name from the hook context (e.g., `after_specify`, `after_clarify`, `after_validate`)
2. Check `.specify/extensions/git/git-config.yml` for the `auto_commit` section
3. Look up the specific event key to see if auto-commit is enabled
4. Fall back to `auto_commit.default` if no event-specific key exists
5. Use the per-command `message` if configured, otherwise a default message
6. If enabled and there are uncommitted changes, run `git add .` + `git commit`

## Execution

Determine the event name from the hook that triggered this command, then run the script:

- **Bash**: `.specify/extensions/git/scripts/bash/auto-commit.sh <event_name>`
- **PowerShell**: `.specify/extensions/git/scripts/powershell/auto-commit.ps1 <event_name>`

Replace `<event_name>` with the actual hook event (e.g., `after_specify`, `after_plan`, `after_validate`).

### Hook dispatch from parent commands

When a parent skill's **Mandatory Post-Execution Hooks** section lists `speckit.git.commit`, emit:

```
## Extension Hooks

**Automatic Hook**: git
Executing: `/speckit.git.commit`
EXECUTE_COMMAND: speckit.git.commit
```

Then **immediately run** the auto-commit script with the matching event name for that parent command. Do not wait for user confirmation.

### Validate phase (no dedicated Spec Kit command)

After verifying acceptance criteria (e.g., two browser tabs, builds pass, scenario checklist complete), run:

```bash
.specify/extensions/git/scripts/bash/auto-commit.sh after_validate
```

Use this when the lab README "Validate" step completes for the current feature slice.

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

- If Git is not available or the current directory is not a repository: skip with a warning
- If no config file exists: skip (disabled by default)
- If no changes to commit: skip with a message
- If commit fails: report the error; do not mark the parent command as fully complete without noting the failure

## Done When

- [ ] Auto-commit script executed with the correct `after_*` event name
- [ ] Commit created when changes existed, or skip reason reported when not
- [ ] User informed of commit hash or skip reason in the completion report
