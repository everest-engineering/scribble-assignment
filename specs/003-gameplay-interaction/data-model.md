# Data Model: Gameplay Interaction (003)

## New Type: `Guess`

Added to `backend/src/models/game.ts` and mirrored in `frontend/src/services/api.ts`.

```typescript
export interface Guess {
  participantId: string;   // ID of the guesser
  participantName: string; // Display name — denormalized at submission time
  text: string;            // Trimmed guess text
  correct: boolean;        // true if text matched secretWord (case-insensitive)
  index: number;           // 0-based submission order position
}
```

**Invariants**:
- `text` is always trimmed (no leading/trailing whitespace).
- `correct` is determined by `text.toLowerCase() === secretWord.toLowerCase()`.
- `index` equals the length of `room.guesses` at the moment the guess is appended (0 for
  the first guess, 1 for the second, etc.).
- `participantName` is captured from `room.participants` at submission time and does not
  change if the participant's display name were later updated (names are immutable in this
  scenario, so this is safe).

---

## Updated Type: `Room`

Two new fields added to `backend/src/models/game.ts`:

```typescript
export interface Room {
  // ... existing fields unchanged ...
  drawerId: string;          // from Scenario 2
  secretWord: string;        // from Scenario 2
  guesses: Guess[];          // NEW — ordered array of accepted guesses
  scores: Record<string, number>; // NEW — { [participantId]: pointTotal }
}
```

**Lifecycle**:
- `guesses` initialized to `[]` in `createRoom()`.
- `scores` initialized to `{}` in `createRoom()`.
- `scores` is populated with `{ [id]: 0 }` for every participant when `startRoom()` is called
  (at game start). This ensures every participant has a score entry from the first poll.
- `guesses` is appended to by `submitGuess()`.
- `scores[participantId]` is incremented by 100 on a correct guess.

---

## Updated Type: `RoomSnapshot`

Two new fields added to `backend/src/models/game.ts` and mirrored in
`frontend/src/services/api.ts`:

```typescript
export interface RoomSnapshot {
  // ... existing fields unchanged ...
  drawerId: string;               // from Scenario 2
  secretWord?: string;            // from Scenario 2 — scoped by viewer role and status
  wordPlaceholder?: string;       // from Scenario 2 — active + non-drawer only
  guesses: Guess[];               // NEW — always present (empty array in lobby)
  scores: Record<string, number>; // NEW — always present (empty object in lobby)
}
```

**Viewer-scoping rules for `secretWord` / `wordPlaceholder` (updated from Scenario 2)**:

| Room Status | Viewer | `secretWord` | `wordPlaceholder` |
|-------------|--------|-------------|-------------------|
| `lobby`     | any    | absent      | absent            |
| `active`    | drawer | present     | absent            |
| `active`    | guesser| absent      | present           |
| `ended`     | any    | present     | absent            |

When `ended`, the secret word is revealed to all participants.

---

## New Function: `submitGuess`

Added to `backend/src/services/roomStore.ts`.

**Signature**:
```typescript
export function submitGuess(
  code: string,
  participantId: string,
  text: string
): Room
```

**Algorithm**:
1. Look up room by `code` → throw `HttpError(404)` if not found.
2. Check `room.status === "active"` → throw `HttpError(409, "Game is not active")` if not.
3. Check `room.participants.some(p => p.id === participantId)` → throw `HttpError(403,
   "Participant not in room")` if not.
4. Check `participantId !== room.drawerId` → throw `HttpError(403, "Drawer cannot guess")`
   if equal.
5. `trimmed = text.trim()` → throw `HttpError(400, "Guess cannot be empty")` if `!trimmed`.
6. `correct = trimmed.toLowerCase() === room.secretWord.toLowerCase()`
7. Append `Guess` to `room.guesses`.
8. If `correct`: `room.scores[participantId] += 100`; `room.status = "ended"`.
9. `room.updatedAt = now()`; persist; return `cloneRoom(room)`.

---

## Updated Function: `startRoom`

Adds score initialization at game start (new behavior for Scenario 3):

```typescript
// After setting status, drawerId, secretWord:
room.scores = Object.fromEntries(room.participants.map(p => [p.id, 0]));
room.guesses = [];
```

---

## Updated Function: `toRoomSnapshot`

Adds `guesses` and `scores` to every snapshot; extends viewer-scoping to handle `"ended"`:

```typescript
export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isActive = room.status === "active";
  const isEnded = room.status === "ended";
  const isDrawer = isActive && viewerParticipantId === room.drawerId;

  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    participants: room.participants.map(p => ({ ...p })),
    availableWords: isActive && !isDrawer ? [] : listWords(),
    roles: [...STARTER_ROLES],
    drawerId: room.drawerId,
    guesses: room.guesses.map(g => ({ ...g })),
    scores: { ...room.scores },
    ...(isActive && isDrawer  ? { secretWord: room.secretWord } : {}),
    ...(isActive && !isDrawer ? { wordPlaceholder: [...room.secretWord].map(() => "_").join(" ") } : {}),
    ...(isEnded               ? { secretWord: room.secretWord } : {}),
  };
}
```

---

## New Zod Schema: `submitGuessSchema`

Added to `backend/src/api/schemas.ts`:

```typescript
export const submitGuessSchema = z.object({
  participantId: z.string().uuid(),
  text: z.string()
});
```

Note: `text` is intentionally not `.trim().min(1)` at the schema level — trimming and
non-empty validation are domain rules enforced in `submitGuess()`, consistent with the
project pattern.

---

## Updated Frontend: `api.ts`

New types and method added to `frontend/src/services/api.ts`:

```typescript
export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  correct: boolean;
  index: number;
}

// RoomSnapshot gains:
guesses: Guess[];
scores: Record<string, number>;

// api object gains:
submitGuess(code: string, participantId: string, text: string) {
  return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/guess`, {
    method: "POST",
    body: JSON.stringify({ participantId, text })
  });
}
```

---

## Updated Frontend: `roomStore.ts`

New method added to `RoomStore` class:

```typescript
async submitGuess(text: string) {
  if (!this.state.room || !this.state.participantId) return null;

  const response = await this.withLoading(() =>
    api.submitGuess(this.state.room!.code, this.state.participantId!, text)
  );
  this.setRoomSnapshot(response.room);
  return response.room;
}
```

---

## New Frontend Component: `DrawingCanvas`

New file `frontend/src/components/DrawingCanvas.tsx`:

```typescript
// Props: none (self-contained local state)
// Uses: useRef<HTMLCanvasElement>, pointer event handlers
// Exposes: <canvas> + "Clear" button
// No store writes, no API calls
```
