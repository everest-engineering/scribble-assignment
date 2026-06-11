# Research: Game Start & Drawer Flow

## Decision Log

### 1. Round Data Storage

**Decision**: Store rounds as an array on the Room object (`rounds: Round[]`). The first round is created and appended when the game transitions to "playing".

**Rationale**: The Round is tightly coupled to the Room lifecycle. Storing it on the Room avoids an additional in-memory collection. An array supports future rounds (each round appends).

**Alternatives considered**:
- Separate `Map<string, Round[]>` keyed by room code — unnecessary indirection for current scope
- Single `currentRound` field on Room — insufficient for multi-round support

### 2. Word Selection Algorithm

**Decision**: Use a simple deterministic hash of the room code combined with round number to compute an index into the word list.

```ts
function selectWord(roomCode: string, roundNumber: number, words: readonly string[]): string {
  let hash = 0;
  for (let i = 0; i < roomCode.length; i++) {
    hash = (hash * 31 + roomCode.charCodeAt(i)) | 0;
  }
  const index = Math.abs((hash + roundNumber - 1)) % words.length;
  return words[index];
}
```

**Rationale**: Simple, deterministic, different codes produce different words. Same code always produces the same first-round word. Adding `roundNumber` ensures each round (if expanded later) gets a different word.

**Alternatives considered**:
- First word always (`words[0]`) — too predictable, every game same first word
- Random selection — not deterministic, violates spec requirement

### 3. Participant-Aware API Response

**Decision**: Extend `toRoomSnapshot()` to accept the round and viewer role, returning:
- `drawerId` (always visible)
- `yourRole: "drawer" | "guesser"` (per participant)
- `wordForDrawer: string` (only if viewer is drawer)
- `wordLength: number` (always visible)

**Rationale**: Single endpoint, single polling mechanism. The backend filters the response based on the viewer's participant ID before returning.

**Alternatives considered**:
- Separate endpoint (`GET /rooms/:code/round`) — more endpoints, more frontend wiring
- Client-side filtering — insecure, drawer could inspect network responses

### 4. Game Page UI

**Decision**: Create `GamePage.tsx` with role-based views:
- **Drawer view**: "You are the drawer! Your word: [secret word]"
- **Guesser view**: "[Drawer name] is drawing. Word length: [N]"

**Rationale**: Minimal implementation that satisfies the spec. No canvas, chat, or timer.

**Alternatives considered**:
- Transform LobbyPage into game view — cleaner navigation separation
- Modal overlay — less clear for multi-participant testing

### 5. Role Assignment API

**Decision**: Per-participant role is computed server-side by matching participant ID against the round's `drawerId`. The `RoomSnapshot` response includes `yourRole` as a derived field.

**Rationale**: No separate role assignment endpoint needed. The existing `viewerParticipantId` parameter in `toRoomSnapshot()` already supports participant-specific responses.

**Alternatives considered**:
- Separate roles map on the Room — extra state, same result
- Client-side role determination from drawerId — acceptable but server-side is cleaner
