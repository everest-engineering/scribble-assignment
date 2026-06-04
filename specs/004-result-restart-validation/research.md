# Research

## 1. Shared result state in the same room snapshot

- Decision: Extend the pollable room snapshot with a distinct result state that carries the final revealed word, guess history, and final scores to every viewer.
- Rationale: The project already uses HTTP polling as the synchronization mechanism. Reusing the same snapshot keeps the client simple and avoids introducing a second result channel.
- Alternatives considered: A separate result endpoint or a one-off restart payload. Rejected because they would duplicate state and complicate reconnect behavior.

## 2. Host-only restart as an HTTP mutation

- Decision: Expose restart as a host-only `POST` action that returns the updated room snapshot.
- Rationale: Restart is a room mutation, not a read. A single mutation endpoint keeps validation and authorization in one place and lets the frontend refresh immediately from the response.
- Alternatives considered: Client-side state reset only, or a polling-only restart trigger. Rejected because the backend must remain authoritative for room lifecycle changes.

## 3. Preserve players, clear round state

- Decision: Keep the current participant list and room membership on restart, but clear round-specific data and reset scores for the next match.
- Rationale: The spec explicitly requires players to remain in the room without re-entering names or room codes. Clearing only round state preserves continuity while preventing stale data from leaking into the next round.
- Alternatives considered: Recreate the room from scratch or eject all players to a fresh lobby. Rejected because both violate the restart requirement.

## 4. Final word visible to all players in result state

- Decision: Treat the secret word as globally revealed once the round enters the result state.
- Rationale: The feature requires every connected player, including guessers who missed it, to see the same final word during the result panel.
- Alternatives considered: Keeping the word drawer-only until restart. Rejected because it hides the required final answer from guessers.

## 5. Reuse existing polling loop for the lobby return

- Decision: Keep the current 2-second polling flow as the mechanism that moves all players from result back to lobby after restart.
- Rationale: Polling already drives cross-tab sync in the app, and the constitution forbids push transports. Reusing it keeps the change bounded.
- Alternatives considered: WebSockets, SSE, or a custom refresh broadcast. Rejected by constitution and current architecture.
