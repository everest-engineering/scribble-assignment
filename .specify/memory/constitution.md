# Scribble Lab Constitution

## Core Principles

### I. TypeScript First
Every feature must be fully typed. Avoid `any`; prefer `unknown` for dynamic types.

### II. Match Existing Conventions
Follow the patterns already established in the starter: file structure, error handling, state management.

### III. Immutability
Prefer immutable data patterns. Use `structuredClone` or spread operators over direct mutation.

### IV. Fail Fast
Validate inputs at the boundary (Zod schemas on backend, form validation on frontend). Return clear error messages.

### V. Minimal Changes
Make the smallest change that satisfies acceptance criteria. Do not rewrite existing working code.

## Game Constraints

1. **Deterministic Selections** — Word selection and drawer assignment must use deterministic rules (index-based from sorted participants), not random.
2. **No Real-Time Sync** — All state updates use HTTP polling (~2s interval). No WebSockets, SSE, or push protocols.
3. **In-Memory Only** — All data lives in backend memory (Map). No databases or external storage.
4. **No Authentication** — No sessions, JWT, OAuth, or user accounts.

## Development Workflow

1. **Review Before Accepting** — Every AI suggestion must be reviewed for correctness, security, and alignment with the spec before committing.
2. **No Hallucinated APIs** — Do not use libraries not already in `package.json`.
3. **Validate Before Commit** — Run `npm run build` in both frontend and backend before committing.
4. **Manual Testing** — Test each scenario with two browser tabs to verify multi-player behavior.
5. **Commit Granularity** — Each commit represents one logical slice of work.

## Governance

This constitution supersedes ad-hoc practices. Amendments require documentation and approval.

**Version**: 1.0.0 | **Ratified**: 2026-06-07 | **Last Amended**: 2026-06-07
