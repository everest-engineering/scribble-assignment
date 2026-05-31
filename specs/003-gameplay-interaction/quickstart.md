# Quickstart: Gameplay Interaction

**Feature**: `003-gameplay-interaction` | **Branch**: `003-gameplay-interaction-drawing`

## Prerequisites

1. Scenarios 1 and 2 implemented (lobby start, drawer, secret word, scores at 0, game polling).
2. Backend on `http://localhost:3001`, frontend on `http://localhost:5173`.
3. Two browser tabs (or windows).

## Setup

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## Manual checklist

### §1 Drawing sync (US1)

1. Tab A: Create room as **Alice** (host).
2. Tab B: Join as **Bob**.
3. Host starts game; both reach `/game`.
4. Tab A (drawer): Draw several lines on the canvas.
5. Tab B (guesser): Within ~5 s, the same lines appear without manual refresh.
6. Tab B: Confirm canvas does not accept new strokes (read-only).

### §2 Clear canvas (US2)

1. With strokes visible on both tabs, Tab A clicks **Clear canvas**.
2. Both tabs show empty canvas within ~5 s.
3. Tab B has no clear button.

### §3 Guesses and scoring (US3)

1. Tab B submits empty guess → validation error, no history entry.
2. Tab B submits wrong guess (e.g. `apple`) → appears in history as incorrect; Bob's score stays 0.
3. Tab B submits correct guess with different casing (e.g. `  ROCKET  ` if word is `rocket`) → history shows correct; score +100.
4. Tab A (drawer): Guess form disabled or hidden.
5. Both tabs show identical guess history after poll.

### §4 Scenario 1–2 regression

- Lobby polling still works.
- Join validation and host-only start unchanged.
- Guesser never sees secret word in UI or network snapshot.

## Automated checks

```bash
cd backend && npm test
cd backend && npm run build
cd frontend && npm run build
```

## Troubleshooting

- **Canvas empty on guesser**: Confirm game polling runs and drawer completed a stroke (pointer up sends stroke).
- **403 on draw**: Session must be drawer `participantId`.
- **Guess not scoring**: Check server trim + lowercase compare; inspect `room.scores` in GET response.
