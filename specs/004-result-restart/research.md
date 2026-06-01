# Research: Result & Restart Flow

## Decision Summary

For Scenario 4, the result and restart flow should reuse the existing room snapshot polling mechanism. No new real-time transport is required. The finished round state can be included in the standard room snapshot returned by `GET /rooms/:code`.

## Rationale

- Reusing `GET /rooms/:code` avoids adding another data path for result state.
- The result state is naturally shared through polling, which fits the project's HTTP-only sync constraint.
- A host-only restart endpoint allows the backend to reset shared room state explicitly and consistently.

## Alternatives Considered

- Separate result endpoint (e.g. `GET /rooms/:code/result`): rejected because it would duplicate snapshot semantics and complicate client polling.
- Client-side restart-only handling: rejected because restart must be reflected on the shared room state for all active participants.
- Persisting results in a new `history` store: rejected because the in-memory room model already supports round lifecycle and does not need additional persistence.

## Conclusion

The chosen approach is to extend the room model with a `finished` game state and to add a restart API route. This keeps the implementation minimal, consistent with existing API patterns, and aligned with the project's polling-based sync model.
