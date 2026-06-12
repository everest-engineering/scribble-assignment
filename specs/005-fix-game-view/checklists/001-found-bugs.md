# Bug Report: Found Bugs During Full-App Testing

**Date**: 2026-06-11
**Tester**: AI Agent
**Scope**: Full-stack manual API testing + code review

---

## Bug 1: Scoreboard uses `entry.name` as React key (duplicate name crash risk)

- **Severity**: Medium
- **File**: `frontend/src/components/Scoreboard.tsx:27`
- **Description**: The `key` prop on the scoreboard row uses `entry.name` instead of a unique identifier. If two participants share the same name (not prevented by server), React will render duplicate keys, causing potential rendering issues and a console warning.
- **Reproduction**: Join a room with two players sharing the same name (e.g., both named "Alice").
- **Expected**: Key should use `participant.id` which is a UUID.
- **Fix**: Changed `<div key={entry.name}>` to use `participant.id` as the key (mapped as `entry.id`).
- **Status**: ✅ **FIXED**

---

## Bug 2: Canvas `roundNumber` is hardcoded to 1

- **Severity**: Low
- **File**: `backend/src/services/canvasService.ts:29-31`
- **Description**: When initializing `canvasState`, `roundNumber` is hardcoded to `1` instead of being derived from actual round count. After restarting a game, the round number still shows 1.
- **Reproduction**: Play a round, restart, play again — canvas state `roundNumber` is still 1.
- **Expected**: Round number should track the actual round count.
- **Note**: This is cosmetic since the game is currently single-round only, but would matter if multi-round is added.

---

## Bug 3: Missing `.form__error--inline` CSS class

- **Severity**: Low
- **File**: `frontend/src/styles/app.css` (missing class), used in `CreateRoomPage.tsx:66` and `JoinRoomPage.tsx:85`
- **Description**: The `form__error--inline` CSS class is referenced in JSX but never defined in the stylesheet. The error messages fall back to the base `.form__error` block-level styling instead of inline display.
- **Reproduction**: Submit an empty form on CreateRoom or JoinRoom pages.
- **Expected**: The error should appear inline next to the field.
- **Fix**: Add `.form__error--inline` class (likely `display: inline-block` or similar).

---

## Bug 4: Dead code — `redirectOnMount` ref in GamePage

- **Severity**: Low
- **File**: `frontend/src/pages/GamePage.tsx:19`
- **Description**: The `redirectOnMount` ref is initialized to `true` and set to `false` on line 33, but is never read anywhere in the component. It's dead code that can be removed.
- **Reproduction**: None (no observable impact).
- **Fix**: Remove the `redirectOnMount` ref declaration and its assignment.

---

## Bug 5: Optimistic canvas stroke not rolled back on server error

- **Severity**: Low
- **File**: `frontend/src/pages/GamePage.tsx:180-188`
- **Description**: When the drawer completes a stroke, it's optimistically added to local state via `setCanvasStrokes`. If the `api.addStroke` call fails, the error is displayed but the stroke remains in the local canvas state, creating inconsistency between drawer and guessers' views.
- **Reproduction**: Draw a stroke while the server is down.
- **Expected**: The stroke should be rolled back from local state on failure, or the error should indicate the stroke was not saved.
- **Note**: The stroke will be removed on the next successful poll (2s later), but the visual flash is confusing.

---

## Bug 6: Participant names not deduplicated

- **Severity**: Low
- **File**: `backend/src/services/roomStore.ts` (no check)
- **Description**: There is no check preventing duplicate participant names in a room. Multiple players can join with the same name, causing confusion in the UI (especially the scoreboard — see Bug 1).
- **Reproduction**: Two players join the same room with the name "Alice".
- **Expected**: Either duplicate names should be rejected, or the UI should handle them gracefully (which it partially doesn't — see Bug 1).
- **Note**: This may be intentional (friends can have same name), so severity is low.

---

## Summary

| # | Severity | Area | Description |
|---|----------|------|-------------|
| 1 | Medium | Frontend | Scoreboard uses `entry.name` as React key — duplicate key crash risk |
| 2 | Low | Backend | Canvas `roundNumber` hardcoded to 1 |
| 3 | Low | Frontend | Missing `.form__error--inline` CSS class |
| 4 | Low | Frontend | Dead code: unused `redirectOnMount` ref |
| 5 | Low | Frontend | Optimistic canvas stroke not rolled back on server error |
| 6 | Low | Backend | No participant name deduplication |

---

## Test Results

- **Backend unit tests**: 2 files, 4 tests — ✅ ALL PASS
- **Frontend unit tests**: 1 file, 2 tests — ✅ ALL PASS
- **TypeScript compilation (backend)**: ✅ No errors
- **TypeScript compilation (frontend)**: ✅ No errors
- **Manual API testing**: All endpoints tested — basic game flow works correctly
- **Frontend serving**: Vite dev server responds at `http://localhost:5173/`
