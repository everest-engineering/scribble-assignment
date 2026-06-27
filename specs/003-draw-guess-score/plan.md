# Implementation Plan: Gameplay Interaction

**Branch**: `003-draw-guess-score` | **Date**: 2026-06-26 | **Spec**: specs/003-draw-guess-score/spec.md

**Input**: Feature specification from `specs/003-draw-guess-score/spec.md`

## Summary

Add canvas drawing (pen, color, clear), guess submission with case-insensitive comparison, score tracking (per-round + cumulative), and auto-advance to the next round on correct guess. Drawing strokes and guess history sync via polling.

## Technical Context

**Language/Version**: TypeScript (ES2022, NodeNext module resolution, strict mode)

**Primary Dependencies**: Express 4 + Zod (backend); React 18 + React Router 6 + Vite (frontend)

**Storage**: In-memory only (Map-based room store on backend)

**Testing**: Vitest, minimum 80% line coverage

**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge). Canvas uses standard HTML Canvas API.

**Performance Goals**: Draw stroke appears on drawer's screen immediately (local render), on guessers' screens within 2s (polling). Guess POST response returns result directly (<500ms). SC-013 satisfied by direct POST response, not polling.

**Polling Model**: GamePage polls `GET /rooms/:code?participantId=` every 2s (changed from Scenario 2's single-fetch model). Poll response includes drawing strokes, guess history, and scores.

**Constraints**: No WebSockets, no databases, no auth, polling-only sync. Backend centralized error handling. Zod for request validation. Functional components with hooks on frontend.

**Scale/Scope**: Lab project — small scale, no production deployment.

## Clarification Decisions

- **Drawing**: Server-side stroke storage via POST/DELETE, fetched via polling.
- **Post-correct-guess**: Server auto-advances to next round immediately. Poll response includes `lastRoundResult` for client to show brief score card (~3s).
- **Guess feedback**: POST response returns `{ correct: boolean, message: string }` for instant feedback. History syncs via polling.
- **Score model**: Track both per-round score and cumulative total per participant.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **TypeScript-First (Strict Mode)**: TypeScript strict mode enabled, `any` forbidden.
- **Extend, Don't Rewrite**: All changes extend existing Room/RoomSnapshot models + roomStore service. No rewrites.
- **Spec-Driven Development**: Spec artifacts committed before implementation.
- **Deterministic Game Logic**: Word selection continues using `STARTER_WORDS[currentRound - 1]`. Next round drawer selection: round-robin through participants (deterministic).
- **Minimal Dependencies**: No new dependencies required. Canvas is a Web API. All Zod schemas extend existing patterns.
- **Technical Constraints**: No WebSockets, no DB, no auth, polling-only, Zod validation, functional components, 80% Vitest coverage.
- **No violations detected**: Complexity tracking not required.

## Data Model Changes

### New Types (backend/src/models/game.ts)

```ts
export interface Point {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
}

export interface GuessEntry {
  participantId: string;
  participantName: string;
  guess: string;
  correct: boolean;
  timestamp: string;
  roundScoreAfter: number;
  cumulativeScoreAfter: number;
}

export interface ParticipantScore {
  roundScore: number;
  cumulativeScore: number;
}

export interface RoundResult {
  roundNumber: number;
  secretWord: string;
  drawerId: string;
  drawerName: string;
  guessHistory: GuessEntry[];
  scores: Record<string, ParticipantScore>;
}

```

### Extended Room model

Add to existing `Room`:
```ts
strokes: DrawingStroke[];
guessHistory: GuessEntry[];
scores: Record<string, ParticipantScore>; // participantId -> scores
lastRoundResult?: RoundResult;  // set when round auto-advances, cleared after N polls
```

### Extended RoomSnapshot model

Add to existing `RoomSnapshot`:
```ts
strokes: DrawingStroke[];
guessHistory: GuessEntry[];
scores: Record<string, ParticipantScore>;
lastRoundResult?: RoundResult;
```

## API Changes

### New Endpoints

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | /api/rooms/:code/draw | `{ participantId: string, strokes: DrawingStroke[] }` | `{ strokes: DrawingStroke[] }` | Must be drawer, room playing |
| DELETE | /api/rooms/:code/draw | `{ participantId: string }` | `{ strokes: [] }` | Must be drawer, room playing |
| POST | /api/rooms/:code/guess | `{ participantId: string, guess: string }` | `{ correct: boolean, message: string, guessEntry: GuessEntry }` | Must be guesser, room playing |

### Extended GET /api/rooms/:code

Now returns additional fields when `status === "playing"`:
- `strokes`: DrawingStroke[]
- `guessHistory`: GuessEntry[]
- `scores`: Record<string, ParticipantScore>
- `lastRoundResult?`: RoundResult (present for ~6s after round auto-advance)

### Zod Schemas

```ts
export const drawStrokesSchema = z.object({
  participantId: z.string(),
  strokes: z.array(z.object({
    points: z.array(z.object({ x: z.number(), y: z.number() })),
    color: z.string(),
    width: z.number()
  }))
});

export const clearCanvasSchema = z.object({
  participantId: z.string()
});

export const submitGuessSchema = z.object({
  participantId: z.string(),
  guess: z.string()
});

export const submitGuessSchema = z.object({
  participantId: z.string(),
  guess: z.string()
});
```

## Round Advancement Logic

When a correct guess is submitted:
1. Record the guess in `guessHistory` with `correct: true`
2. Set participant's `roundScore` += 100, `cumulativeScore` += 100
3. Build `lastRoundResult` with all round data (secretWord, scores, history)
4. Increment `currentRound`, pick next drawer (round-robin), pick word from `STARTER_WORDS[currentRound - 1]`
5. Clear `strokes` array, reset all `roundScore` to 0
6. Keep `lastRoundResult` in the snapshot for ~6s (3 poll cycles), then clear

Drawer selection for round N: `participants[(N - 1) % participants.length]`

## Implementation Tasks

### Backend

1. **T016**: Add `Point`, `DrawingStroke`, `GuessEntry`, `ParticipantScore`, `RoundResult` types to `game.ts`
2. **T017**: Extend `Room` model with `strokes`, `guessHistory`, `scores`, `lastRoundResult`; extend `RoomSnapshot` with same fields
3. **T018**: Implement `addStrokes()` service — append strokes to room, return updated strokes
4. **T019**: Implement `clearStrokes()` service — reset room strokes to empty array
5. **T020**: Implement `submitGuess()` service — validate drawer/guesser, trim, case-insensitive compare, update scores, handle correct-guess round advancement
6. **T021**: Implement `advanceRound()` service — increment round, pick new drawer, pick new word, clear strokes, reset round scores, set `lastRoundResult`
7. **T022**: Update `toRoomSnapshot()` to include strokes, guessHistory, scores, lastRoundResult in playing state
8. **T023**: Add `drawStrokesSchema`, `clearCanvasSchema`, `submitGuessSchema` Zod schemas
9. **T024**: Wire POST /:code/draw, DELETE /:code/draw, POST /:code/guess routes in rooms router
10. **T025**: Add backend tests for draw endpoints, guess endpoint, round advancement

### Frontend

11. **T026**: Add `DrawingStroke`, `GuessEntry`, `ParticipantScore`, `RoundResult` types to `api.ts`; add `api.addStrokes()`, `api.clearCanvas()`, `api.submitGuess()` methods
12. **T027**: Build `Canvas` component — interactive canvas with pen tool, color picker (4+ colors), clear button for drawer; read-only rendering for guessers
    - **Technical note**: Canvas uses dual rendering — `handleMouseMove` draws line segments imperatively to the canvas for immediate feedback, while `redraw()` reactively clears and redraws all committed strokes when the `strokes` prop changes (from polling). The `redraw()` function MUST also render the in-progress stroke from the current stroke ref, otherwise polling-triggered redraws erase the stroke the user is currently drawing.
13. **T028**: Wire `GuessForm` to submit guesses via API and display inline feedback (correct/wrong/rejected)
14. **T029**: Build `GuessHistory` component — ordered list showing guesser name, guess text, correct/incorrect badge
15. **T030**: Build `Scoreboard` component — shows per-participant round score + cumulative score
16. **T031**: Build `RoundResultCard` component — brief score card overlay between rounds (shows secret word, correct guesser, scores); visible while server includes `lastRoundResult` in poll response (~6s)
17. **T032**: Update `GamePage` to start polling (2s interval) in playing state; display real canvas instead of placeholder; show RoundResultCard when lastRoundResult is present
18. **T033**: Update `roomStore` with `addStrokes`, `clearCanvas`, `submitGuess` methods; integrate polling for strokes/guesses/scores

### Build & Verify

19. **T034**: Verify both backend and frontend builds pass with `npm run build`

## Out of Scope

- Advanced drawing tools (shapes, undo, line thickness, eraser)
- Drawing timers or auto-skip
- Multiple rounds completing the full game (game-end state)
- Chat or non-guess messaging
- Spectator mode
- Canvas resize or responsive scaling beyond fixed size
