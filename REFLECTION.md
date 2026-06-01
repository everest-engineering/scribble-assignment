# Reflections — Features 001–005

This document summarizes what the repository originally provided, what features were added across phases 001–005, the design decisions made, how AI/tools were used in the process, and the main tradeoffs.

Source material used: `FINDINGS.md` and `spec.md` files under `specs/001-frontend-env-config/` through `specs/005-round-end-restart/`, plus the associated plans, tasks, and research notes.

## What the app originally had

- A monorepo with a TypeScript Express backend and a React+Vite frontend (see `FINDINGS.md`).
- UI scaffolding for game screens: static canvas placeholder, guess form, scoreboard and results placeholders, lobby and pages — but many interactive features were unimplemented.
- Backend in-memory room store and Zod validation skeletons, seed data in `seed/starterData.ts`.
- No WebSockets (HTTP polling only) and no database persistence; the repo intentionally relied on in-memory state.
- Missing or incomplete flows that were targeted across features: environment config, room hosting & lobby, drawer assignment & word visibility, guess sync, results view, and restart semantics.

## What each phase added

- Phase 001 — Frontend environment configuration
  - Developer-facing environment presets and a lightweight local validation utility so front-end API endpoints and feature flags are configurable and validated.
  - Documentation and onboarding guidance to avoid committing secrets and to reduce setup time.

- Phase 002 — Room hosting & lobby
  - Create/join room APIs and UI; unique room codes; host assignment on creation.
  - Lobby polling (≈2s) for participant updates and host-only start-game gating (requires ≥2 players).
  - Room isolation and cleanup semantics for empty rooms.

- Phase 003 — Drawer selection & word visibility
  - Player name trimming and validation (client+server).
  - Deterministic drawer assignment and deterministic secret-word selection (room seed + round index).
  - Server-side enforcement that only the drawer can retrieve the round secret word.

- Phase 004 — Drawer & guess sync
  - Guess submission API with trimming, validation, case-insensitive comparison, scoring (+100 correct), and persisted per-room guess history.
  - Drawer canvas state persisted in room state for drawer rehydration; polling endpoints to sync guess history and canvas state.

- Phase 005 — Round end & restart
  - `lastRoundSummary` model and `GET /rooms/:code/last-round-summary` to surface concluded-round data.
  - `POST /rooms/:code/restart` to clear per-round state while preserving room roster and scores.
  - `ResultsPage` UI displaying final word, scores, and full guess history; `Return to Lobby` flow and short reconnect reconciliation window for near-immediate rejoins.
  - Blocking integration and timing tests covering restart semantics and results persistence prior to lobby rebuild.

See `specs/*/tasks.md` for per-phase checklists and test-first requirements.

## Cross-phase decisions and rationale

- Environment config and validation (Phase 001)
  - Rationale: fixes the known frontend config bug and improves developer onboarding and reproducibility.

- Polling (global constraint)
  - Rationale: repository constitution forbids WebSockets; polling is used for lobby/guess sync and result reconciliation.

- Deterministic word selection & drawer assignment (Phase 003)
  - Rationale: reproducible tests and fair, predictable gameplay for debugging and CI.

- Preserve players & scores on restart, clear transient round state (Phase 005)
  - Rationale: preserve UX continuity while preventing secret leakage into subsequent rounds.

- Reconnect reconciliation window (Phase 005)
  - Rationale: allow short disconnects to rejoin preserved slots; tuned by tests (3–10s suggested).

## AI / Tooling usage

- Repository tooling (speckit/agents and Copilot-like helpers) was used to scaffold specs, plans, tasks, and tests across phases; these tools accelerated writing acceptance criteria and test templates.
- Test-first workflow enforced with `vitest` and React Testing Library; many spec tasks require failing tests before implementation.
- Developer commands and quickstart examples were produced for local verification (`npm run dev`, sample `curl` commands for API endpoints).

Note: this reflection documents repository artifacts and decisions; it does not imply external production systems or cloud AI services made runtime changes.

## Tradeoffs and limitations

- In-memory state (pros/cons)
  - Pros: straightforward, fast for local dev and tests; easy to implement restart semantics and deterministic selection.
  - Cons: no persistence across process crashes or restarts; not suitable for production reliability or horizontal scaling.

- Polling vs WebSockets
  - Pros: adheres to project constraints and simplifies server design.
  - Cons: higher latency, more client complexity (polling intervals, reconciliations), and inefficiency compared to push-based real-time.

- Reconcilation window sizing and player-preservation semantics
  - Short window improves UX for quick reconnects but risks re-adding players who intentionally left; long windows increase memory overhead and edge-case complexity.

## Suggested next steps

- Add a brief note to the repo README describing in-memory limits and expected behavior after server process crashes.
- Run the full test-suite locally and in CI to validate timing-sensitive integration tests (particularly restart timing and lobby rebuild windows).
- If production durability is required, design a migration to a persistent store with explicit session reconciliation and durable room metadata.

---

Document generated from FINDINGS.md and specs/001–005 on 01 June 2026.
