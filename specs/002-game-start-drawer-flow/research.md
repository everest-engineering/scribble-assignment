# Research: Game Start & Drawer Flow

**Feature**: `002-game-start-drawer-flow`
**Date**: 2026-05-31

---

## 1. Name Trimming — Current State vs Required Behaviour

**Decision**: Trim server-side in Zod schema; also fix frontend to send trimmed value.

**Rationale**:
- `CreateRoomPage` and `JoinRoomPage` already check `playerName.trim()` before submit, so
  empty/whitespace submissions are blocked client-side. However, the raw (untrimmed) string
  is passed directly to the API call: `roomStore.createRoom(playerName)` and
  `roomStore.joinRoom(roomCode, playerName)`.
- `createRoomSchema` and `joinRoomSchema` use `z.string().min(1)`, which accepts
  whitespace-only strings (e.g. `"   "` has length > 0).
- `createParticipant` → `displayName(name)` returns `name || "Player"`, no trimming.
- **Fix**: Zod schemas → `.string().trim().min(1)` (validates and transforms; Zod's `.trim()`
  strips leading/trailing whitespace before the min-length check). Frontend pages send
  `playerName.trim()` to ensure the stored name matches what was validated.

**Alternatives considered**:
- Trim only on the frontend: not sufficient — backend accepts any `min(1)` string regardless.
- Trim only in `createParticipant`: would silently store "" after trimming, bypassing validation.
- Validate+trim in Zod (chosen): single enforcement point; Zod's `.trim()` transformer runs
  before validators, so `.string().trim().min(1)` rejects whitespace-only names and stores
  the clean value.

---

## 2. Single-Player Game Start

**Decision**: Remove the `participants.length < 2` guard from `startGame`.

**Rationale**:
- The spec explicitly states: "The game can start with a single player (the host as sole
  drawer); additional guessers are additive but not required."
- The current `startGame` returns `{ error: "insufficient-players" }` and 400 if
  `participants.length < 2`.
- The existing `LobbyPage` gate `canStart = isHost && room.participants.length >= 2` and
  the button label "Waiting for players… (need 2+)" both need to be updated to allow
  single-player start.

**Alternatives considered**:
- Keep the ≥2 guard: contradicts the spec's acceptance criteria (US1 verifiable with
  a single tab).

---

## 3. Deterministic Word Selection

**Decision**: `wordIndex = (roundNumber - 1) % STARTER_WORDS.length`

**Rationale**:
- Zero-based index into the word list derived from the 1-based round number.
- Round 1 → index 0 → "rocket" (first word). This is predictable and manually verifiable.
- `STARTER_WORDS` is a `readonly` tuple of 5 words; modulo wraps safely.
- No `Math.random()` involved — same inputs always produce the same output.
- Formula is stateless: requires only `roundNumber` and the word list — nothing else.

**Alternatives considered**:
- `roundNumber % STARTER_WORDS.length`: round 1 → index 1 → "pizza". Equally valid but
  less intuitive (round 1 skips the first word).
- Shuffled list stored on the `Room`: adds state that must be serialised; overly complex
  for the scope of this feature.

---

## 4. Viewer-Conditional `secretWord` in `RoomSnapshot`

**Decision**: `toRoomSnapshot(room, viewerParticipantId)` includes `secretWord` only when
the viewer is the current drawer; the field is omitted (not `null`) for all other viewers.

**Rationale**:
- `toRoomSnapshot` already accepts `viewerParticipantId` but ignores it (`void viewerParticipantId`).
- Omitting the field entirely (rather than setting `null`) prevents accidental exposure: a
  non-drawer client that receives `secretWord: null` still knows a secret word exists.
- The backend is the authoritative enforcement point; frontend rendering is a secondary concern.

**Alternatives considered**:
- `secretWord: null` for non-drawers: exposes field existence; easier to accidentally log/render.
- Separate `/rooms/:code/secret` endpoint: adds complexity and a second round-trip; not needed.

---

## 5. `POST /rooms/:code/start` — Viewer ID for Start Response

**Decision**: Pass the caller's `participantId` to `toRoomSnapshot` in the start route so the
host (who is always the round-1 drawer) receives `secretWord` in the start response.

**Rationale**:
- Currently the route calls `toRoomSnapshot(result.room)` without a viewer ID, so the
  returning snapshot has no `secretWord`.
- The caller is the host, who becomes the drawer for round 1. They need the word immediately.
- The `participantId` is already present in the validated `startGameSchema` body.

---

## 6. Round State Storage

**Decision**: Embed a `currentRound` object in `Room`; no separate `Round` collection.

**Rationale**:
- Only one active round at a time (round rotation is out of scope for this feature).
- Keeping state inside `Room` avoids a second in-memory collection and keeps `getRoom`/
  `saveRoom` unchanged.
- Shape: `{ roundNumber: number; drawerId: string; wordIndex: number }` — minimal, derivable,
  and testable.

**Alternatives considered**:
- Separate `rounds: Round[]` array on `Room`: overkill for a single active round.
- Separate `Map<string, Round>` store: unnecessary indirection.
