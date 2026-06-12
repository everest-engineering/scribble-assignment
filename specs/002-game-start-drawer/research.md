# Research: Game Start — First Round Drawer & Secret Word

## Decisions

### Secret Word Visibility in API
- **Decision**: `GET /rooms/:code` returns `currentWord: string | null` in `RoomSnapshot`. It is populated with the actual word when the requesting `participantId` matches `drawerId`; otherwise it is `null`.
- **Rationale**: This keeps the API contract simple (one field, always present) while enforcing the secrecy requirement at the server boundary. The field is never omitted, so clients can rely on its presence.
- **Alternatives considered**: Separate `/drawer-word` endpoint (rejected — adds surface area and requires extra auth check); word omitted entirely for guessers (rejected — less explicit for type contracts).

### Drawer Identification
- **Decision**: `RoomSnapshot` exposes `drawerId: string | null`. Each client computes `isDrawer` locally by comparing its stored `participantId` to `drawerId`.
- **Rationale**: Avoids duplicating identity logic on the server and keeps the snapshot minimal. The backend does not add an `isDrawer` boolean field.
- **Alternatives considered**: `roles` array on snapshot (rejected — spec clarifications explicitly replace it with `drawerId` for the first round).

### Room Reset on Host Leave
- **Decision**: When `removeParticipant` detects the host is leaving and the room status is `playing`, it immediately sets `status = "lobby"`, `drawerId = null`, and `currentWord = null`.
- **Rationale**: The host is the drawer in the first round. If they leave, the round cannot continue. Resetting to lobby aligns with spec edge-case #1 and Constitution Principle II (clean up round state).
- **Alternatives considered**: Transfer drawer role to next host and continue round (rejected — only one round is implemented; no mechanism exists to re-assign a word mid-round).

### Polling in Game Screen
- **Decision**: `GamePage` uses the same ~2s `setInterval` + `fetchRoom` pattern already used in `LobbyPage`.
- **Rationale**: Consistent with Constitution Principle III (HTTP Polling Only) and the existing polling architecture. Keeps all clients synchronized for room state changes (e.g., host leaving mid-round).
- **Alternatives considered**: No polling in game screen (rejected — clients would not detect host-leave resets or future state changes).

### Word Selection Strategy
- **Decision**: First round always uses `STARTER_WORDS[0]` (`rocket`).
- **Rationale**: Spec clarification #1 requires deterministic behavior. Using the first element is the simplest deterministic strategy.
- **Alternatives considered**: Random selection (rejected — violates deterministic requirement); round-robor index tracking (rejected — unnecessary overhead for a single round).

## Unknowns Resolved

All technical context items were resolved from the existing starter codebase and the 001 feature artifacts. No external research required.
