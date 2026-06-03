# Research: Game Start & Drawer Flow

## Decision: Deterministic Word Selection
- **Decision**: Use round number (1-based) as index into STARTER_WORDS with modulo arithmetic.
- **Rationale**: STARTER_WORDS has 5 words. Round 1 → index 0 ("rocket"), Round 2 → index 1 ("pizza"), etc. Modulo ensures wrap-around. Fully deterministic and testable.
- **Alternatives considered**: 
  - Seeded PRNG: Would require storing seed in room state; overkill for 5 words.
  - Hash of session ID + round: More complex, no benefit for this scope.

## Decision: Drawer Assignment
- **Decision**: Host (first player, i.e., `room.hostId`) is always the drawer for round 1.
- **Rationale**: Simple, unambiguous. `hostId` already exists on Room. No new logic needed to determine "first player".
- **Alternatives considered**:
  - Random drawer: Would need to be deterministic per spec; random contradicts requirement.
  - First-joined player (by joinedAt): Equivalent to host in current implementation since host is always the creator.

## Decision: Word Visibility via Snapshot Gating
- **Decision**: `toRoomSnapshot` uses `viewerParticipantId` to conditionally include `currentWord`.
- **Rationale**: Parameter already exists and is passed from frontend API calls. Clean server-side gate.
- **Alternatives considered**:
  - Frontend-only hiding: Insecure; word would be in network response.
  - Separate endpoints: Adds API surface unnecessarily.

## Decision: No New Zod Schemas Needed
- **Decision**: Existing `createRoomSchema` and `joinRoomSchema` already handle name trimming and validation.
- **Rationale**: `.trim().min(1)` on both schemas covers empty and whitespace-only rejection. `createParticipant` also trims server-side.
- **Alternatives considered**: None needed.
