# Scribble Assignment Constitution

## Core Principles

### I. TypeScript Strictness
All code MUST be fully typed. Avoid `any`; use `unknown` for dynamic types. Every function signature MUST have explicit parameter and return types.

### II. REST-Only Communication
All sync MUST use HTTP polling. No WebSockets, Socket.io, or any real-time push protocol.

### III. In-Memory State Only
All data lives in memory. No databases (SQL, NoSQL, SQLite, etc.). Restarting the backend clears all state.

### IV. No Authentication
No auth, sessions, JWT, OAuth, or accounts of any kind.

### V. Validation First
Use Zod for all request payload validation on the backend. Validate at the boundary — reject early with clear error messages.

### VI. Deterministic Game Rules
Word selection, role assignment, and scoring MUST be deterministic given the same inputs.

## AI Usage Rules

1. Review ALL AI-generated output before committing. Do not trust it blindly.
2. AI MUST NOT add dependencies not justified by the spec.
3. AI MUST NOT rewrite existing working code unless the spec requires it.
4. Each AI-generated change MUST be traceable to a specific acceptance criterion.

## Review Discipline

1. Test every scenario with two browser tabs before declaring it done.
2. Each commit must represent one logical slice of work.
3. Granular commits only — no monolithic "implement everything" commits.
4. Code MUST match the spec. Deviations MUST be documented in reflection.

## Governance
This constitution supersedes all other ad-hoc practices. Amendments require documenting the rationale. The constitution MUST be re-read before starting each implementation phase.

**Version**: 1.0.0 | **Ratified**: 2026-06-04
