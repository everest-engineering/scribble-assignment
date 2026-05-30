---
name: "speckit-pr-review"
description: "Review the current pull request against the generated Spec Kit artifacts (constitution, spec, plan) and publish the review using the GitHub CLI (gh)."
compatibility: "Requires spec-kit project structure with .specify/ directory and gh CLI installed and authenticated"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/pr-review.md"
---

## PR Review Execution Flow

When invoked via `/speckit-pr-review`, you must perform a comprehensive review of the active Pull Request against the Spec Kit artifacts and publish it via the `gh` CLI.

1. **Fetch PR Information**:
   - Use the `run_command` tool to execute `gh pr status` or `gh pr view` to identify the current active pull request.
   - Use `gh pr diff` to retrieve the exact code changes in the pull request.

2. **Review Context Gathering**:
   - Read `.specify/memory/constitution.md` to understand core principles and constraints.
   - Read the relevant `/specs/[feature-name]/spec.md` to identify the User Scenarios and Acceptance Criteria.
   - Read the relevant `/specs/[feature-name]/plan.md` to understand the intended architecture and file changes.

3. **Diff Inspection & Analysis**:
   - Analyze the diff from step 1 against the context gathered in step 2.
   - Verify that there are no violations of the Constitution (e.g., no WebSockets, no databases, proper TypeScript usage, proper Zod validation, etc.).
   - Verify that all Acceptance Criteria defined in the `spec.md` are demonstrably handled in the code.
   - Identify any edge cases, missing test coverage, or code quality issues.

4. **Preview Review to User**:
   - Draft a comprehensive review plan. Instead of just an overall summary, you MUST prepare inline comments for specific line numbers in specific files wherever applicable.
   - Your draft should include:
     - **Overall Summary**: Overall assessment (Approve, Request Changes, or Comment) and general notes on Constitution/Spec compliance.
     - **Inline Comments**: A list of specific comments, clearly indicating the file path, the exact line number, and the comment text.
   - Present this drafted review (both the summary and the proposed inline comments) to the user in the chat interface.
   - Explicitly ask the user for approval to publish the review via the GitHub CLI. **STOP HERE AND WAIT FOR USER APPROVAL.**

5. **Publish Review via GitHub CLI (Post-Approval)**:
   - Once the user explicitly approves, use the `gh` CLI to publish the comments to the respective line numbers.
   - For line-specific comments, use `gh api` to post them to the PR. For example:
     ```bash
     gh api repos/{owner}/{repo}/pulls/{pr_number}/comments \
       -f commit_id="{latest_commit_sha}" \
       -f path="{file_path}" \
       -f line={line_number} \
       -f side="RIGHT" \
       -f body="Your inline comment here"
     ```
   - For the overall summary, use `gh pr review --approve` (or `--request-changes` / `--comment`) with `--body "summary text"`.
   - Clean up any temporary files used.
   - Inform the user that the PR review and inline comments have been successfully submitted to GitHub.
