# Research: Gameplay Interaction

**Feature**: Scenario 3 | **Date**: 2026-06-03

## Stroke storage and sync

**Decision**: Append-only stroke array on `currentRound`; each stroke is `{ points: {x,y}[], color: string, width: number }`; `clearStrokes` sets array to `[]`.

**Rationale**: Matches A7 and constitution append-only rule; simplest poll model — full stroke list in snapshot every 2 s.

**Alternatives considered**: Delta-only stroke IDs (rejected — more client merge logic for no lab benefit); undo stack (rejected — out of scope).

## Canvas rendering

**Decision**: 600×400 CSS pixel canvas; straight `lineTo` between pointer samples; drawer captures `pointerdown/move/up`; guessers render same paths read-only.

**Rationale**: Q3 default; no smoothing library needed; coordinates stored normalized 0–1 or pixel — use pixel integers matching canvas size for clarity.

**Alternatives considered**: SVG overlay (rejected — starter uses canvas placeholder); variable canvas size (rejected — Q3 locks 600×400).

## Guess comparison

**Decision**: `guess.trim().toLowerCase() === secretWord.toLowerCase()` after server trim validation.

**Rationale**: README + spec; deterministic; no fuzzy matching.

**Alternatives considered**: Levenshtein (rejected — not in README).

## Round termination (A3)

**Decision**: On first correct guess while `status === "playing"`: add guess, set guesser score += 100, set `status = "result"`, record `winnerParticipantId` optional on round.

**Rationale**: A3; backend transition enables Scenario 4 to focus on UI/restart without redefining scoring.

**Alternatives considered**: Stay `playing` until Scenario 4 (rejected — user prompt requires result transition in backend).

## Guess history visibility (Q1)

**Decision**: Full chronological list in snapshot for all viewers; each entry `{ id, participantId, participantName, text, isCorrect, createdAt }`.

**Rationale**: Q1 default; `ResultPanel` renders list; Scenario 4 adds revealed word banner.

## Caps (constitution IV)

**Decision**: `MAX_STROKES = 500`, `MAX_GUESSES = 200`, `MAX_POINTS_PER_STROKE = 250`; reject with `409` and stable message.

**Rationale**: Constitution v2.0.0; server is source of truth.

**Alternatives considered**: Silent truncation (rejected — constitution requires rejection).
