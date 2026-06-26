# Research: Game Start & Drawer Flow

## Unknowns Resolved

### 1. sessionStorage Key Names and Strategy

**Decision**: Use keys `scribble_roomCode` and `scribble_participantId`. Store raw string values (no JSON wrapping).

**Rationale**: Simple key-value storage avoids serialization overhead. The prefix `scribble_` avoids collisions with other apps on the same origin. Values are written on successful create/join and read on GamePage mount. Cleared when the user navigates away (navigates to "/" or "/lobby").

**Alternatives considered**:
- Single JSON blob: More complex to read/write individual fields.
- localStorage: Persists beyond tab session. Not desirable — a new tab should not auto-join a room.

**Fallback**: If sessionStorage is unavailable (private browsing in some older browsers), the app still functions — the page refresh scenario simply won't restore state. No crash. This is acceptable for a lab project.

### 2. SC-006 and SC-010 Timing — Polling vs. Single Fetch

**Decision**: SC-006 and SC-010 reference "2 seconds" which was inherited from the polling-based lobby scenario. Since game-state polling is deferred, these success criteria are interpreted as:
- **SC-006**: Drawer identity is visible as soon as the GamePage renders after a successful single fetch (typically under 500ms).
- **SC-010**: Refresh recovery completes within the time of a single fetch + render cycle (typically under 1s on localhost). The 2-second bound is a generous upper limit.

**Rationale**: The spec's clarification states "Single fetch on GamePage mount is sufficient for this scenario." The 2-second window is still achievable via fetch + render latency.

### 3. startGame POST Response — viewerParticipantId Passing

**Decision**: The `startGame` POST handler MUST pass `playerId` (from request body) as `viewerParticipantId` to `toRoomSnapshot()`. This ensures the drawer who started the game receives the secret word in the response.

**Rationale**: FR-018 requires the secret word in snapshots for the drawer. The start game caller (who is the host/drawer) should immediately see their word.

**Current code gap**: `rooms.ts:89` calls `toRoomSnapshot(updatedRoom)` without `viewerParticipantId`. The `void viewerParticipantId` in `toRoomSnapshot()` then drops the word. Both need fixing.

### 4. Canvas Placeholder Behavior

**Decision**: The canvas placeholder remains a non-interactive `div` for both drawer and guesser views. For guessers, it displays "Waiting for [drawer name] to draw...". For the drawer, it displays "Draw your word here" (or similar neutral placeholder). The canvas itself is static in this scenario.

**Rationale**: The spec's assumptions explicitly state "The canvas remains a non-interactive placeholder in this scenario." Interactive drawing tools are a separate, later scenario.

### 5. GamePage Navigation Signal

**Decision**: The lobby polling detects `status === "playing"` and navigates to `/game`. The GamePage reads room data from the store. On mount, it fetches room state once (for refresh recovery). No WebSocket or push mechanism needed.

**Rationale**: This is how Scenario 1 already works — the lobby polling in LobbyPage transitions to GamePage when status changes.

## Existing Implementation Analysis

### Current `startGame()` (roomStore.ts:94-103)
- Only sets `room.status = "playing"`
- Needs to also set `room.currentRound = 1`, `room.drawerId = room.hostId`, `room.secretWord = STARTER_WORDS[0]`

### Current `toRoomSnapshot()` (roomStore.ts:111-121)
- `void viewerParticipantId` — ignores the parameter entirely
- Needs to conditionally include `secretWord` when `viewerParticipantId === room.drawerId`
- Needs to add `currentRound` and `drawerId` to the snapshot

### Current `Room` interface (game.ts)
- Missing: `currentRound`, `drawerId`, `secretWord`
- `RoomSnapshot` missing: `currentRound`, `drawerId`, `secretWord?`

### Current `startGame` route (rooms.ts:88-90)
- Calls `toRoomSnapshot(updatedRoom)` without `viewerParticipantId`
- Needs to pass `playerId` as `viewerParticipantId`

### Current GamePage (GamePage.tsx)
- Shows static "Round 1" and "Guess the Word!" regardless of drawer/guesser
- Canvas placeholder shows "Waiting for drawer..." always
- No differentiation between drawer and guesser views
- No sessionStorage read on mount

## Test Patterns

- Backend tests use Vitest `describe`/`it`/`expect` with direct calls to service functions
- Frontend API tests mock `fetch` using `vi.stubGlobal` / `vi.mocked`
- Tests are co-located in `__tests__/` dirs or alongside source files with `.test.ts` extension
