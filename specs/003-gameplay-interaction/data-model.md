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
- `playerScores: Map<string, number>` — scores keyed by playerId
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
4. Updated snapshot returned

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
