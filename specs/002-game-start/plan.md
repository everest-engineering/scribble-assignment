# Plan — Game Start & Drawer Flow

## State Model Changes

Add the following types and fields to `Room`:

```typescript
Guess {
  participantId: string
  participantName: string
  text: string
  isCorrect: boolean
}

Stroke {
  points: { x: number; y: number }[]
}

// New fields on Room:
// drawerId: string | null
// secretWord: string | null
// guesses: Guess[]
// scores: Record<string, number>
// strokes: Stroke[]
```

---

## Data Flow

```
[Game Page load — Polling]
  → GET /rooms/:code?participantId=X
  ← RoomSnapshot with role-appropriate secretWord visibility
  → If viewerParticipantId === drawerId: show "Your word: ..."
  → If viewerParticipantId !== drawerId: hide word, show guess form
```

---

## File-Level Plan

| Step | File | Change |
|------|------|--------|
| 2.1 | `backend/src/models/game.ts` | Add `Guess`, `Stroke` interfaces; extend `Room` with game-round fields |
| 2.2 | `backend/src/services/roomStore.ts` | Add `startGame()`: set drawerId, pick word deterministically, init scores; update `toRoomSnapshot()` for viewer-based word visibility |
| 2.3 | `backend/src/api/rooms.ts` | Update `POST /rooms/:code/start` to call `startGame()` |
| 2.4 | `frontend/src/services/api.ts` | Extend `RoomSnapshot` with `drawerId`, `secretWord`, `guesses`, `scores`, `strokes` |
| 2.5 | `frontend/src/pages/GamePage.tsx` | Show role badge; show/hide word; show/hide guess form based on role |
| 2.6 | `frontend/src/components/GuessForm.tsx` | Hide for drawer (or pass `disabled` with role-aware message) |
