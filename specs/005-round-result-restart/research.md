# Research: Round Result & Restart

## Research Tasks

All technical context is known from the constitution and prior features. No NEEDS CLARIFICATION markers exist. Research confirms existing patterns and best-fit approaches.

### Task 1: Round end detection strategy

**Decision**: Auto-detect round end in `submitGuess` when all non-drawer participants have correctly guessed. Also provide `POST /:code/round/end` for manual ending (e.g., future timer integration).

**Rationale**: The spec defines round end as "all guessers guessing correctly" — this is a deterministic check that can be computed inline. A manual endpoint allows external triggers (timer, admin action) without coupling.

**Alternatives considered**: Pure polling-based detection (frontend polls and calls end endpoint). Rejected — server-side detection is more reliable and immediate.

### Task 2: Result state data model

**Decision**: Reuse existing `Round` entity in terminal state. No new "RoundResult" entity needed. `room.status` transitions `"playing"` → `"result"`, and the existing `room.currentRound` fields (`word`, `guesses`, `scores`) serve as the result payload.

**Rationale**: The `Round` already contains all fields required by the result screen. Duplicating data into a separate result entity adds synchronization complexity with no benefit.

**Alternatives considered**: New `RoundResult` entity with immutable snapshot. Rejected — unnecessary complexity; `currentRound` is effectively immutable once the round ends.

### Task 3: Restart mechanism

**Decision**: `POST /:code/restart` — sets `room.status = "lobby"`, clears `room.currentRound`, preserves `room.participants`. Only host can call.

**Rationale**: Simplest path to spec compliance. Preserving participants and resetting round state directly mirrors the spec's "players preserved and all round state cleared."

**Alternatives considered**: Re-create room with same code (rejected — unnecessary overhead); soft-reset with generation counter (rejected — over-engineered for this scope).

### Task 4: Result screen word visibility

**Decision**: In `"result"` status, `currentWord` is included in the snapshot for ALL players, not just the drawer.

**Rationale**: The round is over — there is no fairness concern. The spec requires all players see the correct word (FR-002).

**Alternatives considered**: Only show word to drawer (rejected — contradicts spec).

### Task 5: Frontend routing

**Decision**: New `/result` route. `LobbyPage` and `GamePage` navigate to `/result` when `room.status === "result"`. `ResultPage` navigates to `/lobby` when status returns to `"lobby"` after restart.

**Rationale**: Clean separation of concerns. Each page handles one screen state. The existing navigation guards in LobbyPage (which checks for `"playing"` status) and GamePage (which renders only for `"playing"` status) naturally handle transitions.

**Alternatives considered**: Inline result panel on GamePage (rejected — would make GamePage overly complex); single-page state machine (rejected — router-based navigation is established pattern).
