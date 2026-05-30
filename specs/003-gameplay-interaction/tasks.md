# Tasks — Scenario 3: Gameplay Interaction

Tasks are ordered. Complete each one before starting the next.
Each task is a single commit.

---

## Group U — Backend Model

### U1 — Add score to Participant interface
- File: `backend/src/models/game.ts`
- Add `score: number` to the `Participant` interface.
- No other changes.
- Verify: `npm run build` in `backend/` passes. Type errors in the service are expected — fixed in U3.

### U2 — Add Guess interface
- File: `backend/src/models/game.ts`
- Define and export a `Guess` interface with fields: `participantId: string`, `participantName: string`, `text: string`, `isCorrect: boolean`, `submittedAt: string`.
- No other changes.
- Verify: `npm run build` in `backend/` passes.

### U3 — Add guesses to Room and RoomSnapshot interfaces
- File: `backend/src/models/game.ts`
- Add `guesses: Guess[]` to the `Room` interface.
- Add `guesses: Guess[]` to the `RoomSnapshot` interface.
- No other changes.
- Verify: `npm run build` in `backend/` passes. Service type errors are expected — fixed in Group V.

---

## Group V — Backend Service

### V1 — Initialise score in createParticipant
- File: `backend/src/services/roomStore.ts`
- In the `createParticipant` function, add `score: 0` to the returned participant object.
- This covers both `createRoom` and `joinRoom` since both call `createParticipant`.
- No other changes.
- Verify: `npm run build` in `backend/` passes.

### V2 — Initialise guesses array in createRoom
- File: `backend/src/services/roomStore.ts`
- In `createRoom`, add `guesses: []` to the room object literal.
- No other changes.
- Verify: `npm run build` in `backend/` passes.

### V3 — Include score and guesses in toRoomSnapshot
- File: `backend/src/services/roomStore.ts`
- In the participants map inside `toRoomSnapshot`, add `score: participant.score` to each mapped entry.
- Add `guesses: room.guesses.map(g => ({ ...g }))` to the returned snapshot object.
- No other changes.
- Verify: `npm run build` in `backend/` passes.

### V4 — Add submitGuess service function
- File: `backend/src/services/roomStore.ts`
- Add an exported `submitGuess(code: string, participantId: string, text: string)` function.
- The function must perform checks in this order:
  1. Return `"room-not-found"` if the room does not exist.
  2. Return `"not-playing"` if `room.status !== "playing"`.
  3. Return `"participant-not-found"` if no participant in the room matches `participantId`.
  4. Return `"is-drawer"` if `participantId === room.drawerId`.
- If all checks pass:
  1. Trim and lowercase `text`.
  2. Compare to `room.currentWord!.trim().toLowerCase()`.
  3. Set `isCorrect` accordingly.
  4. If `isCorrect` and `participant.score < 100`, set `participant.score = 100`.
  5. Push a new `Guess` object to `room.guesses`.
  6. Save the room.
  7. Return the updated room snapshot via `toRoomSnapshot`.
- Verify: `npm run build` in `backend/` passes.

---

## Group W — Backend Schema and Endpoint

### W1 — Add submitGuessSchema
- File: `backend/src/api/schemas.ts`
- Add `submitGuessSchema = z.object({ participantId: z.string().min(1), text: z.string().trim().min(1, "Guess cannot be empty") })`.
- Export it alongside existing schemas.
- Verify: `npm run build` in `backend/` passes.

### W2 — Add POST /rooms/:code/guess route handler
- File: `backend/src/api/rooms.ts`
- Import `submitGuessSchema` and `submitGuess` from their respective modules.
- Add `router.post("/:code/guess", ...)` handler that:
  1. Parses params with `roomCodeParamsSchema`.
  2. Parses body with `submitGuessSchema`.
  3. Calls `submitGuess(code, participantId, text)`.
  4. Returns 404 if result is `"room-not-found"` or `"participant-not-found"`.
  5. Returns 422 with message "Game is not in progress" if result is `"not-playing"`.
  6. Returns 403 with message "Drawer cannot submit a guess" if result is `"is-drawer"`.
  7. Returns 200 with `{ room: snapshot }` on success.
- Verify: `npm run build` in `backend/` passes.

---

## Group X — Backend Tests

### X1 — Test Participant is initialised with score 0
- File: `backend/src/services/roomStore.test.ts`
- Create a room. Assert `result.room.participants[0].score === 0`.
- Run: `npm test` in `backend/` — all tests pass.

### X2 — Test joining player is initialised with score 0
- File: `backend/src/services/roomStore.test.ts`
- Create a room, join a second player. Assert the second participant's score is `0` in the returned snapshot.
- Run: `npm test` in `backend/` — all tests pass.

### X3 — Test createRoom initialises guesses as empty array
- File: `backend/src/services/roomStore.test.ts`
- Create a room. Assert `result.room.guesses` is an empty array.
- Run: `npm test` in `backend/` — all tests pass.

### X4 — Test toRoomSnapshot includes score on each participant
- File: `backend/src/services/roomStore.test.ts`
- Create a room. Call `toRoomSnapshot`. Assert each participant in the snapshot has a `score` field equal to `0`.
- Run: `npm test` in `backend/` — all tests pass.

### X5 — Test toRoomSnapshot includes guesses array
- File: `backend/src/services/roomStore.test.ts`
- Create a room. Call `toRoomSnapshot`. Assert `snapshot.guesses` is an empty array.
- Run: `npm test` in `backend/` — all tests pass.

### X6 — Test submitGuessSchema rejects empty text
- File: `backend/src/api/schemas.test.ts`
- Add a test: `submitGuessSchema.parse({ participantId: "abc", text: "" })` throws a ZodError.
- Run: `npm test` in `backend/` — all tests pass.

### X7 — Test submitGuessSchema rejects whitespace-only text
- File: `backend/src/api/schemas.test.ts`
- Add a test: `submitGuessSchema.parse({ participantId: "abc", text: "   " })` throws a ZodError.
- Run: `npm test` in `backend/` — all tests pass.

### X8 — Test submitGuessSchema trims valid text
- File: `backend/src/api/schemas.test.ts`
- Add a test: `submitGuessSchema.parse({ participantId: "abc", text: "  pizza  " })` succeeds and the parsed `text` is `"pizza"`.
- Run: `npm test` in `backend/` — all tests pass.

### X9 — Test submitGuess: room not found
- File: `backend/src/services/roomStore.test.ts`
- Call `submitGuess("XXXX", "any", "pizza")`. Assert result is `"room-not-found"`.
- Run: `npm test` in `backend/` — all tests pass.

### X10 — Test submitGuess: room not in playing status
- File: `backend/src/services/roomStore.test.ts`
- Create a room (status is "lobby"). Call `submitGuess` with the host id and any text. Assert result is `"not-playing"`.
- Run: `npm test` in `backend/` — all tests pass.

### X11 — Test submitGuess: unknown participant
- File: `backend/src/services/roomStore.test.ts`
- Start a game with two players. Call `submitGuess` with a made-up participant id. Assert result is `"participant-not-found"`.
- Run: `npm test` in `backend/` — all tests pass.

### X12 — Test submitGuess: drawer is rejected
- File: `backend/src/services/roomStore.test.ts`
- Start a game. Call `submitGuess` with the drawer's `participantId`. Assert result is `"is-drawer"`.
- Run: `npm test` in `backend/` — all tests pass.

### X13 — Test submitGuess: correct guess (case-insensitive)
- File: `backend/src/services/roomStore.test.ts`
- Start a game. Determine the current word from the snapshot. Submit the word in uppercase via the guesser. Assert the returned snapshot has `guesses[0].isCorrect === true`.
- Run: `npm test` in `backend/` — all tests pass.

### X14 — Test submitGuess: correct guess awards 100 points
- File: `backend/src/services/roomStore.test.ts`
- Start a game. Submit a correct guess as the guesser. Assert the guesser's score in the returned snapshot is `100`.
- Run: `npm test` in `backend/` — all tests pass.

### X15 — Test submitGuess: incorrect guess awards 0 points
- File: `backend/src/services/roomStore.test.ts`
- Start a game. Submit a wrong guess as the guesser. Assert the guesser's score is `0` and `guesses[0].isCorrect === false`.
- Run: `npm test` in `backend/` — all tests pass.

### X16 — Test submitGuess: second correct guess does not increase score above 100
- File: `backend/src/services/roomStore.test.ts`
- Start a game. Submit a correct guess (score becomes 100). Submit another correct guess. Assert score is still `100`.
- Run: `npm test` in `backend/` — all tests pass.

### X17 — Test submitGuess: guess is appended to room.guesses
- File: `backend/src/services/roomStore.test.ts`
- Start a game. Submit two guesses. Assert the returned snapshot has `guesses.length === 2` and both entries have the correct `text`, `participantId`, and `submittedAt` fields.
- Run: `npm test` in `backend/` — all tests pass.

---

## Group Y — Frontend Types

### Y1 — Add score to Participant interface
- File: `frontend/src/services/api.ts`
- Add `score: number` to the `Participant` interface.
- No other changes.
- Verify: `npm run build` in `frontend/` passes.

### Y2 — Add Guess interface
- File: `frontend/src/services/api.ts`
- Add a `Guess` interface with fields: `participantId: string`, `participantName: string`, `text: string`, `isCorrect: boolean`, `submittedAt: string`.
- No other changes.
- Verify: `npm run build` in `frontend/` passes.

### Y3 — Add guesses to RoomSnapshot interface
- File: `frontend/src/services/api.ts`
- Add `guesses: Guess[]` to the `RoomSnapshot` interface.
- No other changes.
- Verify: `npm run build` in `frontend/` passes.

### Y4 — Add submitGuess client method
- File: `frontend/src/services/api.ts`
- Add `submitGuess(code: string, participantId: string, text: string)` to the `api` object.
- It calls `POST /rooms/:code/guess` with body `{ participantId, text }` and returns `{ room: RoomSnapshot }`.
- Verify: `npm run build` in `frontend/` passes.

---

## Group Z — Frontend Store and GuessForm

### Z1 — Add submitGuess action to RoomStore
- File: `frontend/src/state/roomStore.ts`
- Add `submitGuess(text: string)` method that reads `room.code` and `participantId` from state, calls `api.submitGuess` inside `withLoading`, and calls `setRoomSnapshot` on success.
- Verify: `npm run build` in `frontend/` passes.

### Z2 — Add onSubmit prop and validation to GuessForm
- File: `frontend/src/components/GuessForm.tsx`
- Add `onSubmit: (text: string) => Promise<void>` to the `GuessFormProps` interface.
- In `handleSubmit`: trim `guessText`. If the trimmed value is empty, set a local inline error "Guess cannot be empty" and return without calling `onSubmit`.
- If valid: call `onSubmit(trimmedText)`, await it, and clear `guessText` on success.
- No other changes.
- Verify: `npm run build` in `frontend/` passes.

### Z3 — Add error display to GuessForm
- File: `frontend/src/components/GuessForm.tsx`
- Add a local `error` state.
- Render an inline error message below the input when `error` is non-null.
- Clear the error when the input changes.
- No other changes.
- Verify: `npm run build` in `frontend/` passes.

---

## Group AA — Frontend Polling and GamePage

### AA1 — Add polling useEffect to GamePage
- File: `frontend/src/pages/GamePage.tsx`
- Add a `useEffect` that starts a `setInterval` calling `roomStore.fetchRoom()` every 2000ms.
- The cleanup function must call `clearInterval` to stop polling on unmount.
- Dependency on `room?.code` — same pattern as LobbyPage.
- No rendering changes in this task.
- Verify: `npm run build` in `frontend/` passes.

### AA2 — Hide GuessForm from drawer; pass onSubmit to guessers
- File: `frontend/src/pages/GamePage.tsx`
- Render the `GuessForm` only when `!isDrawer`.
- Pass an `onSubmit` callback to `GuessForm` that calls `roomStore.submitGuess(text)`.
- Remove the unconditional `<GuessForm />` render.
- Verify: `npm run build` in `frontend/` passes.

### AA3 — Add drawing canvas for drawer
- File: `frontend/src/pages/GamePage.tsx`
- When `isDrawer` is true, render an HTML `<canvas>` element inside the canvas area.
- Wire `onMouseDown`, `onMouseMove`, and `onMouseUp` (or equivalent pointer events) to draw lines on the canvas using `getContext("2d")`.
- Drawing state is local to the component — it is never sent to the backend.
- The secret word display (from Scenario 2) remains visible above the canvas.
- Verify: `npm run build` in `frontend/` passes.

### AA4 — Add Clear Canvas button for drawer
- File: `frontend/src/pages/GamePage.tsx`
- Below the canvas, render a "Clear Canvas" button visible only when `isDrawer` is true.
- On click, call `clearRect` on the canvas context to blank the canvas.
- Verify: `npm run build` in `frontend/` passes.

---

## Group AB — Frontend Components

### AB1 — Update Scoreboard with real participant data
- File: `frontend/src/components/Scoreboard.tsx`
- Accept `participants` as a prop (type: `{ name: string; score: number }[]`).
- Render one row per participant showing name and score.
- Remove the static placeholder content.
- Update `GamePage` to pass `room.participants` to `<Scoreboard />`.
- Verify: `npm run build` in `frontend/` passes.

### AB2 — Update ResultPanel with real guess history
- File: `frontend/src/components/ResultPanel.tsx`
- Accept `guesses` as a prop (type: `{ participantName: string; text: string; isCorrect: boolean }[]`).
- Render one row per guess showing the guesser's name, their guess text, and a correct/incorrect label.
- If `guesses` is empty, show a "No guesses yet" placeholder.
- Update `GamePage` to pass `room.guesses` to `<ResultPanel />`.
- Verify: `npm run build` in `frontend/` passes.

---

## Group AC — Frontend Tests

### AC1 — Test api service: submitGuess sends correct request
- File: `frontend/src/services/api.test.ts`
- Add a test asserting `api.submitGuess("ABCD", "participant-id", "pizza")` makes a `POST` to `/rooms/ABCD/guess` with `{ participantId: "participant-id", text: "pizza" }` in the body.
- Run: `npm test` in `frontend/` — all tests pass.

---

## Group AD — Manual Validation

Run these checks in two browser tabs after all tasks are complete.
No code changes — validation only.

### AD1 — Validate: all players start with score 0
- Tab 1: create a room. Tab 2: join the room. Tab 1: start the game.
- Expected: Scoreboard shows both players at 0 points.

### AD2 — Validate: empty guess is rejected
- Tab 2 (guesser): submit the guess form with an empty input.
- Expected: inline error "Guess cannot be empty" appears, no network request is made.

### AD3 — Validate: whitespace-only guess is rejected
- Tab 2 (guesser): type spaces only into the guess field, submit.
- Expected: inline error appears, no network request is made.

### AD4 — Validate: incorrect guess does not change score
- Tab 2 (guesser): submit a wrong word.
- Expected: guess appears in the activity panel marked as incorrect. Score remains 0.

### AD5 — Validate: correct guess awards 100 points
- Tab 2 (guesser): submit the correct secret word (visible in Tab 1 drawer view).
- Expected: guess appears as correct in the activity panel. Guesser's score updates to 100 in the Scoreboard within ~2 seconds.

### AD6 — Validate: correct guess is case-insensitive
- Tab 2 (guesser): submit the correct word in all caps.
- Expected: guess is marked as correct. Score updates to 100.

### AD7 — Validate: second correct guess does not exceed 100 points
- Tab 2 (guesser): after AD5, submit the correct word again.
- Expected: score stays at 100. Guess is still marked correct in history.

### AD8 — Validate: guess history syncs to all players
- Tab 1 (drawer): observe the activity panel within ~2 seconds after Tab 2 submits a guess.
- Expected: the guess appears in Tab 1's activity panel without any manual action.

### AD9 — Validate: drawer cannot submit a guess
- Tab 1 (drawer): confirm the guess form is not visible on the game screen.
- Expected: no guess input or submit button is present in the drawer's view.

### AD10 — Validate: drawer can draw on the canvas
- Tab 1 (drawer): click and drag on the canvas area.
- Expected: lines appear on the canvas as the mouse moves.

### AD11 — Validate: clear canvas resets the drawing
- Tab 1 (drawer): draw something, then click "Clear Canvas".
- Expected: the canvas returns to a blank white state.

### AD12 — Validate: clear canvas button is not visible to guessers
- Tab 2 (guesser): inspect the game screen.
- Expected: no "Clear Canvas" button is visible.
