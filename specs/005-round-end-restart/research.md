# research.md — Round End Restart

## Decisions

- Decision: Implement a dedicated results page in the frontend to display the correct word, final scores, and full guess history.
  - Rationale: The product currently lacks a results view; building a clear UI reduces confusion and makes restart behavior testable.
  - Alternatives considered: Overlay modal, ephemeral toast messages. Rejected because they don't present the full guess history or persistent review affordance.

- Decision: Preserve player roster and scores across host-triggered restarts (in-memory) for the lifetime of the room.
  - Rationale: Users expect continuity across restarts; this avoids punitive score resets.
  - Alternatives considered: Full room recreation on restart. Rejected to preserve UX and reduce annoyance.

- Decision: Clear all per-round transient state (drawing canvas, active guesses, timers) on restart.
  - Rationale: Ensures next round starts fresh and no secrets leak.

- Decision: Define a short reconiliation/reconnect window (3–10s) for handling reconnecting players during restart.
  - Rationale: Balances UX with implementation simplicity; exact duration to be tuned in implementation and tests.

## Open Questions (NEEDS CLARIFICATION)

- None in the specification; implementation details (CSS, exact layout) can be decided during frontend tasks.

## Implementation Notes

- Frontend: add `ResultsPage` component under `frontend/src/components` or `frontend/src/pages` with props: `word`, `finalScores`, `guessHistory`, `onReturnToLobby()`.
- Backend: expose an endpoint (or extend existing room API) to return the last round's summary for a room (word, scores, guesses) and an endpoint to trigger restart.
- Tests: add vitest + React Testing Library tests for the `ResultsPage` UI and integration tests for restart flow in `backend/src/api` (or `frontend` polling behavior).
