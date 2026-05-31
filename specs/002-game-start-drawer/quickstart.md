# Quickstart: Game Start and Drawer Flow (002)

## Two-Tab Acceptance Test

### Setup
1. `cd backend && npm run dev` (port 3001)
2. `cd frontend && npm run dev` (port 5173)
3. Open two browser tabs: **Tab A** (Alice/host), **Tab B** (Bob/guesser)

### Steps

**Tab A — Create room**
1. Navigate to `/` → "Create Room"
2. Enter name `Alice`, click "Create and Continue"
3. Note the room code shown in the lobby (e.g., `WXYZ`)

**Tab B — Join room**
1. Navigate to `/` → "Join Room"
2. Enter code `WXYZ` and name `Bob`, click "Join"
3. Verify Tab B lobby shows Alice and Bob; Alice tagged `(host)`

**Tab A — Start game**
1. Click "Start Game" (button enabled since 2 players present)
2. Tab A navigates to `/game`

**Verify Tab A (drawer view)**:
- Alice's name or "Drawer" label is visible
- A secret word (e.g., `apple`) is displayed clearly
- The game screen is polling — no manual refresh needed

**Tab B — wait for poll**
1. Within ~2 seconds Tab B lobby detects `status: "active"` and navigates to `/game`

**Verify Tab B (guesser view)**:
- Alice is identified as the drawer (her name visible)
- The secret word is NOT shown — only a placeholder like `_ _ _ _ _`
- Network tab inspection confirms: no `secretWord` field in the GET response body

**Verify determinism**:
1. Refresh Tab A — same word is displayed
2. (Optional) Refresh Tab B — same placeholder length

---

## Automated Test Scenarios

### selectWord determinism (unit)
```typescript
// Same code, multiple calls → same word
expect(selectWord("ABCD", STARTER_WORDS)).toBe(selectWord("ABCD", STARTER_WORDS));

// Known assertion (hard-coded expected value)
// Compute manually: sum("ABCD".charCodeAt) = 65+66+67+68 = 266; 266 % words.length
const expected = STARTER_WORDS[266 % STARTER_WORDS.length];
expect(selectWord("ABCD", STARTER_WORDS)).toBe(expected);

// Different codes → different words (non-trivial mapping)
expect(selectWord("ABCD", STARTER_WORDS)).not.toBe(selectWord("ZZZZ", STARTER_WORDS));
```

### Viewer-scoped snapshot (unit)
```typescript
// Drawer sees secretWord, no placeholder
const drawerSnap = toRoomSnapshot(activeRoom, activeRoom.drawerId);
expect(drawerSnap.secretWord).toBeDefined();
expect(drawerSnap.wordPlaceholder).toBeUndefined();

// Guesser sees placeholder, no secretWord
const guesserSnap = toRoomSnapshot(activeRoom, guestParticipantId);
expect(guesserSnap.wordPlaceholder).toBeDefined();
expect(guesserSnap.secretWord).toBeUndefined();
expect(guesserSnap.wordPlaceholder).toBe("_ ".repeat(activeRoom.secretWord.length).trim());
```

### startRoom sets drawerId + secretWord (unit)
```typescript
const room = startRoom(code, hostParticipantId);
expect(room.drawerId).toBe(hostParticipantId);
expect(room.secretWord).toBe(selectWord(code, STARTER_WORDS));
expect(typeof room.secretWord).toBe("string");
expect(room.secretWord.length).toBeGreaterThan(0);
```
