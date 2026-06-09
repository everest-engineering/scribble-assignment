# Implementation Plan: Gameplay Interaction

**Feature Group**: 003 — Gameplay Interaction
**Date**: 2026-06-09
**Spec**: `.specify/specs/003-gameplay-interaction.md`
**Input**: Discovery notes + spec + constitution

---

## Summary

Add the core gameplay loop: a functional drawing canvas for the drawer, a guess
submission system with case-insensitive comparison, per-participant scoring, and
guess history synchronized to all participants via polling. The backend manages
guess validation, scoring, and history storage. The frontend replaces the canvas
placeholder with an interactive canvas, wires the GuessForm to the API, and
displays real scores and guess history.

---

## Constitution Check

| Principle | Relevance | Status |
|---|---|---|
| I. Spec-Driven Development | All work must trace to spec requirements | ✅ Plan maps to FR-001 through FR-009 |
| II. TypeScript Quality & Validation | Input validation, no `any` | ✅ Zod schema for guess body; backend validates correctness |
| III. Incremental Delivery | One feature group at a time | ✅ Only gameplay interaction scope (drawing, guessing, scoring) |
| IV. Traceability & Documentation | Tasks traceable to spec | ✅ Spec FR/AC references throughout |
| V. Review Discipline | Edge cases, isolation, no out-of-scope | ✅ Non-goals section in spec; drawer-cannot-guess enforced server-side |

No gates violated. No complexity justification needed.

---

## 1. State Model Changes

### Backend — `src/models/game.ts`

| Change | Rationale | Spec Reference |
|---|---|---|
| Add `score: number` to `Participant` | Tracks cumulative points per participant (initialized to 0) | FR-008, FR-009, AC-008, AC-010 |
| Add new `Guess` interface | Represents a single guess: id, participantId, text, isCorrect, timestamp | FR-007, AC-012 |
| Add `guesses: Guess[]` to `Room` | Stores ordered guess history for the active round | FR-007, AC-011 |
| Add `guesses: Guess[]` to `RoomSnapshot` | Exposes guess history to all participants via API responses | FR-007, AC-011, AC-012 |

**No changes to `RoomStatus`** — stays `"lobby" | "playing"`.

**No changes to `RoomSessionResponse`** — unchanged shape.

**No changes to `ParticipantRole`** — retained but not used in this FG.

### New Type — `Guess`

```typescript
export interface Guess {
  id: string;
  participantId: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}
```

### Frontend — `src/services/api.ts`

| Change | Rationale | Spec Reference |
|---|---|---|
| Add `score: number` to `Participant` | Mirrors backend type | FR-008 |
| Add `Guess` interface | Mirrors backend type | FR-007 |
| Add `guesses: Guess[]` to `RoomSnapshot` | Mirrors backend type | FR-007 |
| Add `submitGuess` method to API client | Calls new `POST /rooms/:code/guess` | FR-003 |

### Frontend — `src/state/roomStore.ts`

| Change | Rationale | Spec Reference |
|---|---|---|
| Add `submitGuess(text: string)` action | Calls API and updates room snapshot with new guesses and scores | FR-003, FR-007, FR-008 |

---

## 2. Backend Changes

### Schemas (`src/api/schemas.ts`)

- Add `submitGuessBodySchema` (Zod):
  ```typescript
  export const submitGuessBodySchema = z.object({
    participantId: z.string(),
    text: z.string().trim().min(1, "Guess cannot be empty")
  });
  ```
- The `.trim().min(1)` chain rejects whitespace-only guesses at the schema
  layer before they reach the service layer.

### Room Store (`src/services/roomStore.ts`)

- **`createParticipant`** — update:
  - Add `score: 0` to the returned participant object.
  - All participants created during lobby phase will have score 0, carried
    forward when the game starts.

- **`startGame`** — update:
  - After setting `drawerId` and `secretWord`, initialize every participant's
    score to 0 (defensive: scores are already 0 from `createParticipant`, but
    explicit initialization ensures correctness).
  - Initialize `room.guesses = []`.
  - Import the new `Guess` type from models.

- **`submitGuess(code, participantId, text)`** — new function:
  - Look up room by code. Return `{ ok: false, status: 404, message }` if not
    found.
  - Return `{ ok: false, status: 400, message }` if room status is not
    `"playing"`.
  - Find the participant in the room. Return `{ ok: false, status: 403,
    message }` if the participant is the drawer ("Only guessers can submit
    guesses").
  - Trim the text (defensive — Zod already trims, but trim again for safety).
  - Reject if text is empty after trim (`{ ok: false, status: 400, message
    "Guess cannot be empty" }`).
  - Compare: `text.toLowerCase() === room.secretWord.toLowerCase()`.
  - Create a `Guess` record with:
    - `id`: randomUUID()
    - `participantId`: the guesser's ID
    - `text`: the trimmed guess text (as submitted, not lowercased — preserve
      original casing for display)
    - `isCorrect`: boolean result of comparison
    - `timestamp`: now()
  - If correct: increment the participant's `score` by 100.
  - Push the guess to `room.guesses`.
  - Update `room.updatedAt`.
  - Return `{ ok: true, room: cloneRoom(room) }`.
  - **Error path**: Use discriminated union return type (same pattern as
    `startGame`): `{ ok: false, status, message } | { ok: true, room }`.

- **`toRoomSnapshot`** — update:
  - Include `guesses: room.guesses.map(...) ` in the returned snapshot.
  - No need to filter guesses by viewer — all participants see the full guess
    history (spec AC-011).

### Routes (`src/api/rooms.ts`)

- **Add `POST /:code/guess` route**:
  - Validate params with `roomCodeParamsSchema`.
  - Validate body with `submitGuessBodySchema`.
  - Call `submitGuess(code.toUpperCase(), participantId, text)`.
  - On `!result.ok`: throw `HttpError(result.status, result.message)`.
  - On success: `response.json({ room: toRoomSnapshot(result.room, participantId) })`.
  - Wrap in try/catch with `next(error)`.

- **No other route changes needed.** The existing `GET /:code` route already
  calls `toRoomSnapshot`, which will now include `guesses`.

---

## 3. Frontend Changes

### API Service (`src/services/api.ts`)

- Add `Guess` interface:
  ```typescript
  export interface Guess {
    id: string;
    participantId: string;
    text: string;
    isCorrect: boolean;
    timestamp: string;
  }
  ```
- Add `score: number` to `Participant`.
- Add `guesses: Guess[]` to `RoomSnapshot`.
- Add `submitGuess` method:
  ```typescript
  submitGuess(code: string, participantId: string, text: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/guess`, {
      method: "POST",
      body: JSON.stringify({ participantId, text })
    });
  }
  ```

### Room Store (`src/state/roomStore.ts`)

- Add `submitGuess(text: string)` action:
  - Guard: return null if no room or no participantId.
  - Call `api.submitGuess(room.code, participantId, text)` via `withLoading`.
  - On success: call `setRoomSnapshot(response.room)` to update state with new
    guesses and scores.
  - Return the response.
  - Errors (empty guess, drawer-guessing, not playing) are handled by
    `withLoading` setting error state.

### Game Page (`src/pages/GamePage.tsx`)

- **Replace canvas placeholder**: Render an interactive `<canvas>` element for
  the drawer. For guessers, continue showing a read-only area or placeholder.
- **Add clear canvas button**: Visible only to the drawer. Clears all marks
  from the canvas.
- **Pass drawer state to GuessForm**: Disable the guess form for the drawer.
- **Pass scores to Scoreboard**: Replace the hardcoded Scoreboard with one
  that reads `participants` from room state.
- **Pass guesses to ResultPanel**: Replace the hardcoded ResultPanel with one
  that reads `guesses` from room state.

### GuessForm Component (`src/components/GuessForm.tsx`)

- **Accept `onSubmitGuess` callback** or use the store directly (via dependency
  injection or store import).
- **Add client-side validation**: Reject empty/whitespace-only guesses inline
  before submitting.
- **Wire `handleSubmit`**: Call `roomStore.submitGuess(text)`.
- **Clear input on successful submission**.
- **Show validation and API errors inline**.
- **Disable input and submit button when `disabled` prop is true** (drawer
  case).

### Scoreboard Component (`src/components/Scoreboard.tsx`)

- **Accept participants list** as a prop (or read from store via context).
- **Display each participant's name and score** in a list.
- **Highlight the drawer** (optional visual distinction).
- **Show "No participants" fallback** when the list is empty.

### ResultPanel Component (`src/components/ResultPanel.tsx`)

- **Accept guesses list** as a prop.
- **Display each guess in order**: guesser name, guess text, correct/incorrect
  indicator, relative time.
- **Show empty state**: "No guesses yet" when the list is empty.

---

## 4. API Changes

### New Endpoint

| Method | Path | Request Body | Success Response | Error Responses |
|---|---|---|---|---|
| POST | `/rooms/:code/guess` | `{ participantId: string, text: string }` | `200` `{ room: RoomSnapshot }` | `404` room not found, `403` drawer cannot guess, `400` empty guess or not playing |

### Modified Endpoints

| Method | Path | Change |
|---|---|---|
| POST | `/rooms/:code/start` | Response now includes `guesses: []` (empty array) and `score: 0` on each participant |
| GET | `/rooms/:code` | Response now includes `guesses: Guess[]` and `score` on each participant |
| POST | `/rooms` | Response now includes `score: 0` on each participant (from `createParticipant`) |
| POST | `/rooms/:code/join` | Response now includes `score: 0` on the joining participant |

### Response Shape Change

Current `Participant`:
```typescript
{ id, name, joinedAt }
```

New `Participant`:
```typescript
{ id, name, joinedAt, score }
```

Current `RoomSnapshot`:
```typescript
{ code, status, participants, hostId, drawerId, secretWord? }
```

New `RoomSnapshot`:
```typescript
{ code, status, participants, hostId, drawerId, secretWord?, guesses }
```

---

## 5. Data Flow

### Guess Submission (Guesser)

```
[Guesser types guess, clicks Submit]
  ↓
[GuessForm] client-side: reject empty/whitespace
  ↓ if valid
[GamePage] calls roomStore.submitGuess(text)
  ↓
[RoomStore.submitGuess]
  ↓ POST /rooms/:code/guess { participantId, text }
[Backend] validate: room exists? status === "playing"? not drawer?
  trim text, lowercase, compare to secretWord
  ↓ on success:
    create Guess { id, participantId, text, isCorrect, timestamp }
    if correct: participant.score += 100
    push to room.guesses
    update room.updatedAt
  ↓ return toRoomSnapshot(room, participantId)
    → includes updated guesses + scores
[RoomStore] setRoomSnapshot(snapshot)
  ↓ re-render
[GamePage] GuessForm clears input
  Scoreboard shows updated scores
  ResultPanel shows new guess in history
```

### Guess Seen by Other Participants (via Polling)

```
[Other participant's GamePage]
  ↓ polling interval fires (every 2s)
[RoomStore.fetchRoom]
  ↓ GET /rooms/:code?participantId=xxx
[Backend] toRoomSnapshot(room, participantId)
  → includes current guesses array + scores
[RoomStore] setRoomSnapshot(snapshot)
  ↓ re-render
[GamePage] Scoreboard and ResultPanel reflect updated state
```

### Canvas Drawing (Drawer Only, Local)

```
[Drawer mousedown on canvas] → start drawing stroke
[Drawer mousemove on canvas] → continue stroke, render pixels
[Drawer mouseup on canvas] → end stroke
[Drawer clicks "Clear Canvas"] → clear all pixels, reset canvas
```

### Score Initialization at Game Start

```
[Host clicks Start Game]
  ↓
[Backend startGame]
  · set drawerId, secretWord, status = "playing"
  · initialize room.guesses = []
  · ensure every participant.score = 0
  ↓ return toRoomSnapshot → participants have score:0, guesses:[]
[RoomStore] setRoomSnapshot
  ↓ re-render
[Scoreboard] shows all participants with score 0
[ResultPanel] shows "No guesses yet"
```

---

## 6. File-Level Impact Analysis

### Files to Modify

| File | Change Type | Summary |
|---|---|---|
| `backend/src/models/game.ts` | **Extend** | Add `Guess` interface; add `score: number` to `Participant`; add `guesses: Guess[]` to `Room` and `RoomSnapshot` |
| `backend/src/api/schemas.ts` | **Extend** | Add `submitGuessBodySchema` with `participantId: string` and `text: string` (trimmed, min 1) |
| `backend/src/services/roomStore.ts` | **Extend** | Add `submitGuess` function; update `createParticipant` to include `score: 0`; update `startGame` to initialize scores and guesses; update `toRoomSnapshot` to include `guesses` |
| `backend/src/api/rooms.ts` | **Extend** | Add `POST /:code/guess` route |
| `frontend/src/services/api.ts` | **Extend** | Add `Guess` interface; add `score` to `Participant`; add `guesses` to `RoomSnapshot`; add `submitGuess` API method |
| `frontend/src/state/roomStore.ts` | **Extend** | Add `submitGuess` action method |
| `frontend/src/pages/GamePage.tsx` | **Rework** | Replace canvas placeholder with interactive canvas; add clear button; pass data to child components |
| `frontend/src/components/GuessForm.tsx` | **Rework** | Implement `handleSubmit`; add validation; call store; clear on success; show errors |
| `frontend/src/components/Scoreboard.tsx` | **Rework** | Accept participants; display real names and scores |
| `frontend/src/components/ResultPanel.tsx` | **Rework** | Accept guesses; display ordered history with correct/incorrect indicators |

### Files to Extend (Tests)

| File | Change Type | Summary |
|---|---|---|
| `backend/src/services/roomStore.test.ts` | **Extend** | Tests for `submitGuess`: valid correct guess, valid incorrect guess, empty guess, drawer-guesser, wrong room code, not playing |
| `backend/src/api/schemas.test.ts` | **Extend** | Tests for `submitGuessBodySchema`: valid body, empty text, whitespace-only text |
| `frontend/src/services/api.test.ts` | **Extend** | Test `submitGuess` sends POST with correct body |
| `frontend/src/state/roomStore.test.ts` | **Extend** | Test `submitGuess` action: calls API and updates state |

### Files Unchanged

| File | Rationale |
|---|---|
| `backend/src/api/router.ts` | No routing changes |
| `backend/src/app.ts` | No app-level configuration changes |
| `backend/src/server.ts` | No server configuration changes |
| `backend/src/seed/starterData.ts` | Word list unchanged |
| `frontend/src/pages/LobbyPage.tsx` | No changes needed |
| `frontend/src/pages/CreateRoomPage.tsx` | No changes needed |
| `frontend/src/pages/JoinRoomPage.tsx` | No changes needed |
| `frontend/src/pages/StartPage.tsx` | No changes needed |
| `frontend/src/components/Card.tsx` | No changes needed |
| `frontend/src/components/PageHeader.tsx` | No changes needed |
| `frontend/src/components/RoomCodeBadge.tsx` | No changes needed |
| `frontend/src/styles/app.css` | Existing styles likely sufficient; minor additions possible for canvas and guess history |

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Race: two simultaneous guesses** | Low | Both guesses processed sequentially (Node.js single-threaded); Map operations are synchronous | No race condition on in-memory store; each guess creates a unique entry |
| **Canvas event handling bugs (mouse vs touch)** | Medium | Drawer cannot draw on mobile/touch devices | Initially support mouse events only (mouse + pointer events). Touch support can be added later. Spec does not require mobile support. |
| **Large guess history degrades polling performance** | Low | Larger response payloads over time | Acceptable for lab-scale use with single-round game. No pagination needed. |
| **Canvas clearing on window resize / re-render** | Medium | Drawer loses drawing on React re-render | Use a ref to the canvas element; persist drawing state in a separate offscreen canvas or image data. Re-render cycle should not clear the visible canvas. |
| **`submitGuess` called while not in playing state (race via polling)** | Low | Backend returns 400; guesser sees error | Error state is set in the store; guesser can retry. Defensive: GamePage should disable GuessForm when `room.status !== "playing"`. |
| **Stale participant list**: A guesser submits, but their participant object in the local store doesn't have `score` yet | Low | TypeScript error or runtime NaN | Ensure `createParticipant` always initializes `score: 0`. The store is updated from the API response after each submission. |

---

## 8. Validation Strategy

### Automated Tests

| Area | What to Test | Tool |
|---|---|---|
| Schema — submitGuess | Valid body passes; empty text rejected; whitespace-only rejected | Vitest (backend) |
| Room store — submitGuess | Correct guess awards 100 points; incorrect guess awards 0 | Vitest (backend) |
| Room store — submitGuess | Empty guess rejected with 400 | Vitest (backend) |
| Room store — submitGuess | Drawer submitting returns 403 | Vitest (backend) |
| Room store — submitGuess | Unknown room code returns 404 | Vitest (backend) |
| Room store — submitGuess | Room not in playing state returns 400 | Vitest (backend) |
| Room store — toRoomSnapshot | Guesses array present in snapshot | Vitest (backend) |
| Room store — toRoomSnapshot | Score present on each participant | Vitest (backend) |
| Room store — startGame | Guesses initialized to empty array | Vitest (backend) |
| Room store — startGame | All participants have score 0 | Vitest (backend) |
| API client — submitGuess | Sends POST to /rooms/:code/guess with correct body | Vitest (frontend) |
| Room store — submitGuess | Calls API and updates snapshot on success | Vitest (frontend) |
| Room store — submitGuess | Sets error state on failure | Vitest (frontend) |
| FG1 + FG2 regression | All existing tests continue to pass | Vitest (both) |

### Manual Validation (Two Browser Tabs)

| Scenario | Steps | Expected |
|---|---|---|
| Drawer draws on canvas | Tab A (drawer) draws on the canvas. | Visible marks appear on Tab A's screen in real time. |
| Drawer clears canvas | Tab A clicks "Clear Canvas". | All marks removed from Tab A's canvas. |
| Guesser submits correct guess | Tab B types the secret word and submits. | Tab B's guess accepted; Tab B gains 100 points; guess appears in history on both tabs within ~3s. |
| Guesser submits incorrect guess | Tab B types a wrong word. | Guess appears in history as incorrect; score unchanged. |
| Empty guess rejected | Tab B submits empty string. | Inline error message; guess not recorded. |
| Drawer cannot guess | Tab A attempts to submit a guess. | Error message displayed; guess not recorded. |
| Guess history visible to all | After several guesses, observe both tabs. | Both tabs show identical guess history with correct/incorrect indicators. |
| Scores update correctly | After correct guesses, observe Scoreboard. | Guesser's score increments by 100 per correct guess. |
| Two separate rooms | Two separate sessions both playing. | Guesses and scores from Room A not visible in Room B. |

### Validation Gate

All acceptance criteria AC-001 through AC-014 must pass before Feature Group 3
is considered complete. Progression to Feature Group 4 (Result & Restart) is
not permitted until this gate passes.
