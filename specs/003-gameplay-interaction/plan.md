# Implementation Plan: Gameplay Interaction

**Branch**: `004-gameplay-interaction` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-gameplay-interaction/spec.md`

## Summary

Add drawing canvas with stroke persistence, guess submission with validation and scoring, and a shared guess history — all synced to all players via HTTP polling. The backend stores strokes, guesses, and scores per room. The frontend renders the canvas using HTML5 `<canvas>` and syncs state through the existing polling mechanism.

## Technical Context

**Language/Version**: TypeScript 5.x (both backend and frontend)

**Primary Dependencies**: Express (backend), React 18 + HTML5 Canvas (frontend), Zod (validation)

**Storage**: In-memory only. Strokes, guesses, and scores stored in room memory.

**Testing**: Vitest (backend), Vitest (frontend)

**Target Platform**: Node.js (backend), Browser (frontend via Vite)

**Project Type**: Web application (monorepo with `backend/` and `frontend/`)

**Performance Goals**: Canvas drawing <16ms per stroke render; polling interval ~2s for sync

**Constraints**: No WebSockets, no database, no authentication. HTTP polling only. All state in-memory.

**Scale/Scope**: Single room per server process; lab-scale (2-8 players). Freehand strokes only (single color, single line width).

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript First | PASS | All new/modified code fully typed. No `any`. Stroke/guess/score interfaces explicitly defined. |
| II. In-Memory Only | PASS | Strokes, guesses, and scores stored in room memory (Map-based store). |
| III. HTTP Polling Only | PASS | Frontend already polls at 2s; new canvas/guess data propagates via polling. |
| IV. Validate at Boundaries with Zod | PASS | New `submitGuessSchema` will validate guess text (trim + min 1). Canvas stroke data validated at API boundary. |
| V. Incremental, Spec-Driven | PASS | Plan follows spec scenarios in priority order. |

**Hard Constraints Check**:
- No authentication/sessions/JWT — PASS
- No new state-management libraries — PASS (uses existing `RoomStore` pattern)
- No unjustified dependencies — PASS (no new npm packages needed; HTML5 Canvas is native)
- No rewriting from scratch — PASS (brownfield additions)
- No out-of-scope features — PASS (no timer, no round end, no tool selection, no shapes)

**Gate status**: All gates pass. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              # ADD: Stroke, Guess, PlayerScore types; Room gains strokes/guesses/playerScores
│   ├── services/
│   │   └── roomStore.ts         # ADD: addStroke, clearCanvas, submitGuess functions; startRoom initializes scores
│   ├── api/
│   │   ├── schemas.ts           # ADD: submitGuessSchema, addStrokeSchema
│   │   └── rooms.ts             # ADD: POST /rooms/:code/stroke, POST /rooms/:code/clear, POST /rooms/:code/guess
│   └── seed/
│       └── starterData.ts       # NO CHANGE
└── tests/
    └── [existing test files updated]

frontend/
├── src/
│   ├── pages/
│   │   └── GamePage.tsx         # MODIFY: integrate DrawingCanvas, GuessHistory, Scoreboard updates
│   ├── components/
│   │   ├── DrawingCanvas.tsx    # NEW: HTML5 canvas component for drawer (draw + clear)
│   │   ├── GuessHistory.tsx     # NEW: displays shared guess history
│   │   └── GuessForm.tsx        # MODIFY: submit to backend, handle validation errors
│   ├── services/
│   │   └── api.ts               # ADD: addStroke, clearCanvas, submitGuess API methods
│   └── state/
│       └── roomStore.ts         # NO CHANGE (existing polling handles sync; new fields in snapshot)
```

**Structure Decision**: Option 2 (Web application). Three new frontend components, three new backend API endpoints, model extensions. All targeted additions to existing files.

## Phase 0: Outline & Research

### Unknowns Resolved

| Unknown | Decision | Rationale | Alternatives Considered |
|---------|----------|-----------|------------------------|
| How to represent strokes | Array of `Stroke` objects with `{ points: {x,y}[], color: string, lineWidth: number }` | Simple, serializable via JSON, sufficient for freehand drawing | Binary image data (not serializable, no undo), path commands (overkill) |
| Canvas rendering approach | HTML5 `<canvas>` element with `2d` context, redraw all strokes on each render | Native, no dependencies, simple to implement with React refs | SVG (DOM-heavy for many strokes), canvas library like Fabric.js (unnecessary dependency) |
| Where to store guesses | Array of `Guess` objects on room: `{ playerId, text, correct: boolean, timestamp }` | Flat, queryable, easy to serialize in snapshot | Map by playerId (loses order, harder to display history) |
| How to prevent double-scoring | Track `hasScored` boolean per player in room state; check before awarding points | Simple, single-check; visible in state for debugging | Check guess history for prior correct guess (slower, redundant) |
| How to sync canvas via polling | Strokes array included in `RoomSnapshot`; polling re-renders canvas on each update | Reuses existing polling infrastructure; no new sync mechanism needed | Diff-based sync (complex), separate canvas endpoint (unnecessary API surface) |
| Stroke data size limits | No explicit limit for lab scope; reasonable assumption of <1000 strokes per round | Lab-scale; if needed later, can add compression or limits | Stroke count cap (premature optimization) |
| Guess rate limiting | Not enforced at API level for lab scope; frontend can debounce at 1s | Out of scope for Scenario 3; can add later | Token bucket / sliding window (overkill) |

### research.md Content

```markdown
# Research: Gameplay Interaction

## Decision: Stroke Representation
- **Decision**: Array of Stroke objects with points array, color, and lineWidth.
- **Rationale**: JSON-serializable, easy to iterate for canvas rendering, extensible for future color/width features.
- **Alternatives considered**: Base64-encoded images (not editable, heavy), Canvas2D path commands (complex to serialize).

## Decision: Canvas Rendering
- **Decision**: HTML5 <canvas> with 2d context, redraw all strokes on each polling update.
- **Rationale**: Native browser API, no dependencies. Simple redraw loop is fine for lab-scale stroke counts.
- **Alternatives considered**: SVG (DOM manipulation heavy for many paths), third-party canvas libraries (unnecessary dependency per constitution).

## Decision: Guess Storage and Scoring
- **Decision**: Flat array of Guess objects on room. Each player has a `hasScored` flag. First correct guess = 100 points.
- **Rationale**: Simple, auditable. History display is just iterating the array.
- **Alternatives considered**: Score as computed property from guesses (requires recounting each time), separate score store (duplicate state).

## Decision: Canvas Sync via Polling
- **Decision**: Strokes included in RoomSnapshot. Frontend redraws canvas when snapshot changes.
- **Rationale**: Reuses existing 2s polling. No new infrastructure needed.
- **Alternatives considered**: Separate /canvas endpoint (extra API surface), WebSocket (forbidden by constitution).
```

## Phase 1: Design & Contracts

### data-model.md

```markdown
# Data Model: Gameplay Interaction

## New Types

### Stroke
- `id: string` — unique stroke identifier (UUID)
- `playerId: string` — ID of the drawer who created this stroke
- `points: { x: number; y: number }[]` — ordered sequence of canvas coordinates
- `color: string` — stroke color (hex, e.g. "#000000")
- `lineWidth: number` — stroke thickness (default: 4)

### Guess
- `id: string` — unique guess identifier (UUID)
- `playerId: string` — ID of the guesser who submitted
- `playerName: string` — display name of the guesser
- `text: string` — the submitted guess (trimmed)
- `correct: boolean` — whether the guess matched the secret word
- `timestamp: string` — ISO timestamp of submission

### PlayerScore
- `playerId: string` — ID of the player
- `score: number` — current score (starts at 0, increments by 100 on first correct guess)

## Room Changes (backend/src/models/game.ts)

**New fields on Room**:
- `strokes: Stroke[]` — all drawing strokes for the current round
- `guesses: Guess[]` — all guess submissions for the current round
- `playerScores: Map<string, number>` — scores keyed by playerId (or array of PlayerScore)
- `hasScored: string[]` — array of playerIds who have already scored this round

**New fields on RoomSnapshot**:
- `strokes: Stroke[]` — mirrors Room.strokes
- `guesses: Guess[]` — mirrors Room.guesses
- `playerScores: { playerId: string; score: number; name: string }[]` — scores with player names for display

## Initialization

When `startRoom()` is called:
- `room.strokes = []`
- `room.guesses = []`
- `room.playerScores = new Map()` (populate with 0 for each participant)
- `room.hasScored = []`

## State Transitions

### Adding a Stroke
1. Drawer calls POST /rooms/:code/stroke with stroke data
2. Backend validates caller is the drawer
3. Stroke appended to `room.strokes`
4. Updated snapshot returned (propagates to guessers via polling)

### Clearing Canvas
1. Drawer calls POST /rooms/:code/clear
2. Backend validates caller is the drawer
3. `room.strokes = []`
4. Updated snapshot returned

### Submitting a Guess
1. Guesser calls POST /rooms/:code/guess with guess text
2. Backend validates caller is not the drawer
3. Backend trims and lowercases guess, compares to `room.currentWord`
4. If correct and player not in `hasScored`: award 100 points, add to `hasScored`
5. Guess appended to `room.guesses`
6. Updated snapshot returned
```

### contracts/

```markdown
# API Contracts: Gameplay Interaction

## POST /rooms/:code/stroke

**Authorization**: Only the drawer (room.drawerId === participantId)
**Request Body**:
```json
{
  "participantId": "uuid",
  "stroke": {
    "points": [{ "x": 10, "y": 20 }, { "x": 15, "y": 25 }],
    "color": "#000000",
    "lineWidth": 4
  }
}
```

**Response 200**: `{ "room": RoomSnapshot }` — updated snapshot with new stroke
**Response 403**: "Only the drawer can draw"
**Response 404**: Room not found

## POST /rooms/:code/clear

**Authorization**: Only the drawer
**Request Body**: `{ "participantId": "uuid" }`

**Response 200**: `{ "room": RoomSnapshot }` — updated snapshot with empty strokes array
**Response 403**: "Only the drawer can clear the canvas"
**Response 404**: Room not found

## POST /rooms/:code/guess

**Authorization**: Any participant except the drawer
**Request Body**:
```json
{
  "participantId": "uuid",
  "text": "rocket"
}
```

**Response 200**:
```json
{
  "room": RoomSnapshot,
  "correct": true
}
```

**Response 400**: "Guess cannot be empty" (if text is empty after trim)
**Response 403**: "The drawer cannot submit guesses"
**Response 404**: Room not found

## RoomSnapshot (updated)

```json
{
  "code": "ABCD",
  "status": "active",
  "participants": [...],
  "hostId": "uuid",
  "drawerId": "uuid",
  "currentWord": "rocket",
  "availableWords": [...],
  "roles": ["drawer", "guesser"],
  "strokes": [
    {
      "id": "stroke-uuid",
      "playerId": "drawer-uuid",
      "points": [{ "x": 10, "y": 20 }],
      "color": "#000000",
      "lineWidth": 4
    }
  ],
  "guesses": [
    {
      "id": "guess-uuid",
      "playerId": "guesser-uuid",
      "playerName": "Bob",
      "text": "rocket",
      "correct": true,
      "timestamp": "2026-06-03T12:00:00.000Z"
    }
  ],
  "playerScores": [
    { "playerId": "uuid-1", "score": 100, "name": "Alice" },
    { "playerId": "uuid-2", "score": 0, "name": "Bob" }
  ]
}
```
```

### quickstart.md

```markdown
# Quickstart: Testing Gameplay Interaction

## Prerequisites
- Backend and frontend running (see Scenario 2 quickstart)
- Game started with at least 2 players (host as drawer, one guesser)

## Steps

1. **Test drawing as drawer**:
   - As the host/drawer, draw on the canvas in the GamePage
   - Verify strokes appear on your screen immediately
   - In a second browser tab (guesser), verify strokes appear within ~2 seconds

2. **Test canvas clear**:
   - As the drawer, click "Clear Canvas" button
   - Verify canvas is emptied on both drawer and guesser screens

3. **Test guess submission (incorrect)**:
   - As a guesser, type "car" in the guess input and submit
   - Verify the guess appears in the guess history
   - Verify score remains 0

4. **Test guess submission (correct)**:
   - As a guesser, type "ROCKET" (mixed case or exact) in the guess input
   - Verify the guess is marked as correct in history
   - Verify score increases to 100

5. **Test guess validation**:
   - Submit an empty guess → error message shown
   - Submit whitespace-only guess "   " → error message shown
   - Submit "  rocket  " → trimmed and matches correctly

6. **Test drawer cannot guess**:
   - As the drawer, verify no guess input is shown (or submission is rejected)

7. **Test guess history visibility**:
   - Verify all players (drawer and guessers) see the same guess history
```

## Complexity Tracking

No constitution violations. No complexity tracking needed.
