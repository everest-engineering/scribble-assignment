# Research: Game Start and Drawer Flow

## 1. Drawer Assignment Strategy

**Decision**: First-joined player is drawer; round-robin rotation explicitly out of scope.

- Room participants array maintains insertion order (each `Participant` has a `joinedAt` timestamp). The drawer is the participant at index 0 in the sorted-by-join-time list.
- On drawer disconnect: the next-longest-joined participant (index 1 after removal) becomes the new drawer.
- `drawerId` stored explicitly on `Room` to avoid recomputation on every snapshot.

**Alternatives considered**:
- Random assignment: rejected — violates deterministic requirement.
- Room creator: rejected — clarification session chose "first joined".
- Alphabetical: rejected — no advantage over join order.

---

## 2. Secret Word Selection

**Decision**: Deterministic selection using a seeded hash of room state.

- Compute a deterministic index from `hashCode(roomCode + participantIds sorted)` modulo word pool length.
- Word pool must contain at least 20 words (expanded from current 5).
- New word selected on game start and on drawer reassignment (disconnect).
- No per-round concept — single round only.

**Alternatives considered**:
- Random selection: rejected — must be deterministic per feature spec.
- Sequential cycling: rejected — can't guarantee same result for same state.

---

## 3. Word Pool Expansion

**Decision**: Expand `STARTER_WORDS` from 5 to 20+ common English words suitable for drawing.

- Words should be concrete nouns (easier to draw) of moderate length (4-10 characters).
- Avoid culturally specific or potentially offensive words.
- Source: common Pictionary/Drawful word lists.

---

## 4. Name Validation

**Decision**: Zod schemas enforce all rules server-side.

| Rule | Implementation |
|------|---------------|
| Trim whitespace | `z.string().trim()` |
| Reject empty | `.min(1, ...)` |
| Max 20 chars | `.max(20, ...)` |
| Reject duplicates | Custom refine checking existing participant names (case-sensitive) |

- Duplicate check lives in `roomStore.joinRoom()` after schema validation passes.
- Frontend also trims and rejects empty names locally for instant feedback.

---

## 5. Role-Based Visibility via HTTP Polling

**Decision**: `GET /rooms/:code` returns role-aware snapshots.

- Accept `participantId` query parameter (already exists).
- `toRoomSnapshot()` computes `yourRole` per viewer: `"drawer"` if viewer's id === room.drawerId, else `"guesser"`.
- `secretWord` field is included in response ONLY when `yourRole === "drawer"`.
- Non-drawer viewers get everything except `secretWord`.

**Why not a separate endpoint**: Single polling endpoint reduces complexity; the existing pattern already filters data per viewer.

---

## 6. Drawer Disconnect Handling

**Decision**: If the drawer leaves (via explicit action or the server detects they're gone), reassign the next longest-joined participant as drawer and select a new word.

- New drawer: participant with earliest `joinedAt` who is not the leaving player.
- New word: deterministic selection using updated room state hash.
- No automatic reconnection — the game continues without the disconnected player.

---

## 7. Testing Strategy

**Decision**: Extend existing test patterns.

- Co-located `.test.ts` files with source.
- Backend: test `roomStore` service directly (no HTTP), verify deterministic drawer assignment, word selection, duplicate rejection, max length, role visibility.
- Frontend: test `roomStore` with mocked fetch, verify state transitions.

---

## 8. No New Dependencies

**Decision**: All logic implemented in vanilla TypeScript without new npm packages.

- Drawer assignment: array index + `drawerId` field.
- Word selection: `hashCode()` utility function, simple rolling hash.
- All validation: existing Zod package.
