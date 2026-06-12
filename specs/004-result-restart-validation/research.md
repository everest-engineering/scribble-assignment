# Research: Result, Restart & Final Validation

## Decision

Extend the existing room state model to support a `finished` status that exposes
result data (correct word, scores, guess history) to all players via the
existing polling mechanism. Add a host-only restart endpoint that transitions
the room back to the lobby with participants preserved.

## Rationale

- The existing room snapshot and polling architecture is already proven by
  Scenarios 1–3 and naturally extends to the result state.
- Adding a `finished` status is the minimal change: no new endpoints needed
  for result viewing (reuses existing GET /rooms/:code), only a restart
  endpoint is new.
- The state transition `playing → finished → lobby` matches the constitution's
  lifecycle requirement (Principle III).
- Host-only restart is consistent with Scenario 1's host-only start rule.

## Alternatives considered

- Separate result endpoint (`GET /rooms/:code/result`): rejected because the
  existing room snapshot already carries all needed state; a separate endpoint
  adds unnecessary surface area.
- Auto-restart after timeout: rejected because the spec requires explicit
  host action for restart.
- Allow any player to restart: rejected because Scenario 1 established
  host-only game control; restart is an extension of that authority.
- WebSocket-based result push: rejected because the constitution forbids
  real-time push protocols.

## Outcome

The chosen design preserves the current architecture, adds exactly one new
endpoint, and completes the round lifecycle defined in the constitution.
