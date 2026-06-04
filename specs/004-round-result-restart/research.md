# Research: Round Result, Restart & Final Validation

**Feature**: `004-round-result-restart` | **Date**: 2026-06-04

---

## Decision 1 — `toRoomSnapshot` gating for `"finished"` status

**Decision**: When `room.status === "finished"`, `toRoomSnapshot` forwards `currentWord`
to ALL viewers regardless of `viewerParticipantId`. When `room.status === "playing"`, the
existing viewer-gating (`viewerParticipantId === room.drawerId`) remains unchanged.

**Rationale**: The result state is the reveal moment — all players must see the word.
Lifting the gate only when `status === "finished"` keeps the existing playing-state
behaviour intact while adding the new reveal behaviour with a single condition.

**Implementation**: Update the ternary in `toRoomSnapshot`:
```typescript
currentWord: room.status === "finished" || (viewerParticipantId === room.drawerId && room.drawerId !== null)
  ? room.currentWord
  : null,
```

---

## Decision 2 — `POST /:code/guess` auto-end behaviour

**Decision**: After computing `correct = true` and updating the score, set
`room.status = "finished"` before `saveRoom()`. This is a single-line addition in the
existing guess handler.

**Rationale**: FR-001 requires atomic status transition on correct guess. The guess
handler already has the room object in scope; setting status there is the most direct
implementation. No separate trigger mechanism is needed.

---

## Decision 3 — Manual end endpoint (`POST /:code/end`) vs restart endpoint

**Decision**: `POST /:code/end` is a lightweight endpoint that only sets `status = "finished"`
and calls `saveRoom()`. It does NOT clear any state (strokes, guesses, scores remain). The
`POST /:code/restart` endpoint handles all clearing logic.

**Rationale**: Separating "end" (mark finished, preserve data for result view) from
"restart" (clear data, return to lobby) is cleaner. If end also cleared data, the result
view would have nothing to show.

---

## Decision 4 — Frontend conditional rendering structure

**Decision**: `GamePage.tsx` uses three conditional branches based on `room.status`:
- `"lobby"` → Simplified lobby content (participant list, host-gated Start Game button)
- `"playing"` → Active game (canvas, guess form, etc. — existing Scenario 3 content)
- `"finished"` → Result view (correct word, scoreboard, guess history, host restart button)

**Rationale**: All three states share the same page context (polling, room code badge,
participant info). Keeping them in one component avoids state loss from navigation and
matches the clarification that no route change occurs.

---

## Decision 5 — Restart from `"playing"` (skipping end)

**Decision**: `POST /:code/restart` accepts `"playing"` OR `"finished"` status per FR-007.
If called from `"playing"`, it immediately clears round state and returns to lobby without
requiring an explicit end step.

**Rationale**: The spec explicitly allows this (edge case note: "host calls restart
directly (skipping end)"). It gives the host maximum flexibility to abort a round early.
