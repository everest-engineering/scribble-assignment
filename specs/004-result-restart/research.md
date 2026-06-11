# Research: Result, Restart & Final Validation

## Round-End Detection

**Decision**: Round ends only on host "Reveal & End Round" action. No auto-transition even if all guessers are correct.

**Rationale**: Host controls pacing — result screen only appears when host clicks reveal. Prevents premature round end.

**Alternatives considered**: Auto-transition when all correct (rejected — host never sees Reveal button); timer-based (rejected — unnecessary complexity).

## Result State Representation

**Decision**: New `"result"` RoomStatus value. Room status transitions: `"playing" → "result" → "lobby"`.

**Rationale**: Clean state machine; frontend can render distinct views based on `status` field alone. Follows existing pattern of status-driven rendering.

**Alternatives considered**: Flag on "playing" (rejected — ambiguous state); client-only (rejected — inconsistent across participants).

## Scoring Model

**Decision**: Use existing ephemeral scoring (100 pts per correct guess, computed from current round's guesses). No changes to scoring logic.

**Rationale**: Scores are per-round and cleared on restart. Existing `toRoomSnapshot()` already computes `scores` correctly.

## Restart Endpoint

**Decision**: New `POST /api/rooms/:code/restart` endpoint, host-only. Clears rounds array, resets status to `"lobby"`.

**Rationale**: Separate endpoint for clear semantics; matches existing pattern (`start`, `guess`, etc.).

## Polling Sync

**Decision**: Result state and restart transitions rely on existing 2-second GET polling. No new sync mechanism needed.

**Rationale**: The existing `GET /api/rooms/:code` returns `RoomSnapshot.status` — frontend switches views based on this field.
