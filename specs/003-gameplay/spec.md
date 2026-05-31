# Feature Specification: Group 3 — Gameplay Interaction

**Feature Branch**: `group-3-gameplay`

**Created**: 2026-05-31

**Status**: Draft

---

## Current State (what already exists)

### Backend
- `Room` has: `code`, `status`, `participants[]`, `hostId`, `drawerParticipantId`, `currentWord`, `createdAt`, `updatedAt`
- No `guesses` collection exists on `Room` — guess history is not stored anywhere
- No `scores` map exists — participant scores are not tracked
- No `POST /rooms/:code/guess` endpoint exists
- No canvas stroke data is stored — drawing is purely client-side

### Frontend
- `GamePage.tsx`: renders role banners, drawer name, 2 s polling, `GuessForm` disabled for drawer ✅
- `GuessForm.tsx`: has a controlled input and a Submit button; `handleSubmit` calls `event.preventDefault()` and does nothing else — no API call
- `Scoreboard.tsx`: static placeholder — renders "Waiting for players... 0"
- `ResultPanel.tsx`: static placeholder — renders "Game activity and guesses will appear here."
- Canvas area: a `<div>` placeholder — no `<canvas>` element, no drawing logic

### What is missing
- No guess submission API call from `GuessForm`
- No backend endpoint to receive and evaluate guesses
- No guess history or score storage on `Room`
- `Scoreboard` and `ResultPanel` are not wired to real data
- Canvas is a `<div>` placeholder — no drawing capability
- No clear button for the drawer

---

## User Scenarios & Testing

### User Story 1 — Drawer Draws and Clears Canvas (Priority: P1)

The drawer sees a `<canvas>` element. They can draw freehand lines by clicking and dragging. A Clear button wipes the canvas. Guessers see the canvas placeholder (drawing sync is out of scope — canvas state is local only for this group).

**Why this priority**: The drawer experience is the core mechanic. Without a working canvas the game is unplayable from the drawer's perspective.

**Independent Test**: Tab A (drawer) — draw lines on the canvas, confirm strokes appear. Click Clear, confirm canvas is blank.

**Acceptance Scenarios**:

1. **Given** the game screen with `viewerRole === "drawer"`, **When** the component renders, **Then** a `<canvas>` element is shown instead of the `div` placeholder.
2. **Given** the canvas, **When** the drawer presses mouse down and drags, **Then** a line is drawn along the pointer path using `CanvasRenderingContext2D`.
3. **Given** the canvas with strokes, **When** the drawer clicks the Clear button, **Then** `clearRect` is called and the canvas is blank.
4. **Given** the game screen with `viewerRole === "guesser"`, **When** the component renders, **Then** the canvas placeholder div is shown (no interactive canvas for guessers in this group).

---

### User Story 2 — Guesser Submits a Guess (Priority: P1)

A guesser types a word and submits it. The frontend calls `POST /rooms/:code/guess`. The backend trims the input, compares it case-insensitively to `room.currentWord`, awards 100 points for a correct guess and 0 for incorrect, appends the guess to the room's guess history, and returns the updated snapshot. The guesser sees the result in the history and scoreboard.

**Why this priority**: Guessing is the other half of core gameplay. Without it the game cannot progress.

**Independent Test**: Tab B (guesser) submits "ROCKET". Response includes the guess in history with `score: 100`. Tab B's scoreboard shows 100. Within ≤4 s Tab A sees the same history.

**Acceptance Scenarios**:

1. **Given** a guesser types "ROCKET" and submits, **When** `POST /rooms/:code/guess` is called with `{ participantId, guess: "ROCKET" }`, **Then** the response includes the guess record `{ participantId, participantName, guess: "ROCKET", score: 100, correct: true }`.
2. **Given** a guesser submits "  rocket  " (padded), **When** the backend processes it, **Then** the trimmed value `"rocket"` is compared — result is `correct: true, score: 100`.
3. **Given** a guesser submits "pizza" (wrong word), **When** the backend processes it, **Then** the result is `correct: false, score: 0`; the guess still appears in history.
4. **Given** a guesser submits "  " (whitespace only), **When** `POST /rooms/:code/guess` is called, **Then** the response is `400` with a message; nothing is appended to history.
5. **Given** a guesser submits an empty string `""`, **When** the schema validates, **Then** the response is `400`.
6. **Given** a participant with `viewerRole === "drawer"` submits a guess, **When** the backend checks roles, **Then** the response is `403` — the drawer cannot guess.
7. **Given** a successful guess, **When** the frontend receives the response, **Then** `roomStore.setRoomSnapshot` is called with the updated room, and the `ResultPanel` and `Scoreboard` re-render with live data.

---

### User Story 3 — Guess History and Scoreboard Sync via Polling (Priority: P1)

All participants see the same guess history and scores. The existing 2 s polling loop in `GamePage` already calls `fetchRoom` — once the backend includes `guesses` and `scores` in the snapshot, polling delivers them automatically. `ResultPanel` and `Scoreboard` are wired to real data from `room`.

**Why this priority**: Without sync, only the guesser sees their own result. The drawer and other participants are blind to the game state.

**Independent Test**: Tab B submits a correct guess. Without any action on Tab A, within ≤4 s Tab A's `ResultPanel` shows the guess and `Scoreboard` shows 100 for Bob.

**Acceptance Scenarios**:

1. **Given** a guess is submitted by Tab B, **When** Tab A's polling fires next (within ≤4 s), **Then** `GET /rooms/:code?participantId=...` returns the updated `guesses` and `scores` in the snapshot.
2. **Given** the updated snapshot, **When** `ResultPanel` renders, **Then** each entry shows: participant name, their guess text, and whether it was correct.
3. **Given** the updated snapshot, **When** `Scoreboard` renders, **Then** each participant's current total score is shown, sorted by score descending.

---

### Edge Cases

- **Empty / whitespace-only guess**: rejected with `400` before any history append.
- **Drawer submits guess**: rejected with `403`.
- **Room not found on guess**: `404`.
- **Room not in `"playing"` status on guess**: `400` — cannot guess in a lobby.
- **Case-insensitivity**: `"ROCKET"`, `"Rocket"`, `"rOcKeT"` all score 100.
- **Multiple guesses from same participant**: once a participant has guessed correctly, further guess submissions are rejected with `400` ("You have already guessed correctly"). Wrong guesses before a correct one are allowed and appended normally.
- **Score display with 0**: wrong guesses must still appear in `ResultPanel` with 0 — not silently dropped.

---

## Requirements

### Functional Requirements

**Backend — Data Model**

- **FR-001**: Add `Guess` interface to `backend/src/models/game.ts`:
  ```typescript
  export interface Guess {
    participantId: string;
    participantName: string;
    guess: string;
    score: number;
    correct: boolean;
  }
  ```
- **FR-002**: Add `guesses: Guess[]` and `scores: Record<string, number>` to the `Room` interface.
- **FR-003**: Add `guesses: Guess[]` and `scores: Record<string, number>` to `RoomSnapshot`.
- **FR-004**: In `createRoom()` and `startGame()`, initialise `guesses: []` and `scores: {}` (with participants pre-seeded to 0) when transitioning to `"playing"`.

**Backend — Service**

- **FR-005**: Add `submitGuess(code, participantId, guessText)` to `roomStore.ts`. It MUST:
  - Return `{ code: "NOT_FOUND" }` if room absent.
  - Return `{ code: "BAD_REQUEST", message: "Game is not active" }` if `room.status !== "playing"`.
  - Return `{ code: "FORBIDDEN", message: "Drawer cannot guess" }` if `participantId === room.drawerParticipantId`.
  - Trim `guessText`; if empty after trim return `{ code: "BAD_REQUEST", message: "Guess cannot be empty" }`.
  - Return `{ code: "BAD_REQUEST", message: "You have already guessed correctly" }` if `room.guesses` already contains an entry with `participantId === participantId && correct === true`.
  - Compare trimmed guess case-insensitively to `room.currentWord`.
  - Build a `Guess` record: `score = correct ? 100 : 0`.
  - Append to `room.guesses`; add `score` to `room.scores[participantId]` (default 0 if not present).
  - `saveRoom(room)`; return `{ code: "OK", room: cloneRoom(room) }`.
- **FR-006**: Update `toRoomSnapshot()` to include `guesses: room.guesses` and `scores: room.scores`.

**Backend — Route & Schema**

- **FR-007**: Add `guessSchema` to `schemas.ts`: `{ participantId: z.string().trim().min(1), guess: z.string() }` — note: `guess` is `z.string()` (not min(1)); empty-string rejection is handled in the service after trim, so the schema accepts it and the service rejects it with a meaningful message.
- **FR-008**: Add `POST /rooms/:code/guess` route to `rooms.ts`. Translate result codes: `NOT_FOUND → 404`, `FORBIDDEN → 403`, `BAD_REQUEST → 400`, `OK → 200` with `{ room: toRoomSnapshot(result.room, participantId) }`.

**Frontend — Types**

- **FR-009**: Add `Guess` interface to `frontend/src/services/api.ts` matching the backend shape.
- **FR-010**: Add `guesses: Guess[]` and `scores: Record<string, number>` to the local `RoomSnapshot` interface.
- **FR-011**: Add `api.submitGuess(code, participantId, guess)` → `POST /rooms/:code/guess`, returning `{ room: RoomSnapshot }`.

**Frontend — Canvas (US1)**

- **FR-012**: In `GamePage.tsx`, replace the canvas `<div>` placeholder with a `<canvas>` element when `viewerRole === "drawer"`. Keep the `<div>` placeholder for guessers.
- **FR-013**: Attach `mousedown`, `mousemove`, `mouseup`, and `mouseleave` handlers via a `useRef<HTMLCanvasElement>` and a `useEffect`. Draw with `CanvasRenderingContext2D.lineTo` / `stroke`. Use black, 2px line width.
- **FR-014**: Add a Clear button below the canvas (drawer only) that calls `ctx.clearRect(0, 0, canvas.width, canvas.height)`.

**Frontend — GuessForm (US2)**

- **FR-015**: `GuessForm` must accept an `onSubmit: (guess: string) => Promise<void>` prop and a `error: string | null` prop. The form calls `onSubmit(guessText)` on submit; displays `error` when non-null; clears the input after successful submission.
- **FR-016**: `GamePage.tsx` passes `onSubmit` that calls `api.submitGuess`, then calls `roomStore.setRoomSnapshot(response.room)`. On error, stores the message in local state and passes it as `error` to `GuessForm`.

**Frontend — ResultPanel & Scoreboard (US3)**

- **FR-017**: `ResultPanel` must accept `guesses: Guess[]` prop and render each entry: participant name, guess text, "✓" or "✗", score.
- **FR-018**: `Scoreboard` must accept `scores: Record<string, number>` and `participants: Participant[]` props and render each participant's name and total score, sorted descending.
- **FR-019**: `GamePage.tsx` passes `room.guesses` to `ResultPanel` and `{ scores: room.scores, participants: room.participants }` to `Scoreboard`.

### Key Entities

- **Guess** (new): `{ participantId, participantName, guess, score, correct }` — appended to `Room.guesses[]` on every valid submission.
- **Room** (extended): adds `guesses: Guess[]` and `scores: Record<string, number>`.
- **RoomSnapshot** (extended): adds `guesses: Guess[]` and `scores: Record<string, number>`.

---

## Implementation Notes (per file)

### `backend/src/models/game.ts`
Add `Guess` interface. Add `guesses` and `scores` to `Room` and `RoomSnapshot`.

### `backend/src/services/roomStore.ts`
- `createRoom()`: add `guesses: [], scores: {}` to room literal.
- `startGame()`: after setting `status = "playing"`, seed `scores` with all participant ids set to 0.
- Add `submitGuess()` per FR-005.
- `toRoomSnapshot()`: spread `guesses: room.guesses, scores: { ...room.scores }`.

### `backend/src/api/schemas.ts`
```typescript
export const guessSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID is required"),
  guess: z.string()
});
```

### `backend/src/api/rooms.ts`
Add `POST /:code/guess` after `POST /:code/start`.

### `frontend/src/services/api.ts`
Add `Guess` interface, extend `RoomSnapshot`, add `api.submitGuess()`.

### `frontend/src/pages/GamePage.tsx`
- Replace canvas placeholder with `<canvas ref={canvasRef}>` when `isDrawer`.
- Add drawing `useEffect` with mouse event handlers.
- Add Clear button for drawer.
- Add `guessError` state; pass `onSubmit` and `error` to `<GuessForm>`.
- Pass `room.guesses` to `<ResultPanel>` and score data to `<Scoreboard>`.

### `frontend/src/components/GuessForm.tsx`
Add `onSubmit` and `error` props. Wire form submission. Clear input on success.

### `frontend/src/components/ResultPanel.tsx`
Accept `guesses: Guess[]` prop. Render guess list.

### `frontend/src/components/Scoreboard.tsx`
Accept `scores` and `participants` props. Render sorted score list.

---

## Success Criteria

- **SC-001**: Drawer can draw on `<canvas>` and click Clear to wipe it.
- **SC-002**: Guesser submitting "ROCKET" → response `correct: true, score: 100`.
- **SC-003**: Guesser submitting "  rocket  " (padded) → `correct: true, score: 100`.
- **SC-004**: Guesser submitting "pizza" → `correct: false, score: 0`; appears in history.
- **SC-005**: Submitting whitespace-only → `400`, nothing appended to history.
- **SC-006**: Drawer submitting a guess → `403`.
- **SC-007**: Within ≤4 s of Tab B's correct guess, Tab A's `ResultPanel` and `Scoreboard` show the updated data via polling.
- **SC-007a**: After a correct guess, a second guess attempt from the same participant returns `400` with "You have already guessed correctly"; the score and history remain unchanged.
- **SC-008**: `GuessForm` is disabled for drawer (already implemented in Group 2 — regression check).
- **SC-009**: `npm run build` passes with zero TypeScript errors on both packages.
- **SC-010**: `npm test` passes with no regressions.

---

## Assumptions

- Canvas drawing is **local only** — strokes are not synced to other participants. Syncing canvas state is permanently out of scope per the constitution (no WebSockets, no binary data over HTTP polling).
- `<canvas>` dimensions: fixed at the container width × 500 px height, matching the existing placeholder `minHeight: 500px`.
- `GuessForm` props are additive — `disabled` prop already exists and is kept. `onSubmit` and `error` are new additions.
- `Scoreboard` and `ResultPanel` receive data as props (not from context) — keeps them pure and testable.
- Multiple correct guesses from the same participant are allowed and scores accumulate (no "already guessed correctly" gating for this group).
- **Correct guess does not automatically end the round in this implementation** — UPDATED: as of the fix applied addressing evaluation findings, submitGuess now sets room.status = "results" when correct === true, triggering automatic round-end. The host "End Game" button remains as a manual fallback for rounds where no one guesses correctly.

---

## Out of Scope for This Group

- Canvas stroke sync to other participants
- Canvas stroke synchronization to other participants — drawing is local to the drawer only. Syncing strokes over HTTP polling would require binary image encoding or a stroke-delta protocol, neither feasible within the in-memory + 2s polling constraints. Guessers see a static placeholder while the drawer draws. **Deviation from scenario 3 literal wording documented here.**
- Round end / correct-guess-ends-round logic (Group 4)
- Restart flow (Group 4)
- Drawer rotation (out of scope per constitution)
- Timer or auto-end (out of scope per constitution)
