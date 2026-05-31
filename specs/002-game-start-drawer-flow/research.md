# Research: Game Start & Drawer Flow

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Drawer assignment | Host is drawer for round 1 | Matches scenario spec: "host (or first player)" |
| Word selection | Deterministic: `words[(roundNum - 1) % words.length]` | Same word always for same round; predictable |
| Word visibility | Backend filters `secretWord` per viewer in `toRoomSnapshot` | Single source of truth; no client-side hiding |
| Round state | Embedded in Room as `currentRound` and `rounds[]` | Simple; all state in one place for polling |
| Round number tracking | Sequential integer starting at 1 | Natural for word indexing |
