# Research: Game Rounds

## 1. Role-Based Word Visibility via `toRoomSnapshot`

**Decision**: Use the existing `viewerParticipantId` parameter in `toRoomSnapshot` to control word visibility.

**Rationale**: The function already accepts `viewerParticipantId` but currently ignores it (`void viewerParticipantId`). Since the drawer needs to see the word and guessers must not, we use this parameter to:
- Look up the viewer's role in the participants list
- If viewer's role is `"drawer"`, include `word` in the snapshot
- If viewer's role is `"guesser"` (or unknown), set `word` to `undefined`

**Alternatives considered**:
- Adding a separate endpoint for word retrieval — unnecessary, the snapshot endpoint already exists
- A separate `word` query parameter — would require more client-side logic

## 2. Role Assignment in `startGame`

**Decision**: The host (`room.hostId`) is always the drawer. All other participants are guessers. Roles are stored on the `Participant` model as an optional field.

**Rationale**: Spec assumption states "The host (room creator) is assigned as the drawer for the first round (out of scope for multi-round or rotation for v1)". This maps directly to using `room.hostId`.

**Implementation**: In `startGame`, after setting `status = "playing"` and selecting a word, set `participant.role`:
```
participant.role = participant.id === room.hostId ? "drawer" : "guesser"
```

**Alternatives considered**:
- Random selection — too complex for v1, violates spec assumption
- Round-robin — unnecessary for single-round v1

## 3. Existing `role` Field on `ParticipantSnapshot`

**Decision**: Populate the existing `role: ParticipantRole | null` field in `toRoomSnapshot` when the room status is `"playing"` or `"finished"`.

**Rationale**: The field already exists but is always set to `null`. The model doesn't need changes — just the snapshot mapping logic.

## 4. Game Page Polling

**Decision**: Mount the existing `pollRoom` mechanism on `GamePage` via the same `useEffect` pattern used in `LobbyPage`.

**Rationale**:
- The `pollRoom` method already fetches the room state from `GET /rooms/:code`
- Once roles and word are populated on the room snapshot, polling will automatically propagate them
- No new API endpoints needed
- Consistent with the existing polling architecture

**Implementation**: Add a `useEffect` in `GamePage.tsx` that polls on mount (2s interval, same as lobby) and clears on unmount.

**Alternatives considered**:
- No polling on game page — would require a separate state push mechanism, which violates Constitution III
- Different poll interval — unnecessary, 2s is fine for game state updates

## 5. `RoomSnapshot` Word Field

**Decision**: Add `word?: string` to the frontend `RoomSnapshot` type.

**Rationale**: The snapshot currently doesn't expose `word` in the frontend type. For the drawer to see the word, it must be included when the viewer is the drawer.

## 6. FR-012 "Deterministic" Word Selection

**Decision**: Treat "deterministically from the starter word list" as "sourced from the starter word list" (the set of candidate words is deterministic and fixed). Continue using `Math.random()` for actual selection.

**Rationale**: The existing `startGame` already uses `Math.random()` to pick from `STARTER_WORDS`. Changing to a deterministic algorithm would be a refactor beyond the scope of this feature. The real intent of FR-012 is to ensure words come from the canonical word list.

## 7. Edge Cases

- **Drawer disconnects during round**: The room transitions to `"finished"` status, remaining players see a "Drawer disconnected" message. Implemented via `POST /rooms/:code/leave` endpoint: if the leaving participant is the drawer and the room is `"playing"`, set status to `"finished"`.
- **Empty word list**: The `STARTER_WORDS` array has 5 entries and is hardcoded. An empty-list guard could be added but is not required for this feature.
- **Player count drops below 2 during game**: After the game starts, no minimum player enforcement is needed per the spec. The game continues.
