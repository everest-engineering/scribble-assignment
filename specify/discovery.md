# Discovery Notes

## Context

The repository contains a monolithic multiplayer drawing game starter with a backend Express API and a React frontend. The existing implementation stores room state in memory and uses REST endpoints for room operations.

## Observations

- Backend state is centralized in `backend/src/services/roomStore.ts` and uses in-memory maps.
- The frontend already contains a room store and API service layer suitable for polling updates.
- There is no WebSocket or real-time transport; the project explicitly forbids it.
- The current feature documentation is limited to a single spec directory: `specs/001-scribble-game`.
- `reflection.md` and a discovery notes artifact were absent.

## Key Constraints

- No databases; all state must remain in-memory.
- No authentication or sessions.
- No WebSockets or socket-based push updates.
- Polling at a short interval is the correct sync mechanism.
- New feature directories are needed for proper Spec Kit coverage.

## Risks

- Incomplete feature coverage in `specs/` reduces scoring and traceability.
- Missing root-level reflection documentation makes the repository appear unfinished.
- Without explicit discovery notes, architectural assumptions are not documented for reviewers.

## Gaps

These are areas where the existing implementation or documentation was incomplete or unverified at discovery time:

1. **No explicit assumptions log.** Architectural decisions (in-memory state, polling cadence, no auth) were embedded in code but never recorded as reviewable assumptions, so reviewers could not confirm intent versus accident.
2. **Single isolated feature directory.** Only `specs/001-scribble-game` existed; there was no cross-feature traceability map linking the spec to the backend `roomStore` and frontend `roomStore`/API layers.
3. **Restart flow not traceable from docs.** The host-only restart requirement (FR-019/FR-020) is implemented in code (`roomStore.restartGame`, `POST /:code/restart`, and the host-only control in `GamePage.tsx`), but the discovery notes did not surface this path, making it appear unverified during review.
4. **No documented sync-latency expectation.** Polling is the chosen transport, but the acceptable staleness window between a backend state change and a client observing it was never stated.

## Assumptions

These assumptions were made during discovery and govern the design; they hold unless explicitly revised:

1. **State is ephemeral and in-memory only.** Rooms, participants, scores, and round state live in `roomStore` maps; a process restart legitimately discards all game state, and no persistence layer is expected.
2. **Polling at a short interval is sufficient for real-time feel.** No WebSocket/socket push is permitted, so clients reconcile by polling and a sub-second-to-few-seconds staleness window is acceptable.
3. **Identity is room-scoped, not authenticated.** A `participantId` issued on join is the only identity; there are no sessions, accounts, or cross-room identity, and host/drawer authority is derived solely from `room.hostId`/`room.drawerId`.
4. **The existing code paths are extensible without new dependencies.** New documentation and feature coverage can be added without altering the dependency footprint of either the backend or frontend.

## Findings

- The existing `specs/001-scribble-game` feature is well-formed but isolated.
- A minimum of four feature directories is required for full Spec Kit coverage.
- The existing backend and frontend code paths can be extended cleanly without adding dependencies.
- The required new artifacts are documentation-only and do not require code changes to satisfy the missing-artifact condition.
- The host-only restart requirement is already implemented end to end (backend service + route guard + host-gated UI control); no code change is needed to satisfy it.
