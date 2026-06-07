# Implementation Plan: Result, Restart & Final Validation

**Branch**: `assignment`

## Summary

Implement round end state, result display, host restart flow, and multi-room cleanup.

## Data Flow

### Restart Flow
1. Host clicks "Restart" → `POST /rooms/:code/restart`.
2. Backend clears `currentDrawerId`, `currentWord`, `guesses`, `scores`, `canvasData`, sets status to `"lobby"`.
3. All clients detect `status === "lobby"` on next poll → navigate to `/lobby`.

## File-Level Plan

### Backend
| File | Changes |
|------|---------|
| `src/services/roomStore.ts` | Add `restartGame` method; set `roundEnd` on correct guess |
| `src/api/rooms.ts` | Add `POST /:code/restart` handler |

### Frontend
| File | Changes |
|------|---------|
| `src/services/api.ts` | Add `restartGame` method |
| `src/state/roomStore.ts` | Add `restartGame` method |
| `src/pages/GamePage.tsx` | Detect `"roundEnd"`; show result state |
| `src/components/ResultPanel.tsx` | Show final word, scores, guess history; host sees Restart button |

## Implementation Sequence
1. Set status to roundEnd on correct guess
2. Add restart endpoint
3. Add restartGame to API client and room store
4. Update GamePage to show result state
5. Update ResultPanel with dynamic data
6. Wire Restart button
7. Full end-to-end test
8. Build and verify tests
