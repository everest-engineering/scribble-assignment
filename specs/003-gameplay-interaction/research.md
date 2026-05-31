# Research: Gameplay Interaction

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Canvas format | Array of strokes, each = array of `{x, y}` points | Lightweight, easy to store and transmit |
| Canvas sync | Store strokes on Round; poll via GET /rooms/:code | Consistent with existing polling pattern |
| Guess comparison | `.toLowerCase().trim()` on both guess and secret word | Case-insensitive, whitespace-tolerant |
| First correct only | Track `hasCorrectGuess` on Round; reject further score awards | Prevents score farming |
| Guess history | Array of `{participantId, text, isCorrect, timestamp}` on Round | Full audit trail |
| Drawing strokes store | `strokes: number[][][]` on Round | Each stroke is an array of `[x, y]` pairs |
