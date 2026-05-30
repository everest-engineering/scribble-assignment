# Data Model: Room Setup & Lobby

## Entity Changes

### Participant (extended)

```ts
interface Participant {
  id: string;         // server-assigned UUID (via randomUUID)
  name: string;       // display name, defaults to "Player", with (N) suffix on collision
  joinedAt: string;   // ISO 8601 timestamp
  isHost: boolean;    // NEW — true for the room creator, transferred on host disconnect
}
```

**Validation rules**:
- `name`: trimmed, must not be empty or whitespace-only for create/join (existing default "Player" kept for backward compat, but spec requires inline validation on frontend)
- On duplicate `name` within a room: append ` (2)`, ` (3)`, etc. until unique

### Room (updated)

```ts
interface Room {
  code: string;             // 4-char alphanumeric (ambiguous chars excluded)
  status: RoomStatus;       // "lobby" | "playing"  (NEW: "playing")
  participants: Participant[];  // includes isHost flag
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
}
```

**State transitions**:
- `"lobby"` → `"playing"` (host starts game when 2+ participants present)
- `"playing"` → terminal (no transition back to lobby in this feature)

### RoomSnapshot (extended)

```ts
interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];  // includes isHost flag
  availableWords: string[];
  roles: ParticipantRole[];
}
```

### RoomSessionResponse (unchanged)

```ts
interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
```

## New Entities

### RateLimitEntry

```ts
interface RateLimitEntry {
  createAttempts: { timestamp: number }[];   // sliding window of create attempts
  joinAttempts: { timestamp: number }[];     // sliding window of join attempts
}
```

- Stored in a `Map<string, RateLimitEntry>` in `roomStore.ts`
- Keyed by participant ID (for post-join) or a temporary session token (for pre-join)
- Window: 60 seconds sliding
- Thresholds: 5 creates/min, 10 joins/min

## Existing Entities (Unchanged)

- **ParticipantRole**: `"drawer" | "guesser"`
- **RoomStatus**: `"lobby"` (extended with `"playing"`)
