# Research: Result, Restart & Final Validation

## Decision 1: Room State Machine Design

- **Decision**: Extend room `status` to a 4-state enum: `"lobby"`, `"playing"`, `"round_end"`, `"game_over"`. The `"finished"` status from spec 003 is replaced by `"round_end"` for rooms that support multi-round play.
- **Rationale**: Each state maps to a distinct UI view (lobby, game screen, results, final standings). The state machine is linear: `lobby` → `playing` → `round_end` → (back to `lobby` for next round, or `game_over` after final round). Simple to implement as a status string on the Room model with transition guard conditions.
- **Alternatives considered**: Boolean flags per state (combinatorial explosion, ambiguous), single `"finished"` terminal state (can't support multi-round), separate state machine class (over-engineering for 4 states).

## Decision 2: Game Session & Round Tracking

- **Decision**: Add `roundCounter` (number) and `maxRounds` (number) fields to the Room model. `maxRounds` is set to `participants.length` when the first round starts. `roundCounter` increments by 1 on each new round. `roundCounter >= maxRounds` gates the "Start New Round" action.
- **Rationale**: Simple integer counters. No separate GameSession entity needed — all session state lives on Room, which is already the game root aggregate. Resets on room creation.
- **Alternatives considered**: Separate GameSession model (more complex indirection, no real benefit), computed max from participant count each time (participant list is locked, but eager capture avoids ambiguity).

## Decision 3: Drawer Rotation Algorithm

- **Decision**: Store `currentDrawerIndex` (number) on Room. On new round start, compute `nextIndex = (currentDrawerIndex + 1) % participants.length`. The participant at that index becomes the drawer. If that participant has left (shouldn't happen since participants list is locked mid-session), skip to the next index.
- **Rationale**: Deterministic round-robin. Join order determines initial drawer index (0 = first to join). Each participant draws exactly once in N rounds. Wrap-around handles arbitrary participant counts.
- **Alternatives considered**: Random assignment (violates determinism principle), alphabetical rotation (join order is more natural and predictable), last-drawer-wins tracking (more state, equivalent result).

## Decision 4: Word Selection & Cycling

- **Decision**: Store `wordIndex` (number) on Room. On new round start, set `nextWordIndex = (wordIndex + 1) % WORDS.length`. Before committing, verify the selected word differs from the previous round. If not, advance by 1 again.
- **Rationale**: Simple cyclic index through the 5-word starter list. Skip-back check prevents consecutive repeats. Over 5+ rounds, words naturally repeat (which is acceptable per spec assumptions).
- **Alternatives considered**: Random selection (non-deterministic), shuffled list (more complex state, same outcome), track-used-words set (not needed since recycling is allowed).

## Decision 5: Lobby Return Endpoint

- **Decision**: `POST /rooms/:code/return-to-lobby` with body `{participantId}`. Host only. Transitions room from `round_end` to `lobby`. Returns `{transitioned: true}`. On failure (403 if not host, 409 if wrong state), returns error. Participants see the transition on their next room state poll.
- **Rationale**: Simple server action that changes the room status. The existing polling mechanism handles delivery to all clients without push. Same pattern as `end-round` from spec 003.
- **Alternatives considered**: Auto-return after timeout (removes host control, spec says host controls progression), GET-based trigger (non-RESTful).

## Decision 6: Start New Round Endpoint

- **Decision**: `POST /rooms/:code/start-round` with body `{participantId}`. Host only. Validates `roundCounter < maxRounds`. Transitions `lobby` → `playing`. Selects new drawer and word, resets per-round state (canvas, guesses), increments `roundCounter`. Returns `{started: true}`. If final round was just completed, the next transition from `round_end` goes to `game_over`.
- **Rationale**: Single endpoint handles all new-round setup. Consolidates FR-007 (drawer rotation), FR-008 (word selection), FR-009 (state reset). Server-side logic ensures deterministic state.
- **Alternatives considered**: Separate endpoints for each setup step (chatty, violates atomicity), frontend-driven setup (inconsistent state risk).

## Decision 7: Final Standings (`game_over`)

- **Decision**: When the last round ends (`roundCounter >= maxRounds` after round end), the room transitions to `game_over` instead of `round_end`. The room snapshot includes `finalStandings: Array<{participantId, name, score, rank}>` sorted by score descending. No further actions are available except leave.
- **Rationale**: Terminal state with no return path. Final standings computed server-side from cumulative scores. Embedding in the existing room snapshot avoids a dedicated endpoint.
- **Alternatives considered**: Computed standings client-side (inconsistent if scores differ across clients), dedicated standings endpoint (unnecessary overhead).

## Decision 8: Leave Room Endpoint

- **Decision**: `POST /rooms/:code/leave` with body `{participantId}`. Any participant can leave from `round_end`, `lobby`, or `game_over` states. If the leaving participant is the host, transfer host to the remaining participant with the lowest join index. If the leaving participant was the drawer in the current round and the room is in `playing` state, the request is rejected (drawer cannot leave mid-round per spec 003).
- **Rationale**: Simple removal from participant list. Host transfer uses deterministic rule (first remaining by join order). Rejecting mid-round departure for drawer prevents game disruption.
- **Alternatives considered**: Drawer can leave mid-round (causes round end — adds complexity, spec didn't define this), host-only leave (spec says any participant).

## Decision 9: Host Transfer on Leave

- **Decision**: When the host leaves, scan remaining participants ordered by `joinedAt` (join order) and assign `hostId` to the first participant in the list. The new host sees host controls on their next poll. If no participants remain, the room can be garbage-collected.
- **Rationale**: Deterministic transfer. Join order is the natural priority. First-joined participant becomes the de facto leader, consistent with room creation semantics.
- **Alternatives considered**: Random assignment (non-deterministic), vote-based (over-engineering), drawer-takes-over (mixes roles).

## Decision 10: Poling Integration for State Transitions

- **Decision**: All state transitions (`round_end` → `lobby`, `lobby` → `playing`, etc.) are reflected through the existing `GET /rooms/:code` polling endpoint. The frontend reads `room.status` and conditionally renders the appropriate view. No new polling loops are introduced.
- **Rationale**: The existing polling infrastructure already delivers the room snapshot. Adding the status field extension is sufficient. The frontend reacts to status changes naturally on each poll tick.
- **Alternatives considered**: Dedicated state endpoints (duplication), event-based notification (violates polling constraint).
