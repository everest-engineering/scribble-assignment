# Research: Game Start & Drawer Flow

## Technical Decisions

### 1. Role-Based Secret Word Filtering

**Decision**: Implement role-based filtering in `toRoomSnapshot(room, participantId)` on the backend.

**Rationale**: 
- Prevents secret word from reaching guessers via network inspection or page source viewing
- Single source of truth (backend) ensures drawer and guesser see correct state
- Simplifies frontend logic (no conditional rendering of hidden fields)

**Alternatives Considered**:
- Frontend-side filtering: Rejected because guesser could inspect network requests or bypass JS checks
- Separate API endpoint for secret word: Rejected as overly complex, violates single-responsibility principle
- Client-side encryption: Rejected as adds complexity without solving the root issue

**Implementation**: 
- Check `participantId` against room's drawer participant
- Include `secretWord` in snapshot only if viewer is the drawer
- All other fields remain consistent across viewers

---

### 2. First-Word Selection Algorithm

**Decision**: Always select the first word from the starter word list.

**Rationale**:
- Simplest deterministic approach (no seed calculation needed)
- Ensures drawer and backend agree without additional synchronization
- Repeatable across game restarts (same list → same word)
- Easy to test and debug

**Alternatives Considered**:
- Hash-based (hash of room code + timestamp): Added unnecessary complexity, harder to debug
- Round-robin (track index across rounds): Out of scope for single-round v1
- Random with seed: Required additional state tracking and seed distribution

**Implementation**:
- In `startGame()`: `selectSecretWord = () => STARTER_WORDS[0]`
- Always `"rocket"` (first word in starter list)

---

### 3. Name Validation Responsibility

**Decision**: Dual validation on both frontend and backend.

**Rationale**:
- Frontend: Provides immediate user feedback (200ms target), prevents unnecessary network requests
- Backend: Enforces data integrity boundary, protects against clients that bypass frontend validation
- Zod schema already in place; reuse it for both layers

**Validation Rule**:
- Trim leading/trailing whitespace first
- Reject if resulting string is empty (minimum length 1 after trim)
- Reject with 400 Bad Request on backend if violated
- No fallback to default name like "Player"

**Alternatives Considered**:
- Backend-only validation: Rejected because UI delays user feedback and increases network load
- Frontend-only validation: Rejected because bad actors could bypass it

---

### 4. Role Assignment Timing & Storage

**Decision**: Assign roles synchronously in `startGame()` handler; store in-memory on Room object.

**Rationale**:
- Synchronous assignment ensures immediate consistency
- Clients discover role on next `GET /rooms/:code` poll after redirect to `/game`
- No additional round-trip or async state needed
- Roles tied to participant life cycle (deleted when room ends)

**Storage Structure**:
- Add `role: ParticipantRole` field to each Participant in active game
- Field remains `undefined` during "lobby" status
- Set to `"drawer"` for host, `"guesser"` for others when `status` transitions to `"game"`

**Data Model Update**:
```typescript
interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role?: ParticipantRole;  // Defined only when status === "game"
  isHost?: boolean;         // Computed during snapshot
}

interface GameRound {
  secretWord: string;
  startedAt: string;
}

interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  round?: GameRound;        // Present only when status === "game"
  createdAt: string;
  updatedAt: string;
}
```

---

### 5. API Response Consistency

**Decision**: Update `RoomSnapshot` to include `secretWord` field (conditionally populated).

**Rationale**:
- Consistent response structure across all viewers
- Frontend doesn't need to handle optional fields differently
- Backend controls visibility via filtering logic
- Simplifies client-side typing

**Response Structure**:
```typescript
interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];    // With role field when status === "game"
  availableWords: string[];
  roles: ParticipantRole[];
  secretWord?: string;             // Included only for drawer
}
```

---

## Key Assumptions Validated

1. ✅ Word selection is always first word (deterministic, repeatable)
2. ✅ Role stored on Participant object (not separate lookup table)
3. ✅ Role-based filtering in `toRoomSnapshot()` prevents secret word leakage
4. ✅ Role assignment timing: immediately on `POST /rooms/:code/start`
5. ✅ Invalid names: 400 Bad Request with no fallback

---

## Dependency & Integration Points

- **roomStore.ts**: `startGame()` and `toRoomSnapshot()` require updates
- **schemas.ts**: No schema changes needed (name validation already in place via `.trim().min(1)`)
- **models/game.ts**: Extend `Participant` with optional `role`, add `GameRound` entity, extend `Room` with optional `round`
- **GamePage.tsx**: Display secret word for drawer, display role for all players
- **CreateRoomPage.tsx & JoinRoomPage.tsx**: Add whitespace-only name validation (frontend sugar on existing Zod)
