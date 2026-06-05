# Research: Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-05

## Overview

No NEEDS CLARIFICATION items exist in the Technical Context — the existing codebase already
provides all necessary primitives. This document records discovery findings and confirms
design decisions.

---

## Finding 1: `RoomStatus` Already Includes `"result"`

**Decision**: No change required to `backend/src/models/game.ts` or
`frontend/src/services/api.ts` for the status type.

**Evidence**:
```ts
// backend/src/models/game.ts (line 1)
export type RoomStatus = "lobby" | "playing" | "result";

// frontend/src/services/api.ts (line 1)
export type RoomStatus = "lobby" | "playing" | "result";
```

Both the backend model and the frontend API service already declare `"result"` as a valid
`RoomStatus` value. The type is in sync — Principle II is pre-satisfied for this field.

**Rationale**: The type was added during an earlier planning session with Scenario 4 in mind.
No migration or rename is required.

---

## Finding 2: `toRoomSnapshot` Redaction Pattern Is Extensible

**Decision**: Modify the single `if` guard in `toRoomSnapshot` to include an additional
condition for `status === "result"`.

**Current code** (`backend/src/services/roomStore.ts`):
```ts
if (room.drawerId && viewerParticipantId === room.drawerId) {
  snapshot.secretWord = room.secretWord;
}
```

**Target code**:
```ts
if (room.status === "result" || (room.drawerId && viewerParticipantId === room.drawerId)) {
  snapshot.secretWord = room.secretWord;
}
```

**Rationale**: The word is always set when a game starts (Scenario 2). In `"result"` status
it should be visible to all players; in `"playing"` status it is visible only to the drawer.
This is a one-line change that does not touch any other snapshot fields.

---

## Finding 3: `endRoom` and `restartRoom` Are Additive Functions

**Decision**: Add two new exported functions to `roomStore.ts`. No existing functions need
to be modified beyond `toRoomSnapshot`.

**Rationale**: `startRoom` (Scenario 2) established the pattern: validate host identity,
mutate the in-memory room, persist, return snapshot. `endRoom` and `restartRoom` follow
the same pattern with different mutations.

**`restartRoom` field resets**:
| Field | Reset value |
|-------|-------------|
| `status` | `"lobby"` |
| `drawerId` | `undefined` |
| `secretWord` | `undefined` |
| `guesses` | `[]` |
| `scores` | `{}` |
| `canvasData` | `null` |
| `participants` | unchanged |
| `hostId` | unchanged |

---

## Finding 4: `GamePage` Polling Can Detect Both Transitions

**Decision**: Extend the existing `setInterval` callback in `GamePage` to check for
`status === "lobby"` (restart) and navigate accordingly. No new polling hook or endpoint
is needed.

**Current behaviour**: Polling fetches room snapshot every 2 s; on 404, navigates to `/`.
On error, shows inline message.

**Extended behaviour**: After a successful fetch, additionally check:
```ts
if (updated?.status === "lobby") {
  clearInterval(id);
  navigate("/lobby");
}
```

**Rationale**: The existing polling mechanism already owns the transition logic (404 →
redirect to start). Adding a `"lobby"` status check is symmetric with how `LobbyPage`
handles `status !== "lobby"` → navigate to `/game`.

---

## Finding 5: `RoundResultsView` Should Be a New Component, Not an Inline Block

**Decision**: Extract a dedicated `RoundResultsView` component rendered as an early
return from `GamePage` when `room.status === "result"`.

**Alternatives considered**:

| Approach | Verdict |
|----------|---------|
| Inline JSX block inside `GamePage` return | Rejected — `GamePage` is already 180 lines; inlining results view would push it past 300 and mix two distinct screen states in one render tree |
| Separate route `/game/results` | Rejected — adds a new route entry and requires router-level state threading; spec says "in place of the gameplay view" |
| Reuse `ResultPanel` for guess history | Not adopted — `ResultPanel` uses title "Activity" and empty-state "No guesses yet." which differ from the results view requirements (FR-007: "No guesses were submitted.") |
| Reuse `Scoreboard` for score list | Not adopted — `Scoreboard` renders participants in join order; results view requires descending sort |

**Rationale**: A new component keeps each screen state's JSX self-contained, makes the
early return in `GamePage` readable, and avoids conditional prop-threading into existing
components.

---

## Finding 6: Score Sort Is a Pure Frontend Concern

**Decision**: Sort scores in `RoundResultsView` using `[...room.participants].sort(...)`.
The backend returns scores in the existing `Record<string, number>` format unchanged.

**Rationale**: The sort is display-only. Adding sort logic to `toRoomSnapshot` or a new
backend endpoint would couple a presentation concern to the API contract. The frontend
already has participant IDs and scores available in the snapshot.

---

## Finding 7: No New npm Dependencies Required

All required functionality is available in the existing stack:
- `Array.prototype.sort` for descending score sort
- `React.useState` / `useEffect` for component state
- Existing `useRoomState` / `useRoomStore` hooks for data access
- `useNavigate` for navigation

**Confirmed**: no new `package.json` entries in either `backend/` or `frontend/`.
