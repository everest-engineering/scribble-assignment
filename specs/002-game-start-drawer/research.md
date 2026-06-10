# Research: Game Start & Drawer Flow

## Decision 1: Viewer identity for secret-word filtering

**Decision**: Use the existing `participantId` query parameter (already accepted by `GET /rooms/:code`) to identify the requesting player. Look up that participant in the room, compare their name to `drawerName`, and include `secretWord` in the snapshot only when they match.

**Rationale**: The frontend already sends `participantId` on every poll via `api.fetchRoom(code, participantId)` and `roomStore.pollRoom()`. No new identity mechanism is needed. The `toRoomSnapshot` function already receives `viewerParticipantId` — it is currently unused (`void viewerParticipantId`) but the plumbing is already there.

**Alternatives considered**:
- Pass player name directly as a query parameter — rejected: participantId is already the identity token used throughout; name is mutable and not a reliable key.
- Session token / auth header — rejected: out of scope per constitution (no authentication layer).

---

## Decision 2: Where to store drawerName and secretWord on the Room model

**Decision**: Add `drawerName: string` and `secretWord: string` as optional fields on the `Room` interface in `backend/src/models/game.ts`. They are absent while the room is in "lobby" state and present once started.

**Rationale**: The in-memory `Room` object is the single source of truth. Keeping these fields on the room (rather than a separate game-state object) is consistent with the existing flat model and avoids a second Map or lookup.

**Alternatives considered**:
- Separate `GameState` interface — rejected: adds indirection without benefit given the project's small scope and in-memory-only constraint.

---

## Decision 3: How `POST /rooms/:code/start` identifies the response viewer

**Decision**: The start endpoint does not receive a `participantId`; it returns a `RoomSnapshot` without `secretWord`. The drawer receives their secret word on the next poll (which does carry `participantId`).

**Rationale**: The start action transitions state; the snapshot it returns confirms the transition. The drawer's identity is only needed for secret-word filtering during polling. Keeping start request simple avoids overloading the endpoint.

**Alternatives considered**:
- Include `participantId` in the start request body and return a viewer-filtered snapshot — rejected: unnecessary complexity; polling already handles this within 2 seconds.

---

## Decision 4: Name-trimming validation at start time

**Decision**: In `startGame`, iterate `room.participants` and reject if any `participant.name.trim() === ""`. Return HTTP 400 with a descriptive message.

**Rationale**: Constitution requires all user-supplied strings to be trimmed and whitespace-only values rejected. The join/create endpoints already enforce this via Zod schemas, so this is a defensive check for any data-integrity edge case.

---

## Decision 5: `RoomStatus` union expansion

**Decision**: Extend `RoomStatus` in `backend/src/models/game.ts` from `"lobby"` to `"lobby" | "playing"` and mirror the same change in `frontend/src/services/api.ts`.

**Rationale**: The frontend type duplicates the shape of the backend model. Both must be updated together. TypeScript strict mode ensures any unhandled status case surfaces as a compile error.

---

## Decision 6: Frontend navigation on game start (clarified 2026-06-10)

**Decision**: The host's "Start Game" button calls `POST /rooms/:code/start`; on a successful response the host is immediately navigated to `/game` via React Router. Non-host players' existing 2-second polling loop in `LobbyPage` checks the polled room's `status`; when `"playing"` is detected the lobby navigates them to `/game` automatically. The `RoomStore` needs an `api.startRoom()` method to call the new endpoint.

**Rationale**: Immediate navigation for the host removes a 0–2 s perceived lag after clicking. Non-host auto-navigation via polling reuses the already-implemented poll infrastructure without introducing new push mechanisms (WebSockets are out of scope). The `LobbyPage` already has a `navigate` reference and `roomStore`, so both wiring points are low-effort.

**Alternatives considered**:
- All players (including host) navigate via polling — rejected: host would wait up to 2 s after their own click, which is a confusing UX.
- Navigation is out of scope for this feature — rejected: the spec explicitly requires transition to the game screen.

---

## Decision 7: Secret word display on the GamePage (clarified 2026-06-10)

**Decision**: `GamePage.tsx` reads `room.secretWord` from the store. When the field is present (i.e., the current player is the drawer), display it in the existing "Player Info" card alongside name and status. When absent (guessers), the card shows nothing for that field.

**Rationale**: `room.secretWord` is already conditionally populated by the server — no additional state or API call is needed. The "Player Info" card is the natural home for drawer-specific information and avoids adding a new UI component.

**Alternatives considered**:
- Display in a dedicated "Your word" card — rejected: adds a UI component with no benefit at this scope; the existing card handles it cleanly.
- Secret word only in API, not displayed in UI — rejected: spec (FR-013) and clarification Q2 require it to be visible to the drawer in the game screen.
