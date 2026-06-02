<!-- Sync Impact Report: v1.0.0 → v1.1.0 -->
<!-- Modified Principles: none -->
<!-- Added: Technical Constraint "No Feature Branches" -->
<!-- Removed Sections: none -->
<!-- Templates Requiring Updates: -->
<!--   .specify/templates/plan-template.md → ✅ branch reference updated to same-branch -->
<!--   .specify/templates/spec-template.md → ✅ no principle-specific references -->
<!--   .specify/templates/tasks-template.md --><!-- ✅ no branch references -->
<!--   .specify/templates/checklist-template.md --><!-- ✅ no branch references -->
<!--   AGENTS.md → ✅ no constitution references -->
<!-- Follow-up TODOs: none -->

# Scribble Constitution

## Core Principles

### I. Clean Code & Atomic Commits
Code MUST be clean, readable, and adhere to project conventions. Commits MUST be small, atomic, and represent a single logical change. Each commit MUST build without errors. Commit messages MUST be meaningful and explain the rationale — not just the mechanic. Work-in-progress or fixup commits MUST be squashed before reaching main branches.

### II. Deterministic & Testable Game Logic
All game rules (scoring, word selection, drawer assignment, round transitions) MUST be deterministic given identical inputs. Game logic MUST be implemented in pure functions isolated from I/O (HTTP, canvas) wherever possible. Each acceptance scenario in the spec MUST have a corresponding test or manual validation procedure reproducible in two browser tabs.

### III. TypeScript Strictness
All code MUST be fully typed. The `any` type is FORBIDDEN — use `unknown` when the type is genuinely dynamic. The `tsconfig` strict flag MUST be enabled. The project MUST build with zero errors. Prefer `const` over `let` and immutable data structures over mutable ones.

### IV. Spec-Artifact Consistency
The constitution, spec, plan, and tasks artifacts MUST accurately reflect the current implementation state. Before writing code, update the relevant artifact to describe what will be built. After implementing, verify the artifact still matches. Deviations between code and spec MUST be documented in a commit message or artifact amendment before the change is merged.

### V. Brownfield Respect
Existing code MUST NOT be rewritten without explicit justification in the plan artifact. Changes MUST be minimal, targeted, and address only the feature requirement at hand. Out-of-scope features (WebSockets, databases, authentication, new state libraries, unrelated refactors) MUST NOT be implemented even if technically feasible.

## Technical Constraints

- **No WebSockets**: All client-server sync MUST use HTTP polling (no Socket.io, no WebSocket protocol).
- **No Databases**: All state MUST be stored in-memory only. Restarting the backend clears all state.
- **No Authentication**: No user accounts, sessions, JWT, or OAuth.
- **Tech Stack**: Backend — Node.js + Express + TypeScript + Zod. Frontend — React 18 + React Router 6 + Vite + TypeScript.
- **In-Memory Room Isolation**: Each room MUST be fully isolated. Room data MUST be cleaned up when no longer needed.
- **No New Top-Level Dependencies**: Do not add libraries beyond what the starter ships unless the plan artifact explicitly justifies the need.
- **No Feature Branches**: All incremental features MUST be developed on the same single branch. Per-feature branches MUST NOT be created. The repository uses a single long-lived branch for all work.

## Development Workflow

1. **Discovery** — Read relevant starter files, document gaps and assumptions.
2. **Specify** — Write or update the spec artifact with acceptance criteria.
3. **Clarify** — Resolve ambiguity before planning.
4. **Plan** — Update the plan artifact with state model, data flow, and file-level changes.
5. **Tasks** — Decompose the plan into ordered, testable work items.
6. **Implement** — Complete one meaningful slice at a time. Commit after each slice.
7. **Validate** — Verify acceptance criteria with two browser tabs. Run `npm run build` in both `backend/` and `frontend/`.
8. **Move forward** only after the current scenario passes.

## Governance

This constitution supersedes all informal practices and ad-hoc conventions. Amendments MUST be documented, versioned (semantic), and accompanied by a rationale. Every pull request MUST include a compliance check against these principles. Violations MUST be called out in review and either fixed or explicitly deferred with a documented reason.

**Version**: 1.1.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-06-01
