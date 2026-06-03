# Discovery Notes

Brownfield orientation for the Scribble lab. Captures what the starter actually does today, where the real gaps live, and the assumptions we are locking in so later Spec Kit iterations (`/speckit.specify`, `/speckit.plan`, `/speckit.tasks`) have a stable foundation to build on.

Every gap below is verifiable against a file path and line range in the starter. Every assumption has a short ID (A1, A2, …) so later spec/plan prompts can cite it instead of re-deriving it.

## Incomplete behaviors (gaps)

### Scenario 1 — Room setup and lobby

- **G1. No host concept.** `createRoom` in [backend/src/services/roomStore.ts:52-68](backend/src/services/roomStore.ts) does not record the creator as the host. The `Room` model in [backend/src/models/game.ts:10-16](backend/src/models/game.ts) has no `hostParticipantId`, so host-only gating is impossible today.
- **G2. Name validation is too loose.** `createRoomSchema` and `joinRoomSchema` in [backend/src/api/schemas.ts:3-9](backend/src/api/schemas.ts) declare `playerName: z.string().optional()`. `displayName` in [backend/src/services/roomStore.ts:32-34](backend/src/services/roomStore.ts) silently coerces empty/missing names to `"Player"`. Scenario 2 requires trim and rejection of empty/whitespace-only names with a clear message.
- **G3. Lobby polls manually.** [frontend/src/pages/LobbyPage.tsx:20-27, 68-75](frontend/src/pages/LobbyPage.tsx) only refreshes when the user clicks "Refresh Room". The acceptance criterion is automatic refresh on a ~2 s cadence.
- **G4. Default API URL is a planted bug.** [frontend/src/services/api.ts:22](frontend/src/services/api.ts) defaults `API_BASE_URL` to `http://localhost:3001/bug`. With `VITE_API_URL` unset, every request 404s. Must be fixed before any other scenario can be validated end-to-end.

### Scenario 2 — Game start and drawer

- **G5. No "playing" state exists.** `RoomStatus` in [backend/src/models/game.ts:2](backend/src/models/game.ts) is the literal `"lobby"`. There is no `start` endpoint, no `currentRound`, and no drawer field on `Participant`.
- **G6. Snapshot leaks the viewer slot it pretends to use.** `toRoomSnapshot` in [backend/src/services/roomStore.ts:99-109](backend/src/services/roomStore.ts) takes `viewerParticipantId` and explicitly drops it (`void viewerParticipantId;`). When the secret word lands on the snapshot, every viewer will see it unless this signature actually starts branching on identity.
- **G7. Frontend "Start Game" is a blind navigation.** [frontend/src/pages/LobbyPage.tsx:72-74](frontend/src/pages/LobbyPage.tsx) only calls `navigate("/game")`. No backend call, no host check, no 2-player minimum.

### Scenario 3 — Gameplay interaction

- **G8. Canvas is decorative.** [frontend/src/pages/GamePage.tsx:43-47](frontend/src/pages/GamePage.tsx) renders a `<div>` that says "Waiting for drawer..." — no `<canvas>` element, no pointer handlers, no clear action.
- **G9. GuessForm submit is a no-op.** [frontend/src/components/GuessForm.tsx:10-12](frontend/src/components/GuessForm.tsx) only calls `event.preventDefault()`. No API call, no trim, no validation, no scoring.
- **G10. Scoreboard and ResultPanel are hard-coded.** [frontend/src/components/Scoreboard.tsx](frontend/src/components/Scoreboard.tsx) renders a static `0`; [frontend/src/components/ResultPanel.tsx](frontend/src/components/ResultPanel.tsx) shows placeholder copy only. Neither reads from the room.

### Scenario 4 — Result and restart

- **G11. No result state and no restart endpoint.** The `RoomStatus` union has no `"result"` member. [backend/src/api/rooms.ts](backend/src/api/rooms.ts) exposes neither `POST /rooms/:code/start` nor `POST /rooms/:code/restart`. The "Exit Game" button in [frontend/src/pages/GamePage.tsx:71-73](frontend/src/pages/GamePage.tsx) just navigates back to `/lobby` without touching server state.

## Assumptions

These are decisions we lock in now so the four `/speckit.specify` iterations don't drift. They are referenced from later prompts by ID.

- **A1. Deterministic word selection** is a pure function of room code and round index, not RNG. Proposed formula: `STARTER_WORDS[(sumCharCodes(code) + roundIndex) % STARTER_WORDS.length]`, `roundIndex` starting at `0`. Identical room code → same first word so reviewers can verify determinism quickly.
- **A2. Drawer for round 1** is the first participant in `room.participants`, which is also the host. README phrasing "host (or first player)" makes these identical for the starter.
- **A3. First correct guess ends the round.** It awards +100 to the guesser, transitions the room to `"result"`, and disables further guesses. This is the simplest interpretation that satisfies "correct guesses score 100" without inventing multi-winner rules the README does not describe.
- **A4. Restart clears everything except participants.** Scores, strokes, guesses, secret word, drawer assignment are all wiped; the participant array (including host) is preserved. "All round state cleared" in Scenario 4 is read literally.
- **A5. Polling cadence is 2000 ms** in both lobby and game; one reusable hook (`useRoomPolling`). We pause polling when `document.visibilityState !== "visible"` to keep the in-memory store quiet for inactive tabs.
- **A6. Player names** are 1–24 characters after `.trim()`. Codes stay 4 characters from the existing alphabet in [backend/src/services/roomStore.ts:12](backend/src/services/roomStore.ts) and are always uppercased before lookup ([backend/src/api/rooms.ts:32,49](backend/src/api/rooms.ts) already does this — keep it).
- **A7. Strokes are append-only** with an optional `clear` that resets the array. No undo. Each stroke is `{ points: { x: number; y: number }[], color: string, width: number }`.

## Confirmed in-scope

From README "Business Scenarios" and "Phased Checkpoints":

- Scenarios 1–4 with the listed acceptance criteria.
- HTTP polling at ~2 s for all sync.
- Deterministic word selection from `STARTER_WORDS` only.
- Single round per "game"; restart begins a fresh round.
- 2-player minimum to start.

## Confirmed out-of-scope

From README "Explicitly Out Of Scope" and `AGENTS.md`:

WebSockets / real-time push, databases, auth / sessions / JWT, multi-round play, drawer rotation, timers / countdowns, speed or drawer bonuses, custom or random word packs, spectator mode, kick / mute, room passwords / invite links, deployment / hosting / Docker / CI work, new state-management or routing libraries beyond the starter, rewriting the starter, unjustified top-level dependencies, unrelated refactors.

The forbidden-tech scanner in [.github/scripts/pre-evaluation-check.mjs:246-269](.github/scripts/pre-evaluation-check.mjs) actively enforces the WebSockets / databases / auth bans against both `backend/src` and `frontend/src` plus direct dependencies in `package.json`. Anything that trips those regexes will fail the PR check.

## Relevant files

### Backend

- [backend/src/models/game.ts](backend/src/models/game.ts) — type model; needs `hostParticipantId`, widened `RoomStatus`, `currentRound`, `Stroke`, `Guess`.
- [backend/src/services/roomStore.ts](backend/src/services/roomStore.ts) — in-memory store and snapshot serializer; the bulk of new logic lands here.
- [backend/src/api/rooms.ts](backend/src/api/rooms.ts) and [backend/src/api/schemas.ts](backend/src/api/schemas.ts) — new endpoints (`/start`, `/guess`, `/strokes`, `/strokes/clear`, `/restart`) and tightened Zod schemas.
- [backend/src/seed/starterData.ts](backend/src/seed/starterData.ts) — `STARTER_WORDS` source of truth; do not extend.
- [backend/src/services/roomStore.test.ts](backend/src/services/roomStore.test.ts) and [backend/src/api/schemas.test.ts](backend/src/api/schemas.test.ts) — extend rather than replace.

### Frontend

- [frontend/src/services/api.ts](frontend/src/services/api.ts) — remove the `/bug` default and add clients for the new endpoints.
- [frontend/src/state/roomStore.ts](frontend/src/state/roomStore.ts) — new actions (`startGame`, `submitGuess`, `appendStroke`, `clearStrokes`, `restart`) and polling integration.
- [frontend/src/pages/LobbyPage.tsx](frontend/src/pages/LobbyPage.tsx) and [frontend/src/pages/GamePage.tsx](frontend/src/pages/GamePage.tsx) — host-only gating, polling, drawer-vs-guesser branching, result view.
- [frontend/src/components/GuessForm.tsx](frontend/src/components/GuessForm.tsx), [frontend/src/components/Scoreboard.tsx](frontend/src/components/Scoreboard.tsx), [frontend/src/components/ResultPanel.tsx](frontend/src/components/ResultPanel.tsx) — wire to real state.
- New `frontend/src/components/Canvas.tsx` and new `frontend/src/hooks/useRoomPolling.ts`.

### CI / grading

- [.github/scripts/pre-evaluation-check.mjs](.github/scripts/pre-evaluation-check.mjs) — the only enforced gate. Look here before adding any dependency or filename.
- [.github/pull_request_template.md](.github/pull_request_template.md) — PR body shape (Email + Role).

## Open questions for `/speckit.clarify`

These are real ambiguities the README does not resolve. We will pin them down before each scenario's `/speckit.plan`.

- **Q1.** Does the result view show the full guess history (including incorrect) to all players, or only correct guesses? Default proposal: full history, chronological.
- **Q2.** On restart, should drawer rotate or stay with the same first participant? Default proposal: same first participant (only one round exists, so this is mostly academic, but the spec should say it).
- **Q3.** Canvas resolution and stroke smoothing? Default proposal: 600 × 400 CSS px, straight-line interpolation between pointer samples, no smoothing.
- **Q4.** Soft cap on participants per room to keep snapshots small? Default proposal: 8.
- **Q5.** Error UX for the `/bug` API URL situation today — do we add a visible "backend unreachable" banner, or just fix the default and rely on form-level error display? Default proposal: fix the default; lean on existing form errors.
