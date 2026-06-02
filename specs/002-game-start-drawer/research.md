# Phase 0 Research: Game Start & Drawer Flow

**Feature**: 002-game-start-drawer
**Date**: 2026-06-02

The spec arrived with zero NEEDS CLARIFICATION markers and a thorough
assumptions list, so Phase 0 is about locking implementation-pattern
decisions that the plan needs before Phase 1 can produce contracts.

## Decision: Active-state name

**Decision**: Extend `RoomStatus` from `"lobby"` to `"lobby" | "playing"`.

**Rationale**:
- `"playing"` is the most natural label for the single in-progress state
  introduced by this feature. It does not commit to any particular sub-state
  (drawing vs result), so Scenarios 3 and 4 can either reuse it (continuing
  to use `currentRound` shape) or add further states without renaming.
- A single string union keeps the type system simple and lets the frontend
  branch with `room.status === "playing"` without a flag bag.

**Alternatives considered**:
- `"in_progress"` / `"active"` — synonymous; chose the shorter, more
  domain-tinged word.
- A flags object (`{ phase: "round", subphase: "drawing" }`) — premature
  for a single-round lab scope.

## Decision: Round shape and placement

**Decision**: `Room.currentRound: Round | null` where
`Round = { drawerParticipantId: string; secretWord: string }`. `null` while
status is `"lobby"`; non-null once status transitions to `"playing"`.

**Rationale**:
- The drawer designation and the secret word are inseparable lifecycle
  partners — both are created on Start and both should die or recycle if a
  future scenario adds round rotation. Bundling them in a `Round` shape
  documents that coupling once.
- Nullable instead of optional so TypeScript narrowing forces the consumer
  to handle the `lobby` case explicitly. This catches the easy mistake of
  reading `room.currentRound!.secretWord` when the room hasn't started.

**Alternatives considered**:
- Flat fields on `Room` (`drawerParticipantId?`, `secretWord?`) — fewer
  characters but loses the lifecycle coupling.
- A separate `rounds: Round[]` array — over-engineered for a single-round
  scope; Scenarios 3/4 may revisit if they ever extend.

## Decision: Snapshot visibility filter

**Decision**: `toRoomSnapshot(room, viewerParticipantId)` returns
`currentRound: { drawerParticipantId: string; secretWord: string | null } | null`.
`secretWord` is the real word only when
`viewerParticipantId === room.currentRound.drawerParticipantId`; otherwise
it is `null`. The field key is always present so the client doesn't have to
distinguish "the room hasn't started" from "I'm not the drawer" by field
absence — `currentRound: null` means lobby; `currentRound.secretWord: null`
means I'm a guesser.

**Rationale**:
- Server-side filtering is the only way to satisfy Spec SC-002 ("0 non-drawer
  participants see any portion of the secret word in any UI region, network
  payload, or browser developer-tools panel"). UI-only hiding would leak the
  word in the response body, dev-tools, and HAR exports.
- Centralising the filter in `toRoomSnapshot` means every endpoint that
  returns a snapshot (POST /rooms, POST /:code/join, GET /:code, POST
  /:code/start) gets the same treatment with one code path and one test
  target.
- Carrying `secretWord` as `string | null` (rather than omitting the field)
  keeps the JSON schema stable for the client; the client always reads
  `room.currentRound?.secretWord` and gets `null` when it isn't allowed to
  know.

**Alternatives considered**:
- Omit `secretWord` entirely from non-drawer snapshots — breaks JSON schema
  stability; clients would need branchy parsing.
- Use a separate "drawer-only" endpoint — adds a moving part and a second
  auth path; the snapshot path is already authenticated by participant id.
- Use the existing `getRoom` endpoint to also return `secretWord` if the
  caller provides matching `participantId` — that IS the chosen approach.

## Decision: Deterministic word selector

**Decision**: `selectWord(code) = STARTER_WORDS[sumOfCharCodes(code) % STARTER_WORDS.length]`.

**Rationale**:
- Pure function of the room code. No `Math.random()`. Satisfies Constitution
  Principle IV ("secret-word selection MUST be deterministic from room
  state").
- `sumOfCharCodes` is trivial to implement (`[...code].reduce((acc, c) => acc + c.charCodeAt(0), 0)`)
  and easy to test exhaustively over the 26⁴ keyspace if desired.
- Produces good distribution over 5 starter words for the practical room
  codes used in the lab. Codes `AAAA`, `ABCD`, `ZZZZ` all map to different
  indices.

**Alternatives considered**:
- `roomCode.charCodeAt(0) % WORDS.length` — too easily clustered (a code
  starting with `A` always picks index 0 mod 5 = 0 → `rocket`). Predictable
  in a bad way.
- A cryptographic hash (`sha256(code)`) — overkill; pulls in
  `node:crypto.subtle` patterns that aren't needed at lab scale.
- Hash of `code + roomCreatedAt` — would break determinism across server
  restarts and across the spec's "same room → same word forever" requirement.

## Decision: POST /rooms/:code/start endpoint shape

**Decision**: `POST /rooms/:code/start` with JSON body `{ participantId: string }`. Returns 200 + `{ room: snapshot }` on success.

**Rationale**:
- The participant id identifies the caller; the server validates
  `participantId === room.hostParticipantId` (only the host may start). This
  preserves the no-auth, no-session constraint — the id is just an opaque
  string the server already issued to the caller at create-time.
- Returning the full snapshot saves the host an extra poll and lets the
  host's tab transition to `/game` immediately without waiting on the
  polling tick.
- Sending `participantId` in the request body (not a query parameter)
  matches how `playerName` is sent on `POST /rooms` and join; consistent.

**Error matrix**:

| Condition | Status | `message` |
|---|---|---|
| Code not found | 404 | `"Room not found"` |
| Empty body / missing `participantId` | 400 | `"Invalid request payload"` (Zod default) |
| `participantId !== hostParticipantId` | 403 | `"Only the host can start the game"` |
| `participants.length < 2` | 400 | `"Need at least 2 players to start"` |
| Already `playing` and caller IS the host | 200 | unchanged snapshot (idempotent) |
| Already `playing` and caller IS NOT the host | 403 | `"Only the host can start the game"` (host check runs before idempotency check) |

**Alternatives considered**:
- GET with `participantId` as a query string — semantically wrong (the call
  has side effects).
- Returning 204 (no body) — forces an extra fetch on the host's tab.
- 409 Conflict for the already-started case — would force the host's tab
  to special-case "I already pressed Start" as an error condition. FR-010
  prefers no-op semantics.

## Decision: Join rejection while playing

**Decision**: `joinRoom(code, name)` distinguishes three return values: a
successful `{ room, participantId }`, `null` for "not found", and
`{ error: "room-not-open" }` for "already started". The route maps the
sentinel to 409 with `"Room is no longer open to new players"`.

**Rationale**:
- The route handler needs to pick 404 vs 409 based on the reason. A
  three-way return is the lightest-weight signal that doesn't reach for
  exceptions in the service layer.
- 409 Conflict is the right HTTP status for "resource exists but its state
  forbids this operation" — better than 403 (which implies auth) or 400
  (which implies a malformed request).
- The user-visible message is the spec's exact phrasing.

**Alternatives considered**:
- Reuse `null` for both not-found and not-open — loses the reason, forces
  the route to look up the room a second time.
- Throw `HttpError` from inside `joinRoom` — moves HTTP coupling into the
  service layer; preferring to keep services HTTP-free.

## Decision: Player name validation surface

**Decision**: Tighten `createRoomSchema` and `joinRoomSchema` to require
non-empty `playerName` after `.trim()`, with the message `"Enter your name"`.
Additionally, both `CreateRoomPage` and `JoinRoomPage` validate locally
before submission so the server message is rarely shown.

**Rationale**:
- Server tightening is the authoritative gate; the UI tightening exists for
  responsiveness, not security (per Constitution Principle III, the API
  boundary is where validation must live).
- The current Scenario-1 schemas accept optional `playerName`. The plan
  changes this without touching anything else in those flows.
- `"Enter your name"` matches the imperative tone of `"Enter a room code"`
  from Scenario 1 — terminology consistency for FR-014.

**Alternatives considered**:
- Server tightening only — UX feels laggier; users who hit submit on an
  empty field would see a roundtrip-delayed error.
- A separate `playerNameSchema` shared between create and join — fine, but
  the inline declarations stay short enough that the duplication is
  cheaper than the indirection.

## Decision: Frontend transition trigger

**Decision**: In `LobbyPage`, add an effect that watches
`room?.status === "playing"`. When true, call `navigate("/game", { replace: true })`.
The host's tab triggers the call through `roomStore.startGame()` and
re-renders with the updated snapshot immediately; guests' tabs see the
status change via their next poll (`useLobbyPolling`) and trigger the
same effect.

**Rationale**:
- A single transition trigger covers both the host and the guests; no
  separate code paths.
- `replace: true` avoids a "Back" button taking the user back to a stale
  Lobby view after they've already started.
- This decouples the polling cadence from the start latency: the host's
  navigation happens synchronously on response; guests' navigation happens
  on the next poll, which the spec accepts within 3 s.

**Alternatives considered**:
- Have the host call `navigate` directly in the click handler and rely on
  polling alone for guests — duplicates the transition logic.
- Add a fresh "transitions" subscription on the store — overkill for one
  binary condition that already lives on every snapshot.

## Decision: GamePage rendering by role

**Decision**: On `GamePage`, derive `isDrawer = !!room?.currentRound && participantId === room.currentRound.drawerParticipantId`.
Drawer-only branch renders the secret word in a clearly labeled "Your word"
region. Non-drawer branch renders the drawer's display name (looked up via
`participants`) and a fixed placeholder (`"Waiting for the drawer to begin…"`),
chosen so the placeholder text does not encode the word's length.

**Rationale**:
- Mirrors the same `isHost` derivation pattern from Scenario 1, keeping the
  code style consistent and the test surface predictable.
- The placeholder is a constant string (not e.g. blanks `_ _ _ _ _ _` whose
  count would leak word length). Satisfies FR-007 explicitly.

**Alternatives considered**:
- Render the word in a `<details>` element behind a click — adds friction
  for the drawer; not requested.
- Show partial reveal blanks — explicitly forbidden by FR-007.

## Open questions

None. All Phase 0 unknowns are resolved. Ready for Phase 1.
