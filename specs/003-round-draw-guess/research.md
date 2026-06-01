# Research: Active Round Drawing, Guessing, and Scoring

**Feature**: `003-round-draw-guess` | **Date**: 2026-06-01

## R1: Canvas representation

- **Decision**: Store `canvasStrokes` as JSON array of polylines `{ points: {x,y}[], color?, width? }`; clear = `[]`.
- **Rationale**: Simple to serialize over REST; sufficient for assignment scope.
- **Alternatives**: Base64 image snapshots (heavier payloads); WebSocket stream (forbidden).

## R2: Canvas sync

- **Decision**: Drawer `PUT /rooms/:code/canvas` on stroke end / clear; all clients poll `GET` every 2000ms.
- **Rationale**: Matches lobby pattern (FR-004, FR-013); constitution forbids push.
- **Alternatives**: Per-stroke POST storm (mitigate with debounced PUT from client).

## R3: Guess comparison

- **Decision**: `normalizeGuess(text)` trim + lowercase; compare to `secretWord.toLowerCase()`.
- **Rationale**: FR-006–FR-008; constitution case-insensitive rule.

## R4: Scoring

- **Decision**: On valid guess append history entry; if correct add `100` to `participant.score`, else `+0`.
- **Rationale**: FR-011; allow multiple correct guesses (+100 each) per spec edge case.
- **Alternatives**: Cap at one correct (rejected—spec allows multiple).

## R5: Round end

- **Decision**: This feature does **not** set `status` to `result`; feature 004 hooks first correct guess.
- **Rationale**: Spec scope boundary; avoids duplicating 004 logic prematurely.
