# Implementation Plan: Group 3 — Gameplay Interaction

**Branch**: `group-3-gameplay` | **Date**: 2026-05-31 | **Spec**: [spec.md](spec.md) | **Tasks**: [tasks.md](tasks.md)

---

## Summary

Extend the room model with `Guess`, `guesses[]`, and `scores`, add `POST /rooms/:code/guess` with trim + case-insensitive evaluation, wire `GuessForm` to the real API, replace the canvas `<div>` with a functional `<canvas>` for the drawer, and feed `ResultPanel` and `Scoreboard` from live snapshot data. The existing 2 s polling loop in `GamePage` delivers updates to all participants automatically.

---

## Technical Context

**Language/Version**: TypeScript 5.6 strict, Node 18+

**Primary Dependencies**: Express 4, React 18, Zod 3, native Canvas API — no new packages

**Storage**: In-memory `Map<string, Room>` — `guesses: Guess[]` and `scores: Record<string, number>` added to the existing `Room` object

**Testing**: Vitest on both packages

**Constraints**: No WebSockets, no new npm dependencies, TypeScript strict, no `any`

---

## Constitution Check

| Rule | Status | Notes |
|---|---|---|
| Extend existing files only | ✅ | All 8 changed files already exist |
| No new npm dependencies | ✅ | Canvas uses native browser API |
| Zod schema in `schemas.ts` | ✅ | `guessSchema` added there |
| All API calls through `api.ts` | ✅ | `api.submitGuess()` added there |
| Polling via `setInterval`/`clearInterval` | ✅ | Already in place from Group 2 — no change |
| TypeScript strict, no `any` | ✅ | All new fields fully typed |

No violations.

---

## Project Structure

### Files that change

```text
backend/src/
├── models/
│   └── game.ts               ← add Guess interface; add guesses + scores to Room + RoomSnapshot
├── services/
│   └── roomStore.ts          ← initialise guesses/scores in createRoom + startGame;
│                               add submitGuess(); update toRoomSnapshot()
└── api/
    ├── schemas.ts            ← add guessSchema
    └── rooms.ts              ← add POST /:code/guess route

frontend/src/
├── services/
│   └── api.ts                ← add Guess type; extend RoomSnapshot; add submitGuess()
├── pages/
│   └── GamePage.tsx          ← replace canvas placeholder; wire GuessForm; pass data to components
└── components/
    ├── GuessForm.tsx         ← add onSubmit + error props; wire submission; clear on success
    ├── ResultPanel.tsx       ← accept guesses prop; render list
    └── Scoreboard.tsx        ← accept scores + participants props; render sorted
```

### No new files required.

---

## Phase Design

### Phase 1 — Backend Model Extension (blocking)

Add `Guess` interface to `game.ts`. Add `guesses: Guess[]` and `scores: Record<string, number>` to `Room` and `RoomSnapshot`.

TypeScript will surface two construction sites that break: `createRoom()` (Room literal) and `startGame()` (Room mutation before save). Fix both in one pass.

**Gate**: `npm run build` in `backend/` exits 0.

---

### Phase 2 — `submitGuess()` Service + Data Initialisation

In `roomStore.ts`:
- `createRoom()`: add `guesses: [], scores: {}` to the room literal.
- `startGame()`: after setting `status = "playing"`, seed `scores` by iterating `room.participants` and setting each `id → 0`.
- Add `submitGuess(code, participantId, guessText)` per spec FR-005.
- `toRoomSnapshot()`: add `guesses: [...room.guesses]` and `scores: { ...room.scores }`.

Key correctness detail in `submitGuess`:
```typescript
const trimmed = guessText.trim();
// reject if empty after trim
// reject if participant already guessed correctly
const alreadyCorrect = room.guesses.some(g => g.participantId === participantId && g.correct);
if (alreadyCorrect) return { code: "BAD_REQUEST", message: "You have already guessed correctly" };
const correct = trimmed.toLowerCase() === (room.currentWord ?? "").toLowerCase();
const score = correct ? 100 : 0;
room.scores[participantId] = (room.scores[participantId] ?? 0) + score;
room.guesses.push({ participantId, participantName, guess: trimmed, score, correct });
```

**Gate**: Unit test manually via curl after Phase 3 wires the route.

---

### Phase 3 — Schema + Route

Add `guessSchema` to `schemas.ts`. Add `POST /:code/guess` to `rooms.ts` after `POST /:code/start`.

Result code → HTTP mapping:
- `NOT_FOUND → 404`
- `FORBIDDEN → 403`  
- `BAD_REQUEST → 400` (with `result.message` in response body)
- `OK → 200` with `{ room: toRoomSnapshot(result.room, participantId) }`

**Gate**: Five curl checks cover: correct guess (200, score 100), wrong guess (200, score 0), whitespace guess (400), drawer guess (403), unknown room (404).

---

### Phase 4 — Frontend Types + API Function

Add `Guess` interface to `api.ts`. Extend `RoomSnapshot` with `guesses` and `scores`. Add `api.submitGuess()`.

**Gate**: `npm run build` in `frontend/` exits 0. TypeScript surfaces `room.guesses` and `room.scores` in `GamePage.tsx`.

---

### Phase 5 — Component Updates (parallel)

Three components updated independently — no inter-dependency:

**GuessForm**: Add `onSubmit: (guess: string) => Promise<void>` and `error: string | null` props. On submit: call `onSubmit(guessText.trim())`, clear input on resolve, show error on reject.

**ResultPanel**: Accept `guesses: Guess[]` prop. Render each as: `{name}: "{guess}" — {correct ? "✓" : "✗"} {score} pts`.

**Scoreboard**: Accept `scores: Record<string, number>` and `participants: Participant[]`. Sort participants by score descending. Render name + score.

**Gate**: Each component can be visually verified in isolation by temporarily passing mock data from `GamePage`.

---

### Phase 6 — GamePage Wiring

Wire everything together:
- Replace canvas placeholder with `<canvas ref={canvasRef}>` for drawer; keep div for guesser.
- Add drawing `useEffect` for `mousedown/mousemove/mouseup/mouseleave`.
- Add Clear button for drawer.
- Add `guessError` state; pass `onSubmit` (calls `api.submitGuess`, then `roomStore.setRoomSnapshot`) and `error={guessError}` to `<GuessForm>`.
- Pass `room.guesses` to `<ResultPanel>`.
- Pass `scores={room.scores}` and `participants={room.participants}` to `<Scoreboard>`.

**Gate**: Full four-test acceptance checklist from the scenario description.

---

### Phase 7 — Build & Test Verification

`npm run build && npm test` on both packages. All exit 0.

---

## Dependency Order

```
Phase 1 (game.ts model)
    ↓
Phase 2 (roomStore: submitGuess, initialisation, snapshot)
    ↓
Phase 3 (schema + route)     Phase 4 (frontend types + api.submitGuess)
    ↓                                    ↓
         Phase 5 (GuessForm, ResultPanel, Scoreboard — parallel with each other)
                        ↓
              Phase 6 (GamePage wiring)
                        ↓
              Phase 7 (build + test)
```

Phases 3 and 4 are parallel. The three component updates in Phase 5 are parallel with each other.

---

## Risk & Notes

- **`guessSchema.guess` is `z.string()` not `z.string().min(1)`**: empty-string validation happens in the service (after trim), not the schema. This gives a meaningful error message ("Guess cannot be empty") rather than a generic Zod message. The schema must not reject an untrimmed whitespace string before the service can evaluate it.
- **`GuessForm` props are additive**: `disabled` prop already works and must not be removed. Add `onSubmit` and `error` alongside it; the existing `disabled={isDrawer}` in `GamePage` stays unchanged.
- **Canvas `useRef` and `useEffect` cleanup**: the `useEffect` must return a cleanup function that removes all three event listeners (`mousedown`, `mousemove`, `mouseup`, `mouseleave`) to avoid memory leaks on re-render.
- **`scores` initialisation in `startGame()`**: seed all participants to 0 at game start so the scoreboard always shows every player, not just those who have guessed.
- **Cloning `guesses` in snapshot**: use `room.guesses.map(g => ({ ...g }))` to avoid reference leaks from `structuredClone` being called only on the room itself.
