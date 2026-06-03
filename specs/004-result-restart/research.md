# Research: Result, Restart & Final Validation

## Decision 1: Room Status Extension — Adding `"ended"`

**Decision**: Extend the `status` union from `"lobby" | "active"` to `"lobby" | "active" | "ended"`. The `"ended"` state is entered when the host calls `POST /rooms/:code/end` and exited when the host calls `POST /rooms/:code/restart` (returning to `"lobby"`).

**Rationale**: A third status value is the smallest possible model change that correctly captures the round-over state. All existing status guards (`status === "active"`, `status === "lobby"`) remain valid; adding `"ended"` simply creates a new branch in the existing conditional logic without touching the happy-path flows. Alternative approaches (a boolean `roundEnded` flag, or repurposing `"lobby"` as the result state) would either add redundant state or break the existing lobby navigation.

**Alternatives considered**:
- Boolean `roundEnded` on Room: rejected — creates two-field state that must be kept in sync; `status` already encodes room lifecycle, so a third value is more coherent.
- Reuse `"lobby"` for result display, distinguish by a separate flag: rejected — the result screen and the lobby are distinct UX destinations; conflating them adds complexity to every status guard in the frontend.

---

## Decision 2: Word Reveal in `"ended"` State via `toRoomSnapshot`

**Decision**: The existing `toRoomSnapshot(room, viewerParticipantId?)` function already nulls out `currentWord` for non-drawers when the room is `"active"`. For the `"ended"` state, skip the nulling and always return `room.currentWord` in the snapshot.

**Rationale**: Word privacy only serves gameplay — guessers must not know the word while guessing. Once the round is over, revealing the word is the expected product behaviour (and is explicitly required by FR-009). Adding a status check to the existing `toRoomSnapshot` conditional is a one-line change with no side effects on active gameplay.

**Alternatives considered**:
- A separate `revealedWord` field on RoomSnapshot: rejected — unnecessary duplication; `currentWord` already holds the value and the reveal is just a visibility change, not a data change.
- Returning the word only in the `/end` response, not in subsequent polls: rejected — players who join a tab after the round ends (or who poll after a brief disconnect) would not see the word.

---

## Decision 3: Host-Only Endpoint Authorization

**Decision**: Both `/end` and `/restart` endpoints verify that `participantId === room.hostId`. Any other caller receives a 403. No separate auth token is needed — `hostId` is already stored on the `Room` model from Feature 001.

**Rationale**: The constitution bans authentication sessions; host identity is established by the room's `hostId` field set at creation time. Re-using the same pattern already used by `POST /rooms/:code/start` keeps authorization consistent across all host-gated actions.

**Alternatives considered**:
- Allow any player to end the round: rejected — spec FR-001 and FR-005 are explicit that only the host controls round start/end/restart.
- Separate moderator role: rejected — out of scope per the constitution (no moderation features).

---

## Decision 4: Result UI as Conditional Render Inside `GamePage`

**Decision**: Rather than adding a new `/result` route and `ResultPage.tsx`, render the result UI conditionally inside the existing `GamePage` when `room.status === "ended"`. The navigation guard is updated to treat `"ended"` as a "stay on page" condition alongside `"active"`.

**Rationale**: The game screen already has access to all the data needed for the result view (`room.guesses`, `room.scores`, `room.participants`, `room.currentWord`) and already imports `Scoreboard` and `ResultPanel`. Adding a conditional branch avoids creating a new route entry, a new page file, and new session-restore logic for the result state. The session-restore behaviour for `"ended"` is already covered by the existing GamePage restore flow.

**Alternatives considered**:
- New `ResultPage.tsx` at `/result` route: rejected — requires adding a new React Router route, new session-restore logic, and new navigation guards; the marginal separation of concerns does not justify the added complexity for this lab scope.
- Redirect to lobby automatically after a delay (no host restart): rejected — constitutionally, timers are out of scope; the host must control when the lobby is re-entered.

---

## Decision 5: Restart Clears All Round State

**Decision**: `POST /rooms/:code/restart` resets `currentWord = null`, `drawerId = null`, `strokes = []`, `guesses = []`, `scores = {}`. Participants are preserved. The room transitions to `"lobby"` status.

**Rationale**: This mirrors the pre-game state exactly — participants are present but no round data exists — so the host can immediately start a new round via the existing `POST /rooms/:code/start` flow. Scores reset to `{}` (empty) rather than `{ id: 0 }` because the `startRoom` handler re-initializes all scores when the next round begins; there is no need to carry zeroed scores across to the lobby.

**Alternatives considered**:
- Preserve scores across restarts (cumulative scoring): rejected — the constitution explicitly lists "multiple rounds, drawer rotation" as out of scope; cumulative scoring implies multi-round state.
- Drawer stays assigned across restart: rejected — drawer selection happens in `startRoom`; resetting `drawerId` ensures the next round's drawer assignment is fresh.
