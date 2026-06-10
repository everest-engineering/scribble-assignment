# Research: Game Start & Drawer Flow

## 1. Deterministic Word Selection

**Decision**: Use DJB2 hash of room code, modulo the word list length, to pick the secret word.

**Rationale**: The room code is a 4-char alphanumeric string that is guaranteed unique at generation time. A hash provides a uniform distribution across the word list. The same room code always produces the same word. If the word list is empty, the `startGame` handler throws `400 Bad Request` — this edge case should be validated early.

**Alternatives considered**:
- CRC32 hash of room code: Overkill for 5-word list; DJB2 is simpler, no dependencies.
- Index based on character sum: Non-uniform distribution (early letters weighted differently).
- Random selection seeded by room code: Same outcome as hash but requires a PRNG dependency.

## 2. Name Validation Strategy

**Decision**: Validate player names at the Zod schema layer (rejects malformed input before it reaches business logic) AND in `roomStore.ts` (for programmatic safety).

- Trimming: Apply `.trim()` to the raw input in the route handler before passing downstream.
- Empty/whitespace-only rejection: Validate in Zod via `.min(1)` after trimming.
- Character whitelist: Use a Zod `.regex()` with `/^[A-Za-z0-9 _-]+$/`.
- Max 15 chars: Use Zod `.max(15)`.
- Duplicate name check: Keep existing 409 logic in `roomStore.joinRoom()`.

**Rationale**: Zod gives us early validation with clear error messages. The roomStore still enforces invariants (like name uniqueness) that Zod cannot check. The `displayName()` fallback for undefined names is preserved but the route handlers will enforce that if a name is provided, it must be valid.

## 3. Drawer Assignment in RoomSnapshot

**Decision**: Add `drawerId` (always the host ID for round 1) to `RoomSnapshot` so all participants can identify the drawer. Add `secretWord` to `RoomSnapshot` but only include its value when the viewer is the drawer.

**Implementation approach**:
- In `toRoomSnapshot()`, pass the `viewerParticipantId` (already wired).
- Set `drawerId: room.hostId` in every snapshot (room host is always first-round drawer).
- Set `secretWord: room.secretWord` when `viewerParticipantId === room.hostId`; otherwise `secretWord: undefined`.
- Non-drawer participants never receive the secret word, even through polling.

## 4. GamePage Polling

**Decision**: Add polling to GamePage using the same pattern as LobbyPage (~2s interval). The poll fetches room state; the drawer sees the secret word, guessers do not.

**Rationale**: Consistent with the existing polling mechanism (Constitution II). No need for WebSockets. The `fetchRoom` API already passes `participantId` for viewer identification.

## 5. Existing Schemas & Name Validation Gaps

**Decision**: The current `createRoomSchema` and `joinRoomSchema` accept `playerName: z.string().optional()`. Update them to validate provided names (trim, whitelist, max 15). The schema still allows `undefined` (backward compat for unnamed players), but if a string is provided it must pass validation.

## 6. Edge Cases

- **Empty word list**: Guard in `startGame()` — return 400 if list is empty.
- **Word list with single word**: Hash mod 1 = 0, always picks the one word. Acceptable.
- **Whitespace-only name**: Trimmed to empty string, then rejected by `.min(1)`.
- **Name with special chars**: Rejected by regex whitelist.
- **Name exactly 15 chars**: Allowed. 16+ chars rejected.
