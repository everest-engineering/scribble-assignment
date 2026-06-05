# Discovery Notes

Inspection of the Scribble starter before writing any specs, plans, or code.
The goal is to understand the brownfield app as-is, record what is incomplete,
state the assumptions I will carry into the spec, and list the files each
feature group will touch.

## How I inspected

- Ran the happy path in two browser tabs (create room, join room, manual refresh).
- Read the backend route handlers, room store, models, schemas, and seed data.
- Read the frontend pages, the room state store, the API client, and the game
  screen components.

## 1. Incomplete behaviors (gaps)

These are behaviors the business scenarios require but the starter does not
implement.

### Gap 1 — No host concept
- `Room` has no host field, so nothing records who created a room.
- `createRoom` adds the creator as a normal participant with no special status.
- Evidence: `backend/src/models/game.ts` (Room interface), `backend/src/services/roomStore.ts` (`createRoom`).
- Impact: Scenario 1 (host-only start) and Scenario 2 (host becomes drawer) cannot work.

### Gap 2 — No automatic lobby polling
- The lobby only updates when the user clicks "Refresh Room"; there is no timer.
- Evidence: `frontend/src/pages/LobbyPage.tsx` (`handleRefresh` is only called on click; no `setInterval`).
- Impact: Scenario 1 requires the lobby to refresh via polling (~2s).

### Gap 3 — Player name validation is missing
- Empty or whitespace-only names are silently converted to `"Player"`.
- The Zod schema treats `playerName` as optional with no trim or min length.
- Evidence: `backend/src/services/roomStore.ts` (`displayName` returns `name || "Player"`), `backend/src/api/schemas.ts` (`createRoomSchema`, `joinRoomSchema`).
- Impact: Scenario 2 requires names to be trimmed and empty names rejected with a message.

### Gap 4 — Game screen is entirely placeholder
- The `/game` route renders, but every panel is static UI.
- Canvas is a styled `<div>` reading "Waiting for drawer...".
- Guess form's submit handler only calls `preventDefault()`.
- Scoreboard shows a hard-coded "0"; ResultPanel shows static text.
- Evidence: `frontend/src/pages/GamePage.tsx`, `frontend/src/components/GuessForm.tsx`, `frontend/src/components/Scoreboard.tsx`, `frontend/src/components/ResultPanel.tsx`.
- Starter roles (drawer, guesser) exist in seed data but are never assigned.
- Room snapshots are not viewer-specific; all participants currently receive identical room data.
- Impact: Scenarios 3 and 4 (drawing, guessing, scoring, results) are unbuilt.

### Gap 5 — "Start Game" is client-side navigation only
- The lobby's Start button just calls `navigate("/game")`.
- There is no backend start endpoint, no host gate, and no 2-player minimum.
- Evidence: `frontend/src/pages/LobbyPage.tsx` (Start button), `backend/src/api/rooms.ts` (only create/join/get routes exist).
- Impact: Scenario 1 requires host-only start once at least 2 players are present.

### Gap 6 — Seed data and roles are sent but never used
- `availableWords` and `roles` are included in every snapshot but no logic
  assigns roles or selects a secret word.
- `toRoomSnapshot` receives `viewerParticipantId` but ignores it (`void viewerParticipantId;`),
  so every viewer gets an identical snapshot.
- Evidence: `backend/src/services/roomStore.ts` (`toRoomSnapshot`), `backend/src/seed/starterData.ts`.
- Impact: Scenario 2 requires deterministic word selection and drawer-only word visibility.

## 2. Assumptions

Decisions I am making where the brief leaves room for interpretation. These
will be reflected in the specs and revisited if implementation contradicts them.

1. **Polling interval ≈ 2 seconds.** Both lobby and active game will sync through
   periodic `GET /rooms/:code` calls, never WebSockets (out of scope).
2. **The room creator is the host, and the host is the drawer for the single round.**
   The brief says "host (or first player)"; creator-as-host keeps it deterministic.
3. **Deterministic secret word selection.** The word is chosen from the five
   starter words using a deterministic rule (e.g. derived from the room code)
   so the same room yields a repeatable result; no randomness.
4. **Scoring is fixed.** All players start at 0; a correct guess scores 100, an
   incorrect guess scores 0. Only one round (no rotation, no timers, no bonuses).
5. **Server is the source of truth, synced via snapshots.** Drawing strokes,
   guesses, scores, and round status live in the in-memory room and reach other
   clients through the polled snapshot.
6. **State stays in-memory.** Restarting the backend clears all rooms; no
   persistence is added (out of scope).

## 3. Relevant files

| Area | File | Why it matters |
|------|------|----------------|
| Backend model | `backend/src/models/game.ts` | Room/Participant/Snapshot types; needs host, role, word, status, scores, guesses |
| Backend logic | `backend/src/services/roomStore.ts` | Room creation, join, snapshot, name handling; core of most changes |
| Backend routes | `backend/src/api/rooms.ts` | Existing create/join/get; new start/guess/draw/restart endpoints go here |
| Backend validation | `backend/src/api/schemas.ts` | Zod schemas; needs name trim/min-length and new payload schemas |
| Backend router | `backend/src/api/router.ts` | Mounts `/rooms`; 404 + error handling |
| Seed data | `backend/src/seed/starterData.ts` | Starter words and roles used for word selection and roles |
| Frontend API client | `frontend/src/services/api.ts` | Calls backend; needs new methods (start, guess, draw, restart) |
| Frontend state | `frontend/src/state/roomStore.ts` | Holds room + participantId; polling and new actions wire through here |
| Create page | `frontend/src/pages/CreateRoomPage.tsx` | Name entry for host creation |
| Join page | `frontend/src/pages/JoinRoomPage.tsx` | Code + name entry; error display for invalid codes |
| Lobby page | `frontend/src/pages/LobbyPage.tsx` | Auto-polling, host-only Start with 2-player minimum |
| Game page | `frontend/src/pages/GamePage.tsx` | Canvas, drawer/guesser views, word visibility, result/restart |
| Guess form | `frontend/src/components/GuessForm.tsx` | Wire submission, validation, disabled states |
| Scoreboard | `frontend/src/components/Scoreboard.tsx` | Render real per-player scores |
| Result panel | `frontend/src/components/ResultPanel.tsx` | Render guess history and round result |

## 4. Scenario → feature group mapping

| Group | Scenario | Primary gaps addressed |
|-------|----------|------------------------|
| 1. Room setup & lobby | Scenario 1 | Gap 1 (host), Gap 2 (polling), Gap 5 (start gate) |
| 2. Game start & drawer | Scenario 2 | Gap 3 (name validation), Gap 6 (roles/word visibility) |
| 3. Gameplay interaction | Scenario 3 | Gap 4 (canvas, guesses, scoring) |
| 4. Result, restart & validation | Scenario 4 | Gap 4 (results), restart/state-reset |

## 5. Out of scope (confirmed, will not appear in specs)

WebSockets, databases, authentication, deployment, Docker, new state or routing
libraries, multiple rounds, drawer rotation, timers, bonuses, custom word packs,
spectator mode, room moderation, room passwords, and full rewrites/unrelated
refactors.