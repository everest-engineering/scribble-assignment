# Research: Game Start & Drawer Flow

**Feature**: 002-game-start-drawer-flow | **Date**: 2026-05-30

## 1. Player name normalization

**Decision**: Trim leading/trailing whitespace on both client (Create/Join pages before submit)
and server (`createRoom` / `joinRoom` via shared `normalizePlayerName`). Reject empty post-trim
names with `400` and message `"Player name is required"` on backend; mirror message on client
before fetch.

**Rationale**: Spec FR-001–FR-004 require trim + reject empty at create/join. Dual-layer
validation matches Scenario 1 join-code pattern (client UX + server enforcement). Removes
reliance on `"Player"` default for omitted names now that names are required.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Client-only validation | Bypassable via direct API; fails FR-002/FR-003 server-side |
| Backend-only validation | Poor UX; unnecessary round trip for whitespace-only input |
| Keep `"Player"` default | Violates spec empty-name rejection |

## 2. Round state initialization at start

**Decision**: Extend internal `Room` with `drawerParticipantId: string | null` and
`secretWord: string | null`. Set both in `startRoom()`: drawer = `hostParticipantId`,
secret word = first entry in `STARTER_WORDS` (`"rocket"`).

**Rationale**: Spec Assumption: deterministic first-word selection; host-as-drawer. Storing
round fields on `Room` keeps a single in-memory aggregate; Scenario 3/4 can extend without
new storage layer.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Separate `Round` entity map | Over-engineered for single-round lab scope |
| Random word from list | Violates FR-013 and constitution determinism |
| Hash room code for word index | Unnecessary; spec documents first-word default |

## 3. Viewer-specific snapshot (secret word visibility)

**Decision**: Use existing `viewerParticipantId` on `toRoomSnapshot(room, viewerParticipantId)`.
Add snapshot fields: `drawerParticipantId`, per-participant `role`, and optional top-level
`secretWord` included **only** when viewer is the drawer. Omit `secretWord` key entirely for
guessers and unauthenticated GETs without `participantId`.

**Rationale**: FR-014/FR-015 require drawer-only word exposure. Viewer-scoped snapshot avoids
leaking the word in JSON responses poll clients receive. `participantId` query param already
used on `GET /rooms/:code`.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Single snapshot with word for all | Guessers could read network tab / state |
| Frontend hides word from shared field | Word still in payload; fails FR-015 |
| Separate `GET /rooms/:code/word` endpoint | Extra surface; word still needs auth-by-participantId |

## 4. Role assignment rule

**Decision**: On `startRoom`, assign `drawer` to `hostParticipantId`; all other participants
`guesser`. Expose `role` on each `ParticipantSnapshot` and derive `viewerRole` implicitly
from matching participant entry.

**Rationale**: Matches spec US3/US4 and README host-as-drawer rule. Roles are immutable for
the single round (no rotation in scope).

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| First join order drawer | Conflicts with spec host-as-drawer |
| Rotate drawer each round | Out of scope per constitution |

## 5. Game screen polling

**Decision**: Add `useEffect` + `setInterval(2000)` in `GamePage` calling
`roomStore.fetchRoomSilent()` while `room.status === "playing"`. Cleanup on unmount. Non-blocking
poll errors similar to lobby.

**Rationale**: FR-007 requires ~2s refresh on game screen so non-host clients stay synced on
roles after start. Reuses proven lobby pattern from Scenario 1.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Poll only in lobby | Guest may miss role/word UI updates after navigation |
| Global store polling | Couples all pages; lobby and game have different lifecycles |
| One-shot fetch on mount | Insufficient if host starts before guest navigates |

## 6. Zod schema changes for names

**Decision**: Replace optional `playerName` with `.string().transform(trim).pipe(min(1))` in
create/join schemas (or equivalent refine after transform).

**Rationale**: Aligns API validation with FR-001–FR-003; returns consistent 400 messages.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| `.optional()` with store default | Allows empty names through API |
