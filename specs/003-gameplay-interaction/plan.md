# Plan — Scenario 3: Gameplay Interaction

---

## Findings

### What exists and is relevant (post Scenario 2)

| Area | File | Current behavior |
|---|---|---|
| Participant model | `backend/src/models/game.ts` | Has `id`, `name`, `joinedAt`. No `score` field. |
| Room model | `backend/src/models/game.ts` | Has `code`, `status`, `hostId`, `drawerId`, `currentWord`, `participants`, `createdAt`, `updatedAt`. No `guesses` field. |
| RoomSnapshot model | `backend/src/models/game.ts` | Has `code`, `status`, `hostId`, `drawerId`, `currentWord`, `participants`, `availableWords`, `roles`. No `guesses`. |
| Schemas | `backend/src/api/schemas.ts` | Has `createRoomSchema`, `joinRoomSchema`, `startGameSchema`, `roomCodeParamsSchema`, `roomViewerQuerySchema`. No `submitGuessSchema`. |
| Room service | `backend/src/services/roomStore.ts` | `createRoom` and `joinRoom` do not initialise a `guesses` array or participant `score`. `toRoomSnapshot` returns participants without scores and no guess history. No `submitGuess` function. |
| Rooms router | `backend/src/api/rooms.ts` | Four endpoints: `POST /rooms`, `POST /rooms/:code/join`, `POST /rooms/:code/start`, `GET /rooms/:code`. No guess endpoint. |
| Frontend snapshot type | `frontend/src/services/api.ts` | `Participant` has `id`, `name`, `joinedAt` — no `score`. `RoomSnapshot` has no `guesses` field. No `submitGuess` client method. |
| Frontend store | `frontend/src/state/roomStore.ts` | Has `createRoom`, `joinRoom`, `fetchRoom`, `startGame`. No `submitGuess` action. No polling on the game screen. |
| GamePage | `frontend/src/pages/GamePage.tsx` | Has role-aware canvas text. `GuessForm` is rendered for all players regardless of role — the drawer also sees it. No polling `useEffect`. No drawing canvas element. |
| GuessForm | `frontend/src/components/GuessForm.tsx` | Has local `guessText` state and a `disabled` prop. `handleSubmit` prevents default but makes no API call — the form is wired to nothing. |
| Scoreboard | `frontend/src/components/Scoreboard.tsx` | Static placeholder showing hardcoded `"Waiting for players..."` and `0`. Reads no data from the store. |
| ResultPanel | `frontend/src/components/ResultPanel.tsx` | Renamed "Activity". Shows static placeholder text. Reads no data from the store. |

### What is missing

1. **`score` on `Participant`** — no score field exists anywhere in the model. All participants are scoreless.
2. **`Guess` type** — no type definition for a guess record (participant id, name, text, result, timestamp).
3. **`guesses` on `Room`** — no array to hold submitted guesses.
4. **`guesses` in `RoomSnapshot`** — guess history is never surfaced to the frontend.
5. **`submitGuessSchema`** — no Zod schema to validate guess submissions.
6. **`submitGuess` service function** — no backend logic to trim/compare/score/store a guess.
7. **`POST /rooms/:code/guess` endpoint** — no route to receive guesses.
8. **Frontend `Participant.score`** — type missing from the interface.
9. **Frontend `Guess` type and `RoomSnapshot.guesses`** — type missing from the interface.
10. **Frontend `submitGuess` client method** — not in `api.ts`.
11. **Frontend `submitGuess` store action** — not in `roomStore.ts`.
12. **GamePage polling** — `GamePage` has no `setInterval`. The game screen never refreshes after the start snapshot.
13. **GuessForm wiring** — form submits nothing; no validation, no store call, no feedback.
14. **Drawer exclusion from guessing** — `GuessForm` is always rendered; the drawer sees and can interact with it.
15. **Drawing canvas** — the canvas area is a `<div>` placeholder. The drawer has no interactive surface.
16. **Clear canvas button** — does not exist.
17. **Scoreboard real data** — component reads nothing from the store.
18. **ResultPanel real data** — component reads nothing from the store.

---

## State Model Changes

### Backend — `backend/src/models/game.ts`

```
Participant (before)               Participant (after)
──────────────────────────         ─────────────────────────────
id: string                         id: string
name: string                       name: string
joinedAt: string                   joinedAt: string
                                   score: number               ← NEW (initialised to 0)
```

```
New type: Guess                    (added to game.ts)
──────────────────────────
participantId: string
participantName: string
text: string
isCorrect: boolean
submittedAt: string
```

```
Room (before)                      Room (after)
──────────────────────────         ─────────────────────────────
code, status, hostId               code, status, hostId
drawerId, currentWord              drawerId, currentWord
participants, createdAt            participants, createdAt
updatedAt                          updatedAt
                                   guesses: Guess[]            ← NEW (initialised to [])
```

```
RoomSnapshot (before)              RoomSnapshot (after)
──────────────────────────         ─────────────────────────────
code, status, hostId               code, status, hostId
drawerId, currentWord              drawerId, currentWord
participants                       participants                 (now includes score per participant)
availableWords, roles              availableWords, roles
                                   guesses: Guess[]            ← NEW
```

### Frontend — `frontend/src/services/api.ts`

```
Participant interface (before)     Participant interface (after)
──────────────────────────         ─────────────────────────────
id: string                         id: string
name: string                       name: string
joinedAt: string                   joinedAt: string
                                   score: number               ← NEW
```

```
New interface: Guess               (added to api.ts)
──────────────────────────
participantId: string
participantName: string
text: string
isCorrect: boolean
submittedAt: string
```

```
RoomSnapshot interface (before)    RoomSnapshot interface (after)
──────────────────────────         ─────────────────────────────
...existing fields...              ...existing fields...
                                   guesses: Guess[]            ← NEW
```

---

## Required API Changes

### Modified: `createRoom` and `joinRoom` service functions

- `createRoom`: initialise `participant.score = 0` when creating the participant; initialise `room.guesses = []`.
- `joinRoom`: initialise `participant.score = 0` when creating the joining participant.
- These are initialisation-only changes — no logic change.

### Modified: `toRoomSnapshot`

- `participants` map must now include `score: participant.score` in each entry.
- Add `guesses: room.guesses.map(g => ({ ...g }))` to the returned object.
- No per-viewer filtering on guesses — all players see the full history.

### New schema: `submitGuessSchema`

```
z.object({
  participantId: z.string().min(1),
  text: z.string().trim().min(1, "Guess cannot be empty")
})
```

`z.string().trim()` on `text` ensures whitespace-only guesses fail the `.min(1)` check. `participantId` identifies the submitter.

### New endpoint: `POST /rooms/:code/guess`

- **Purpose:** Accept, validate, score, and store a single guess.
- **Request:** Body `{ participantId: string, text: string }`.
- **Validations (in order):**
  1. Room must exist → 404 "Room not found".
  2. Room `status` must be `"playing"` → 422 "Game is not in progress".
  3. `participantId` must match a participant in the room → 404 "Participant not found".
  4. `participantId` must not equal `room.drawerId` → 403 "Drawer cannot submit a guess".
- **Processing:**
  1. Trim and lowercase `text`.
  2. Compare to `room.currentWord.trim().toLowerCase()`.
  3. Set `isCorrect = true` if they match.
  4. If `isCorrect` and `participant.score < 100`: set `participant.score = 100`.
  5. Append `{ participantId, participantName: participant.name, text: trimmedText, isCorrect, submittedAt: now() }` to `room.guesses`.
  6. Save room.
- **Response:** `{ room: RoomSnapshot }` — the full updated snapshot, so the frontend updates scores and guess history in one step.

### New client method: `submitGuess`

- **File:** `frontend/src/services/api.ts`
- Calls `POST /rooms/:code/guess` with `{ participantId, text }`.
- Returns `{ room: RoomSnapshot }`.

---

## Polling Changes

### GamePage gains a polling `useEffect`

`GamePage` currently has no polling — it renders from the snapshot set at game start and never refreshes. For Scenario 3, all players need to see updated guess history and scores.

The pattern is identical to `LobbyPage`:
- `useEffect` starts a `setInterval` at 2000ms calling `roomStore.fetchRoom()`.
- Cleanup clears the interval on unmount.
- Dependency on `room?.code` — starts when a room is present, stops on unmount.

`fetchRoom` already calls `GET /rooms/:code?participantId=...` which calls `toRoomSnapshot`, which will now include guesses and scores. No new endpoint or store action is needed for polling.

---

## Scoring Changes

Scores are computed and stored entirely on the backend. The frontend never computes correctness.

- `Participant.score` initialises to `0` in `createRoom` and `joinRoom`.
- `submitGuess` awards `100` if the guess matches and the participant's score is currently below `100`.
- The cap at `100` means a second correct guess by the same player does not increase their score.
- The drawer has no score changes in this scenario.
- Scores are included in `toRoomSnapshot` via the participants array — the `Scoreboard` component reads `room.participants` from the store snapshot.

---

## Data Flow

### Guess submission
```
GamePage (guesser only — drawer does not see GuessForm)
  → GuessForm local state: guessText
  → [trim guessText; if empty → "Guess cannot be empty", stop]
  → onSubmit(trimmedText) callback from GamePage
  → roomStore.submitGuess(trimmedText)
  → POST /rooms/:code/guess  { participantId, text }
  → backend:
      trim + lowercase text
      compare to currentWord.trim().toLowerCase()
      isCorrect = match
      if isCorrect && score < 100 → participant.score = 100
      room.guesses.push({ ..., isCorrect, submittedAt })
      save room
  → response { room: RoomSnapshot }  (includes updated guesses + scores)
  → roomStore.setRoomSnapshot(room)
  → GuessForm clears input; all players see update on next poll
```

### GamePage polling
```
GamePage mounts
  → useEffect starts setInterval(2000ms)
    → roomStore.fetchRoom()
    → GET /rooms/:code?participantId=<viewerId>
    → toRoomSnapshot: includes guesses[], participants[].score
    → roomStore.setRoomSnapshot(room)
    → Scoreboard and ResultPanel re-render with latest data
  → useEffect cleanup clears interval on unmount
```

### Drawing canvas (drawer only)
```
GamePage (isDrawer = true)
  → renders <canvas> element with pointer event handlers
  → drawer draws with mouse/pointer — state is local to the browser
  → "Clear Canvas" button calls canvas.getContext("2d").clearRect(...)
  → canvas state is never sent to the backend — no sync with guessers
```

---

## Implementation Sequence

### Step 1 — Backend: add `Guess` type and extend `Participant` and `Room` models
- **File:** `backend/src/models/game.ts`
- Add `score: number` to `Participant`.
- Define and export `Guess` interface.
- Add `guesses: Guess[]` to `Room`.
- Add `guesses: Guess[]` to `RoomSnapshot`.
- Verify: `npm run build` in `backend/` passes (service type errors expected — fixed in Step 2).

### Step 2 — Backend: initialise score and guesses in room service
- **File:** `backend/src/services/roomStore.ts`
- In `createParticipant`: add `score: 0`.
- In `createRoom`: add `guesses: []` to the room literal.
- In `toRoomSnapshot`: add `score` to the participants map; add `guesses: room.guesses.map(g => ({ ...g }))`.
- Verify: `npm run build` in `backend/` passes.

### Step 3 — Backend: add `submitGuessSchema`
- **File:** `backend/src/api/schemas.ts`
- Add `submitGuessSchema = z.object({ participantId: z.string().min(1), text: z.string().trim().min(1, "Guess cannot be empty") })`.
- Verify: `npm run build` in `backend/` passes.

### Step 4 — Backend: add `submitGuess` service function
- **File:** `backend/src/services/roomStore.ts`
- Add exported `submitGuess(code, participantId, text)` function with all four validations and the scoring and storage logic.
- Verify: `npm run build` in `backend/` passes.

### Step 5 — Backend: add `POST /rooms/:code/guess` endpoint
- **File:** `backend/src/api/rooms.ts`
- Import `submitGuessSchema` and `submitGuess`.
- Add the route handler with all guard clauses mapped to correct HTTP status codes.
- Verify: `npm run build` in `backend/` passes.

### Step 6 — Frontend: update types in `api.ts`
- **File:** `frontend/src/services/api.ts`
- Add `score: number` to the `Participant` interface.
- Add `Guess` interface.
- Add `guesses: Guess[]` to `RoomSnapshot`.
- Add `submitGuess(code, participantId, text)` client method.
- Verify: `npm run build` in `frontend/` passes.

### Step 7 — Frontend: add `submitGuess` action to store
- **File:** `frontend/src/state/roomStore.ts`
- Add `submitGuess(text: string)` method that reads `room.code` and `participantId` from state, calls `api.submitGuess`, and calls `setRoomSnapshot` on success.
- Verify: `npm run build` in `frontend/` passes.

### Step 8 — Frontend: wire `GuessForm`
- **File:** `frontend/src/components/GuessForm.tsx`
- Add `onSubmit: (text: string) => Promise<void>` prop.
- On submit: trim, reject empty with inline error, call `onSubmit`, clear input on success.
- Verify: `npm run build` in `frontend/` passes.

### Step 9 — Frontend: update `GamePage` — polling, drawer exclusion, canvas, callbacks
- **File:** `frontend/src/pages/GamePage.tsx`
- Add polling `useEffect` (same pattern as `LobbyPage`).
- Render `GuessForm` only when `!isDrawer`; pass `onSubmit` callback that calls `roomStore.submitGuess`.
- Drawer canvas area: replace the placeholder `<div>` with an HTML `<canvas>` element and pointer event handlers for drawing.
- Add a "Clear Canvas" button visible only to the drawer.
- Verify: `npm run build` in `frontend/` passes.

### Step 10 — Frontend: update `Scoreboard`
- **File:** `frontend/src/components/Scoreboard.tsx`
- Accept `participants` as a prop (or read from the store directly).
- Render each participant's name and score from the snapshot.
- Verify: `npm run build` in `frontend/` passes.

### Step 11 — Frontend: update `ResultPanel` with guess history
- **File:** `frontend/src/components/ResultPanel.tsx`
- Accept `guesses` as a prop (or read from the store directly).
- Render each guess entry: guesser name, guess text, correct/incorrect label.
- Verify: `npm run build` in `frontend/` passes.

---

## Files Touched

| File | Change type |
|---|---|
| `backend/src/models/game.ts` | Modify — add `score` to `Participant`, new `Guess` type, `guesses` to `Room` and `RoomSnapshot` |
| `backend/src/api/schemas.ts` | Modify — add `submitGuessSchema` |
| `backend/src/services/roomStore.ts` | Modify — init `score` in `createParticipant`, `guesses` in `createRoom`, include both in `toRoomSnapshot`, add `submitGuess` |
| `backend/src/api/rooms.ts` | Modify — add `POST /:code/guess` handler |
| `frontend/src/services/api.ts` | Modify — add `score` to `Participant`, `Guess` type, `guesses` to `RoomSnapshot`, `submitGuess` method |
| `frontend/src/state/roomStore.ts` | Modify — add `submitGuess` action |
| `frontend/src/components/GuessForm.tsx` | Modify — add `onSubmit` prop, client-side validation, input clear on success |
| `frontend/src/components/Scoreboard.tsx` | Modify — render real participant scores from snapshot |
| `frontend/src/components/ResultPanel.tsx` | Modify — render real guess history from snapshot |
| `frontend/src/pages/GamePage.tsx` | Modify — add polling, hide GuessForm from drawer, add canvas + clear button for drawer |

No new files. No new libraries.

---

## Testing Strategy

### Backend unit tests (`backend/src/services/roomStore.test.ts`)
- `submitGuess`: room not found returns the not-found sentinel.
- `submitGuess`: room not in "playing" status returns the not-in-progress sentinel.
- `submitGuess`: unknown `participantId` returns the not-found sentinel.
- `submitGuess`: drawer `participantId` returns the drawer sentinel.
- `submitGuess`: correct guess (case-insensitive) sets `isCorrect: true` and awards 100 points.
- `submitGuess`: incorrect guess sets `isCorrect: false` and does not change score.
- `submitGuess`: second correct guess by same player does not raise score above 100.
- `submitGuess`: guess is appended to `room.guesses` with correct fields.
- `toRoomSnapshot`: participants include `score`.
- `toRoomSnapshot`: `guesses` array is included and matches stored guesses.

### Backend schema tests (`backend/src/api/schemas.test.ts`)
- `submitGuessSchema`: empty `text` is rejected.
- `submitGuessSchema`: whitespace-only `text` is rejected.
- `submitGuessSchema`: `text` with surrounding spaces is trimmed and accepted.
- `submitGuessSchema`: missing `participantId` is rejected.

### Frontend service tests (`frontend/src/services/api.test.ts`)
- `api.submitGuess`: makes a `POST` to `/rooms/:code/guess` with the correct body shape.

---

## Risks

| Risk | Mitigation |
|---|---|
| Canvas drawing state is local to the drawer's browser — guessers cannot see the drawing | Accepted per the out-of-scope rule (no WebSockets). The spec says the drawing is visible "on the drawer's screen" which is satisfied. |
| Polling from both `LobbyPage` and `GamePage` must not overlap | Each page manages its own `setInterval` within its own `useEffect`. Navigating from lobby to game runs the lobby cleanup before the game mounts. |
| `submitGuess` response includes the full room snapshot — this doubles as an immediate update without waiting for the next poll | Intentional — the submitter sees their guess reflected immediately. Other players see it within ~2 seconds via polling. |
| `GuessForm` needs a new `onSubmit` prop — it is currently rendered in `GamePage` without any prop | `GamePage` already holds `roomStore` and `participantId`. The callback is a one-liner defined in `GamePage` and passed down. |
| `createParticipant` is a private function — adding `score: 0` there automatically covers both `createRoom` and `joinRoom` | Correct. Both functions call `createParticipant`. Initialising `score` there means no change is needed in `joinRoom` for the participant. |
| A player submits a guess after navigating away from the game screen | Polling stops on unmount via cleanup. Any in-flight request will still complete but the response snapshot update is a no-op because the store update triggers no re-render on an unmounted component. |
