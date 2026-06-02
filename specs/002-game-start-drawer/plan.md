# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer` | **Date**: 2026-06-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer/spec.md`

## Summary

Add a server-authoritative round to the room model. When the host presses
Start, the backend transitions the room from `lobby` to `playing`, designates
the host as the drawer, and selects a secret word deterministically from
`STARTER_WORDS` using the room code as the only input. The room snapshot is
filtered per viewer so the secret word is delivered only to the drawer's
session and never reaches any other client. Player names are trimmed and
empty/whitespace-only names are rejected at both API and UI boundaries.

Primary technical levers:

- Extend `RoomStatus` to `"lobby" | "playing"`; add `Round { drawerParticipantId, secretWord }` to `Room`.
- Add `POST /rooms/:code/start` (host-only, idempotent) and tighten the existing `:code/join` to reject when the room is `playing`.
- Filter `toRoomSnapshot` by `viewerParticipantId`: only the drawer's snapshot contains the `secretWord`; others receive `secretWord: null`.
- Pick a deterministic word selector: `STARTER_WORDS[sum(roomCode.charCodes) % STARTER_WORDS.length]`. Same code → same word forever.
- Tighten `createRoomSchema` / `joinRoomSchema` to require non-empty `playerName` after trim (FR-001, FR-002).
- Frontend: `LobbyPage` watches snapshot.status — when it flips to `playing`, navigate every tab to `/game`. `GamePage` renders the drawer indicator and either the secret word (drawer) or a fixed placeholder (guesser).

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js 18+, ES Modules
**Primary Dependencies**: Express 4, Zod 3 (backend); React 18, React Router 6, Vite 5 (frontend). No additions.
**Storage**: In-memory `Map<string, Room>` on the backend (existing). Client-side identity in browser `localStorage` (from Scenario 1).
**Testing**: Vitest 3 in both `backend/` and `frontend/`; jsdom on the frontend.
**Target Platform**: localhost development; modern evergreen browser.
**Project Type**: Web application — `backend/` + `frontend/`.
**Performance Goals**: Polling cadence remains 2 s (carried from Scenario 1); state transition visible to all participants within 3 s of Start (Spec SC-001); 0% non-drawer word leakage (SC-002).
**Constraints**: No DB, no WS, no auth/sessions, no new top-level deps (Constitution Principle II + Tech & Scope Constraints). Strict TS; no `any`. Zod at every boundary. Deterministic word selection — no `Math.random()` at draw time (Constitution Principle IV).
**Scale/Scope**: Lab-scale — single round per room; participant counts in the small handful.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Gate | Source | Status (Phase 0) | Status (Phase 1) |
|---|---|---|---|---|
| G1 | Every planned change traces to a US/FR/SC | Principle I | PASS — all changes map to US1–US2, FR-001…FR-014, SC-001…SC-008 | PASS |
| G2 | No out-of-scope items present | Principle II + Tech & Scope | PASS — no rotation, timers, multi-round, spectator, persistence, WS, auth | PASS |
| G3 | No new top-level deps | Principle II | PASS — Express, Zod, React, Router, Vite only | PASS |
| G4 | All API boundaries Zod-validated; no `any` | Principle III | PASS — name validation tightened; new start endpoint schema added | PASS |
| G5 | Deterministic / observable behavior across clients | Principle IV | PASS — word selector is pure function of room code; no `Math.random()` at draw | PASS |
| G6 | Self-review hooks in place | Principle V | PASS — granular commits per US, two-tab gate, both builds + tests | PASS |

No violations → Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── POST_rooms_code_start.md          # NEW endpoint for this feature
│   └── snapshot-visibility-rules.md      # Cross-endpoint contract: word filtering
├── checklists/
│   └── requirements.md  # Already exists from /speckit-specify
└── tasks.md             # Phase 2 output (later)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          # MODIFY — add POST /:code/start; block join when status === "playing"
│   │   ├── router.ts         # (unchanged)
│   │   ├── schemas.ts        # MODIFY — non-empty playerName after trim; new startRoomSchema
│   │   └── schemas.test.ts   # MODIFY — name validation + start schema cases
│   ├── models/
│   │   └── game.ts           # MODIFY — RoomStatus += "playing"; add Round; add currentRound to Room/RoomSnapshot
│   ├── services/
│   │   ├── roomStore.ts      # MODIFY — startRound (host-only, idempotent), deterministic selectWord, filter snapshot by viewerParticipantId
│   │   └── roomStore.test.ts # MODIFY — word determinism, drawer assignment, snapshot filtering, idempotency, late-join rejection
│   └── seed/starterData.ts   # (unchanged — STARTER_WORDS already used)
└── package.json              # (unchanged)

frontend/
├── src/
│   ├── services/
│   │   ├── api.ts            # MODIFY — add startGame(code, participantId); extend RoomSnapshot with currentRound
│   │   └── api.test.ts       # MODIFY — startGame request shape + snapshot filtering test
│   ├── state/
│   │   └── roomStore.ts      # MODIFY — startGame() action calls api and stores returned snapshot
│   ├── pages/
│   │   ├── CreateRoomPage.tsx # MODIFY — client-side trim + empty rejection
│   │   ├── JoinRoomPage.tsx   # MODIFY — same; already trims code in 001; now also trims name
│   │   ├── LobbyPage.tsx      # MODIFY — host's Start button calls roomStore.startGame; all tabs react to status === "playing" by navigating to /game
│   │   └── GamePage.tsx       # MODIFY — render drawer label; secret-word area is word for drawer, fixed placeholder for guesser
│   └── components/            # (unchanged — Card, RoomCodeBadge etc. stay generic)
└── package.json               # (unchanged)
```

**Structure Decision**: Same web app layout from Scenario 1. All changes are file-level edits inside the existing tree; no new directories, no new packages.

## Phase 0 — Outline & Research

See [research.md](./research.md). Summary of decisions:

- **Active state name**: `"playing"`. Forward-compatible with Scenarios 3/4.
- **Round shape on server**: `Room.currentRound: Round | null` where `Round = { drawerParticipantId: string; secretWord: string }`. Optional/nullable so `lobby`-state rooms have no round.
- **Snapshot visibility filter**: `toRoomSnapshot(room, viewerParticipantId)` returns `currentRound: { drawerParticipantId: string; secretWord: string | null }`. The `secretWord` is the real word only when `viewerParticipantId === drawerParticipantId`; otherwise it is `null`. The field key is always present (so the client doesn't need to detect absence) but the value is the secrecy carrier.
- **Deterministic algorithm**: `STARTER_WORDS[sumOfCharCodes(roomCode) % STARTER_WORDS.length]`. Pure function of room code; no `Math.random()`; satisfies Constitution Principle IV.
- **Endpoint**: `POST /rooms/:code/start` with body `{ participantId: string }`. Returns 200 + snapshot on success; 403 with "Only the host can start the game" if `participantId !== room.hostParticipantId`; 400 with "Need at least 2 players to start" if `participants.length < 2`; 404 with "Room not found" if unknown code; 200 + unchanged snapshot if already started (idempotent — see Idempotency Decision below).
- **Idempotency Decision**: Calling start on an already-`playing` room returns 200 + the existing snapshot (not 409). This matches FR-010 ("Start … MUST be a no-op") and lets the host's UI tolerate double-click without error UX.
- **Join rejection when playing**: `POST /:code/join` returns 409 with "Room is no longer open to new players" if the targeted room's status is `"playing"` (FR-012).
- **Name validation**: server tightens both `createRoomSchema` and `joinRoomSchema` to require a non-empty `playerName` after `.trim()`. Friendly message `"Enter your name"`. Client also trims and gates before submission so failed-by-server is a rare path.
- **Frontend transition trigger**: `LobbyPage` watches snapshot.status — if it ever flips to `"playing"`, navigate to `/game`. Host triggers the call; guests get the new status via polling and react within ~2 s. Removes the "Start Game just navigates" placeholder from 001's LobbyPage.

## Phase 1 — Design & Contracts

See [data-model.md](./data-model.md), [contracts/](./contracts/), and [quickstart.md](./quickstart.md).

Phase 1 artifacts:

- `data-model.md` — `RoomStatus` extension; `Round`; `Room.currentRound`; viewer-aware `RoomSnapshot.currentRound`; client mirror types.
- `contracts/POST_rooms_code_start.md` — request/response shapes, full error matrix, idempotency contract.
- `contracts/snapshot-visibility-rules.md` — cross-endpoint contract describing how `currentRound.secretWord` is filtered by `viewerParticipantId` on every snapshot endpoint (`POST /rooms`, `POST /:code/join`, `GET /:code`, `POST /:code/start`).
- `quickstart.md` — two-tab acceptance walkthrough mapping every SC to a click path.
- `CLAUDE.md` SPECKIT block updated to point at `specs/002-game-start-drawer/plan.md`.

## Data Flow Summary

```text
Lobby (host alone or with players):
  Start button rendered only when isHost && participants.length >= 2 (from 001)

Start (host tab):
  Host clicks Start
    -> roomStore.startGame()
    -> POST /rooms/ABCD/start { participantId: "host-id" }
    -> server: validates host, transitions status="playing", builds currentRound
       { drawerParticipantId: hostId, secretWord: deterministicWordFor("ABCD") }
    -> 200 { room: snapshotFor(host) }   // includes currentRound.secretWord
    -> store updates; host's LobbyPage detects status === "playing"
    -> navigate /game

Polling (any other tab in same room):
  setInterval(2000) -> GET /rooms/ABCD?participantId=guest-id
    -> server: returns snapshotFor(guest)
       currentRound: { drawerParticipantId: hostId, secretWord: null }
    -> store updates; LobbyPage detects status === "playing"
    -> navigate /game

GamePage (drawer):
  reads room.currentRound
    drawerParticipantId === participantId  →  show "You are the drawer" + secret word

GamePage (guesser):
  reads room.currentRound
    drawerParticipantId !== participantId  →  show drawer name + fixed placeholder

Late join (any time after status === "playing"):
  POST /rooms/ABCD/join {playerName: "Eve"}
    -> server: status === "playing" → HttpError(409, "Room is no longer open to new players")
    -> client: form__error renders "Room is no longer open to new players"
```

## Implementation Sequence

1. **Backend host-side data model**: extend `RoomStatus`; add `Round`; add `Room.currentRound`; add deterministic word selector. Update `roomStore.test.ts` to cover the new fields and selector.
2. **Backend filtered snapshot**: implement `toRoomSnapshot(room, viewerParticipantId)` filtering; add tests covering both drawer and non-drawer viewers and the unknown-viewer case.
3. **Backend Start endpoint**: `startRoom(code, participantId)` service function; `POST /:code/start` route with Zod schema; HttpError variants for host check, quorum check, idempotency.
4. **Backend join rejection on playing**: extend `joinRoom` to refuse non-`lobby` rooms; route maps to 409.
5. **Backend name validation**: tighten `createRoomSchema` and `joinRoomSchema` to require non-empty trimmed `playerName` with message `"Enter your name"`.
6. **Frontend types + api**: extend `RoomSnapshot` with `currentRound`; add `api.startGame(code, participantId)`.
7. **Frontend store**: `RoomStore.startGame()` action.
8. **Frontend LobbyPage**: wire host's Start button to `roomStore.startGame()`; add an effect that watches `room.status === "playing"` and navigates to `/game` on all tabs.
9. **Frontend GamePage**: render drawer indicator; render word for drawer, fixed placeholder for guesser.
10. **Frontend forms**: client-side trim + reject empty name in `CreateRoomPage` and `JoinRoomPage`.
11. **Tests**: drawer-only word visibility (frontend), GamePage rendering by role, LobbyPage transition effect, name-validation rejection paths.
12. **Validation**: both `npm run build`s; both `npm test`s; quickstart walkthrough.

## Risks

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| R1 | Snapshot filter regression leaks `secretWord` to non-drawer payload | Low | Snapshot filtering centralised in `toRoomSnapshot`; backend test asserts `secretWord === null` for non-drawer; frontend test asserts guesser UI never shows the word |
| R2 | Idempotent start gets misinterpreted as success-when-it-shouldn't | Low | Explicit acceptance test: starting an already-started room returns the unchanged snapshot, not a freshly generated word |
| R3 | Late-joiner sees stale "Join Room" form state and retries indefinitely | Low | Server response carries `message: "Room is no longer open to new players"`; client renders verbatim |
| R4 | Polling-based transition (~2 s) feels sluggish to the host who pressed Start | Low | Host's own response is synchronous (`POST /:code/start` returns the new snapshot); host nav happens immediately; only guests rely on polling |
| R5 | `Math.random()` seeps in via a misguided "make it random" tweak | Low | Test asserts `selectWord("ABCD")` returns the same word across 50 invocations; Constitution Principle IV cited in PR description |
| R6 | Trim removes intentional internal whitespace ("Alice  Smith") | None | Trim is `String.prototype.trim()`: removes only leading/trailing whitespace; internal preserved (spec edge case) |
| R7 | Drawer's snapshot accidentally cached in browser dev-tools shows `secretWord` to a screen-recording bystander | Accepted | Out of threat model — Constitution and spec acknowledge no auth/no sessions; dev-tools visibility is a known limitation |

## Testing Strategy

- **Backend unit (Vitest)**:
  - `selectWord(code)` is a pure function: identical output across N invocations for the same code; output is one of STARTER_WORDS.
  - `startRoom`: host-only (rejects non-host); quorum-gated (rejects <2); idempotent (second call returns identical snapshot, no re-selection); sets `currentRound.drawerParticipantId` to host id.
  - `toRoomSnapshot`: viewer === drawer → `currentRound.secretWord` non-null; viewer !== drawer → `currentRound.secretWord === null`; viewer absent or unknown → treated as non-drawer.
  - `joinRoom`: rejects when target room is `playing` (returns sentinel or null with reason; service distinguishes "not found" from "already started" so the route can pick 404 vs 409).
  - Schemas: `createRoomSchema` and `joinRoomSchema` reject empty/whitespace-only `playerName` with message `"Enter your name"`.

- **Frontend unit (Vitest + jsdom)**:
  - `api.startGame` sends `POST` to `/rooms/:code/start` with `{participantId}` body.
  - `RoomStore.startGame` updates state with the returned snapshot.
  - `LobbyPage`: when `room.status` transitions to `"playing"`, an effect calls `navigate("/game")` (both host and guest scenarios).
  - `GamePage`:
    - drawer viewer → renders the secret word string (any STARTER_WORDS value) and a "You're the drawer" indicator.
    - guesser viewer → renders the drawer's name and a fixed placeholder; the secret-word string is absent from the DOM.
  - `CreateRoomPage` and `JoinRoomPage` reject empty/whitespace-only name submissions on the client with a visible message.

- **Two-tab acceptance (manual)**: `quickstart.md` walkthrough — host starts; both tabs navigate; drawer sees word; guesser sees placeholder; late join blocked; idempotent re-press benign.

- **Build gate**: both `npm run build`s green; both `npm test`s green.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

No violations — nothing to track.
