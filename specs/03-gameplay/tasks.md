# Tasks: Group 3 — Gameplay Interaction

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel with other [P] tasks in the same phase
- **[US#]**: User story this task belongs to

---

## Phase 1: Backend Model Extension (BLOCKING)

**Purpose**: Add `Guess` type and extend `Room` + `RoomSnapshot`. Backend will not compile until all tasks in this phase are done.

**⚠️ CRITICAL**: No other phase can begin until `npm run build` in `backend/` exits 0.

- [ ] T001 [US2] In `backend/src/models/game.ts`: add `Guess` interface:
  ```typescript
  export interface Guess {
    participantId: string;
    participantName: string;
    guess: string;
    score: number;
    correct: boolean;
  }
  ```
- [ ] T002 [US2] In `backend/src/models/game.ts`: add `guesses: Guess[]` and `scores: Record<string, number>` to the `Room` interface
- [ ] T003 [US3] In `backend/src/models/game.ts`: add `guesses: Guess[]` and `scores: Record<string, number>` to the `RoomSnapshot` interface

**Checkpoint**: `npm run build` in `backend/` exits 0. TypeScript will surface broken construction sites in `roomStore.ts` — fix them in Phase 2.

---

## Phase 2: Service Logic

**Purpose**: Initialise new fields, implement `submitGuess()`, update snapshot mapping.

**Depends on**: Phase 1 complete.

- [ ] T004 [US2] In `backend/src/services/roomStore.ts` → `createRoom()`: add `guesses: [], scores: {}` to the room literal (TypeScript enforces after T002)
- [ ] T005 [US2] In `backend/src/services/roomStore.ts` → `startGame()`: after setting `status = "playing"`, seed scores for all participants: `room.scores = Object.fromEntries(room.participants.map(p => [p.id, 0]))`
- [ ] T006 [US2] In `backend/src/services/roomStore.ts`: add `submitGuess(code: string, participantId: string, guessText: string)` function:
  - `NOT_FOUND` if room absent
  - `BAD_REQUEST` ("Game is not active") if `room.status !== "playing"`
  - `FORBIDDEN` ("Drawer cannot guess") if `participantId === room.drawerParticipantId`
  - Trim `guessText`; `BAD_REQUEST` ("Guess cannot be empty") if empty after trim
  - `BAD_REQUEST` ("You have already guessed correctly") if `room.guesses.some(g => g.participantId === participantId && g.correct)`
  - `correct = trimmed.toLowerCase() === (room.currentWord ?? "").toLowerCase()`
  - `score = correct ? 100 : 0`
  - Lookup `participantName` from `room.participants.find(p => p.id === participantId)?.name ?? "Unknown"`
  - Push `{ participantId, participantName, guess: trimmed, score, correct }` to `room.guesses`
  - `room.scores[participantId] = (room.scores[participantId] ?? 0) + score`
  - `saveRoom(room)`; return `{ code: "OK", room: cloneRoom(room) }`
- [ ] T007 [US3] In `backend/src/services/roomStore.ts` → `toRoomSnapshot()`: add `guesses: room.guesses.map(g => ({ ...g }))` and `scores: { ...room.scores }` to the returned object

**Checkpoint**: `npm run build` in `backend/` exits 0.

---

## Phase 3: Schema + Route — parallel with Phase 4

**Purpose**: Expose `POST /rooms/:code/guess` over HTTP.

**Depends on**: Phase 2 complete.

- [ ] T008 [US2] In `backend/src/api/schemas.ts`: add:
  ```typescript
  export const guessSchema = z.object({
    participantId: z.string().trim().min(1, "Participant ID is required"),
    guess: z.string()
  });
  ```
- [ ] T009 [US2] In `backend/src/api/rooms.ts`: import `submitGuess` from `roomStore` and `guessSchema` from `schemas`; add `POST /:code/guess` route after `POST /:code/start`:
  - Parse params with `roomCodeParamsSchema`, body with `guessSchema`
  - Call `submitGuess(code.toUpperCase(), participantId, guess)`
  - `NOT_FOUND → 404`, `FORBIDDEN → 403`, `BAD_REQUEST → 400` (with `result.message`), `OK → 200` with `{ room: toRoomSnapshot(result.room, participantId) }`

**Checkpoint**: Five curl smoke tests:
```bash
# Correct guess → 200, score: 100
# Wrong guess → 200, score: 0
# Whitespace-only "   " → 400
# Drawer participantId → 403
# Unknown room code → 404
```

---

## Phase 4: Frontend Types + API Function — parallel with Phase 3

**Purpose**: Extend the frontend's local types and add `api.submitGuess()`.

**Depends on**: Phase 2 complete.

- [ ] T010 [US2] In `frontend/src/services/api.ts`: add `Guess` interface matching the backend shape (same fields as T001)
- [ ] T011 [US3] In `frontend/src/services/api.ts`: add `guesses: Guess[]` and `scores: Record<string, number>` to the local `RoomSnapshot` interface
- [ ] T012 [US2] In `frontend/src/services/api.ts`: add `submitGuess(code: string, participantId: string, guess: string)` to the `api` object — `POST /rooms/:code/guess` with body `{ participantId, guess }`, returning `Promise<{ room: RoomSnapshot }>`

**Checkpoint**: `npm run build` in `frontend/` exits 0. `room.guesses` and `room.scores` are accessible without TypeScript errors in `GamePage.tsx`.

---

## Phase 5: Component Updates (all parallel)

**Purpose**: Make `GuessForm`, `ResultPanel`, and `Scoreboard` accept and render real data.

**Depends on**: Phase 4 complete (needs `Guess` type in scope).

- [ ] T013 [P] [US2] In `frontend/src/components/GuessForm.tsx`: add `onSubmit: (guess: string) => Promise<void>` and `error: string | null` props to the `GuessFormProps` interface; update `handleSubmit` to call `await props.onSubmit(guessText)` then clear the input; render `{props.error && <p ...>{props.error}</p>}` below the button
- [ ] T014 [P] [US3] In `frontend/src/components/ResultPanel.tsx`: add `guesses: Guess[]` prop (import `Guess` from `../services/api`); replace the placeholder block with a list rendering each guess as `{participantName}: "{guess}" — {correct ? "✓" : "✗"} {score} pts`; show "No guesses yet." when `guesses.length === 0`
- [ ] T015 [P] [US3] In `frontend/src/components/Scoreboard.tsx`: add `scores: Record<string, number>` and `participants: Participant[]` props (import `Participant` from `../services/api`); sort participants by `scores[p.id] ?? 0` descending; render each as `{name} — {score} pts`

**Checkpoint**: `npm run build` in `frontend/` exits 0 (props are required — GamePage will have TypeScript errors until Phase 6 passes them).

---

## Phase 6: GamePage Wiring

**Purpose**: Connect everything — canvas, guess submission, and component props.

**Depends on**: Phase 5 complete.

- [ ] T016 [US1] In `frontend/src/pages/GamePage.tsx`: add `import { useRef } from "react"` and `const canvasRef = useRef<HTMLCanvasElement>(null)`
- [ ] T017 [US1] In `frontend/src/pages/GamePage.tsx`: add a drawing `useEffect` that runs when `isDrawer` is true — attaches `mousedown`, `mousemove`, `mouseup`, `mouseleave` handlers to `canvasRef.current`; draws with `ctx.lineTo` / `ctx.stroke`; returns cleanup that removes all four listeners
- [ ] T018 [US1] In `frontend/src/pages/GamePage.tsx`: replace the canvas `<div>` placeholder with:
  - `isDrawer`: `<canvas ref={canvasRef} width={800} height={500} style={{ border: "1px solid #e5e7eb", backgroundColor: "#ffffff" }} />`
  - guesser: keep the existing `<div>` placeholder unchanged
- [ ] T019 [US1] In `frontend/src/pages/GamePage.tsx`: add a Clear button below the canvas, rendered only when `isDrawer`:
  ```tsx
  <button className="button button--secondary" onClick={() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }}>Clear</button>
  ```
- [ ] T020 [US2] In `frontend/src/pages/GamePage.tsx`: add `guessError` state (`useState<string | null>(null)`); add `handleGuess` async function that calls `api.submitGuess(room.code, participantId ?? "", guess)`, then `roomStore.setRoomSnapshot(response.room)`, sets `guessError` on failure
- [ ] T021 [US2] In `frontend/src/pages/GamePage.tsx`: update `<GuessForm>` to pass `onSubmit={handleGuess}` and `error={guessError}`
- [ ] T022 [US3] In `frontend/src/pages/GamePage.tsx`: update `<ResultPanel>` to pass `guesses={room.guesses}`
- [ ] T023 [US3] In `frontend/src/pages/GamePage.tsx`: update `<Scoreboard>` to pass `scores={room.scores}` and `participants={room.participants}`

**Checkpoint**: Full acceptance test:
1. Tab A (drawer): draw on canvas → strokes appear; click Clear → blank
2. Tab B (guesser): submit "ROCKET" → score 100 in history
3. Tab B: submit "  rocket  " → score 100 (trimmed)
4. Tab B: submit "pizza" → score 0, appears in history
5. Tab B: submit "" or "   " → rejected with message, history unchanged
6. Tab A: GuessForm is disabled
7. Tab A: within ≤4 s sees Tab B's guess in ResultPanel and 100 on Scoreboard

---

## Phase 7: Build & Test Verification

- [ ] T024 [P] `npm run build` in `backend/` — zero TypeScript errors
- [ ] T025 [P] `npm run build` in `frontend/` — zero TypeScript errors
- [ ] T026 [P] `npm test` in `backend/` — all pass
- [ ] T027 [P] `npm test` in `frontend/` — all pass

---

## Dependencies & Execution Order

```
T001–T003  (Phase 1 — game.ts, one edit pass)
    ↓
T004–T007  (Phase 2 — roomStore.ts, one edit pass)
    ↓
T008–T009  (Phase 3 — backend schema+route)    T010–T012  (Phase 4 — frontend types+api)
    ↓                                                    ↓
                    T013 [P]  T014 [P]  T015 [P]    (Phase 5 — components, fully parallel)
                                    ↓
                    T016 → T017 → T018 → T019 → T020 → T021 → T022 → T023   (Phase 6 — GamePage)
                                    ↓
                    T024 [P]  T025 [P]  T026 [P]  T027 [P]   (Phase 7)
```

### Parallel opportunities
- T001–T003: one edit pass in `game.ts`
- T004–T007: one edit pass in `roomStore.ts`
- Phase 3 and Phase 4: fully parallel (different codebases)
- T013, T014, T015: fully parallel (different files)
- T024–T027: fully parallel

---

## Out of Scope

- Canvas stroke sync to other participants
- Round end triggered by correct guess (Group 4)
- Restart flow (Group 4)
