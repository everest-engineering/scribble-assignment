# Analysis Report — Feature 008 (Result, Restart, and Final Validation)

**Date**: 2026-07-06
**Scope**: spec.md, plan.md, tasks.md, data-model.md, contracts/api.md, quickstart.md
**Source validation**: All existing backend/frontend source files read and cross-referenced

---

## Detection Pass Results

### Pass 1: Duplication

| Finding | Severity | Location | Description |
|---------|----------|----------|-------------|
| None | — | — | All cross-references are intentional (quickstart ≈ tasks, data-model ≈ plan §1.1) |

**No duplication issues.**

---

### Pass 2: Ambiguity

| ID | Severity | Location | Description |
|----|----------|----------|-------------|
| A01 | **Critical** | spec.md FR-003 ↔ backend roomStore.ts:291 | FR-003 says "snapshot MUST include the correct word" for all participants in result state. But `toRoomSnapshot()` only includes `secretWord` when `viewerParticipantId === room.currentDrawerId`. No document mentions modifying this logic for result state. **Non-drawers will see `null` for the correct word.** |
| A02 | **High** | spec.md FR-008 ↔ backend roomStore.ts:213-279 | FR-008 says all gameplay actions must be rejected in result state. But `addCanvasStroke()`, `clearCanvas()`, and `nextWord()` only check `participantId !== room.currentDrawerId` — they **never check `room.status`**. The drawer can still draw/clear/advance after the game ends. |
| A03 | **Medium** | spec.md FR-001, plan.md §1.3 | "End Game" button placement in GamePage is unspecified. Should it be a standalone button? In the button-row? Next to "Next Word"? |
| A04 | **Medium** | spec.md FR-003, data-model.md | Whether the final canvas drawing should be visible in the result view is unspecified. Data-model says `canvasStrokes` are preserved, but ResultView component only shows word, scores, guesses. |

---

### Pass 3: Underspecification

| ID | Severity | Location | Description |
|----|----------|----------|-------------|
| U01 | **High** | plan.md, quickstart.md, tasks.md | No document mentions adding `room.status === "result"` guards to existing backend services (`addCanvasStroke`, `clearCanvas`, `nextWord`). FR-008 enforcement is assumed but not planned. |
| U02 | **Medium** | plan.md, quickstart.md, tasks.md | No document mentions modifying `toRoomSnapshot()` for result-state `secretWord` visibility. All participants need to see the word in result state. |
| U03 | **Low** | tasks.md T006 | `RoomSnapshot.status` type in frontend `api.ts:32` is `"lobby" | "drawing"`. T006 ("Add endGame/restartGame to api.ts") doesn't explicitly call out widening this type to include `"result"`. |

---

### Pass 4: Constitution Alignment

| Principle | Result | Notes |
|-----------|--------|-------|
| **I. Deterministic Game Logic** | ✅ Pass | End game and restart are explicit user actions, no random/time-based outcomes. |
| **II. RESTful Synchronization** | ✅ Pass | HTTP POST for new endpoints. Result state propagated via existing polling. No push protocol. |
| **III. Validation Rigor** | ⚠️ Partial | Drawer-only and host-only validations are correct. But `addCanvasStroke`/`clearCanvas`/`nextWord` lack status validation — they would allow the drawer to mutate state in result status via direct API calls. **Violates the spirit of FR-008.** |
| **IV. Brownfield Enhancement** | ✅ Pass | Extends existing types, services, and routes. Follows established patterns. No new dependencies. |
| **V. State Isolation & Immutability** | ✅ Pass | `cloneRoom` uses `structuredClone`. Each room isolated. Restart clears state while preserving participants. |

---

### Pass 5: Coverage Gaps

| ID | Severity | Description |
|----|----------|-------------|
| G01 | **Critical** | `toRoomSnapshot()` must be modified: when `status === "result"`, include `secretWord` for ALL viewers (not just the drawer). Otherwise guessers see `null` for the correct word. |
| G02 | **High** | `addCanvasStroke()`, `clearCanvas()`, `nextWord()` need a status guard: if `room.status === "result"`, return 400 "Game has ended". Without this, the drawer can continue drawing/advancing post-game via direct API calls. |
| G03 | **Low** | `submitGuess()` rejects non-drawing statuses with "Game is not in progress". For result state, a more accurate message like "Game has ended" would be clearer, but "not in progress" technically works since result !== drawing. |

---

### Pass 6: Inconsistency

| ID | Severity | Location | Description |
|----|----------|----------|-------------|
| I01 | **High** | frontend api.ts:32 vs backend game.ts:2 | Frontend `RoomSnapshot.status` is `"lobby" | "drawing"`. Backend will become `"lobby" | "drawing" | "result"`. The frontend type must be widened — not called out in any task. |
| I02 | **Medium** | contracts/api.md vs backend schemas.ts | Contracts say `participantId` query param is "required" but existing `roomViewerQuerySchema` makes it `optional` (with manual `!participantId` check after parse). This is the existing codebase pattern and works, but the contract language is slightly inconsistent with the implementation pattern. |

---

## Summary

### Critical Issues (block implementation)

| ID | File(s) | Fix |
|----|---------|-----|
| **C001** (A01+G01) | `backend/src/services/roomStore.ts:281-296` | Modify `toRoomSnapshot()`: when `status === "result"`, always include `room.secretWord` regardless of viewer identity |
| **C002** (A02+G02+U01) | `backend/src/services/roomStore.ts:213-279` | Add `if (room.status === "result") return error` guards to `addCanvasStroke()`, `clearCanvas()`, and `nextWord()` |

### High Issues (fix before/during implementation)

| ID | File(s) | Fix |
|----|---------|-----|
| **H001** (I01+U03) | `frontend/src/services/api.ts:32` | Widen `RoomSnapshot.status` to `"lobby" \| "drawing" \| "result"` |

### Medium Issues (address during implementation)

| ID | Description | Action |
|----|-------------|--------|
| M001 | End Game button placement in GamePage | Place in button-row alongside "Next Word", shown only when `isDrawer && room.status === "drawing"` |
| M002 | Canvas visibility in result view | Not displayed (ResultView shows word/scores/guesses only). `canvasStrokes` preserved in room data but unused in UI. Accept as-is. |
| M003 | Error message for rejected actions in result state | Use "Game has ended" instead of "Game is not in progress" for clarity |

### Recommendation

Fix **C001** and **C002** before beginning implementation. These are real bugs, not design preferences. Without them, FR-003 and FR-008 are violated. Update plan.md and quickstart.md to reflect these fixes so the design documents remain accurate.

Update `plan.md`:
- Add note in §1.1: "`toRoomSnapshot` must expose `secretWord` to all viewers when `status === "result"`"
- Add note in §1.1: "Existing gameplay endpoints (`addCanvasStroke`, `clearCanvas`, `nextWord`) must reject with 400 when `status === "result"`"

Update `quickstart.md`:
- Add step 2.1: "Add `room.status === "result"` rejection to `addCanvasStroke`, `clearCanvas`, `nextWord`"
- Add step 0.5: "Modify `toRoomSnapshot` to show `secretWord` to all participants in result state"
- Add step 4.0: "Widen frontend `RoomSnapshot.status` type to include `"result"`"
