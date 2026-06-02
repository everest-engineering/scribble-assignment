# Research: Room Setup & Lobby

## Decisions

### Host Tracking Model
- **Decision**: Add `hostId: string` to the `Room` model. Store the creator's `participantId` on room creation.
- **Rationale**: Cleanest approach — the host is a first-class property of the room, not derived from participant ordering. The backend owns the source of truth.
- **Alternatives considered**: Derive host from first participant in the array (fragile if order changes), or add a `isHost` flag per participant (redundant since a room has exactly one host).

### Duplicate Name Disambiguation
- **Decision**: On join, check if the requested display name already exists among current participants. If so, append " (2)", " (3)", etc. to the stored name until unique. The disambiguated name is what other participants see.
- **Rationale**: Prevents confusion in guess history and scoring without rejecting valid join attempts.
- **Alternatives considered**: Reject duplicates (frustrating UX), allow raw duplicates (ambiguous history).

### Room Code Collision Strategy
- **Decision**: When generating a 4-character alphanumeric code, check against all active rooms. If a collision occurs, regenerate and retry.
- **Rationale**: 36^4 = ~1.7M combinations. In a lab environment with <10 active rooms, collisions are extremely rare but easy to handle. No need for larger codes.
- **Alternatives considered**: Expand to 6-character codes (overkill for scope), error to user (poor UX for rare event).

### Polling Mechanism
- **Decision**: Implement `setInterval`-based auto-polling in the `LobbyPage` component at ~2s intervals. Use `useEffect` with cleanup to start/stop polling on mount/unmount. Show a subtle loading indicator on failed polls but keep retrying.
- **Rationale**: Matches constraint (no WebSockets). Component-level polling is simpler than store-level and allows lobby-specific lifecycle control.
- **Alternatives considered**: Store-level polling with global interval manager (over-engineered for a single polling consumer).

### Host-Only Start
- **Decision**: Backend validates host identity on `POST /rooms/:code/start` using the `participantId` query parameter. Frontend hides the "Start Game" button for non-host participants and shows it disabled with a message when <2 players.
- **Rationale**: Two layers of enforcement — UX layer for immediate feedback, API layer for security.

## Testing Strategy

- **Backend**: Unit-test room creation, join, start logic with vitest. Mock the room store. Test duplicate name disambiguation and collision retry logic.
- **Frontend**: Component tests for LobbyPage polling lifecycle, CreateRoomPage/JoinRoomPage validation. Integration test via two-browser-tab flow.
- **E2E**: Manual validation using the acceptance scenarios from the spec (two browser tabs).

## Gaps & Assumptions

### Gaps (deferred or out of scope)
- **No room cleanup**: Rooms remain in memory indefinitely after the game ends. No timeout-based eviction for abandoned rooms.
- **No leave-room mechanism**: Participants cannot voluntarily leave a room once joined. The only way out is to navigate away.
- **No max participant limit**: Any number of players can join. No cap enforced at the API level.
- **No reconnection**: If a player closes their browser tab, their participant record stays in the room forever. No heartbeat or disconnect detection.
- **No room listing**: There is no API to list available rooms. Players must share the 4-character code out of band.
- **Error response consistency**: Error messages are human-readable strings rather than structured error codes, making programmatic handling fragile.

### Assumptions
- **Single-server**: All room state lives in a single Node.js process. No horizontal scaling, no load balancing, no shared state across instances.
- **Polling is sufficient**: 2-second polling is fast enough for lobby updates. Players will not notice the delay between a host starting the game and their lobby detecting the status change.
- **Network reliability**: The polling interval assumes intermittent failures are tolerable — a failed poll is silently retried with no exponential backoff or user-facing alert beyond a subtle status change.
- **Small scale**: The in-memory store assumes <100 concurrent rooms. No pagination, filtering, or indexing is needed for room lookups.
- **Names are not unique identifiers**: Player names are display-only. The backend uses `participantId` (UUID) for all identity checks. Name collisions are cosmetic.
