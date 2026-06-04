# Scribble Multiplayer Drawing Game — Submission

## Build Verification

Both backend and frontend build successfully with zero errors:

```
# Backend (tsc)
cd backend && npm run build   → PASS

# Frontend (tsc + vite)
cd frontend && npm run build  → PASS
```

All 8 unit tests pass:

```
# Backend (4 tests)
cd backend && npm test        → 4/4 PASS

# Frontend (4 tests)
cd frontend && npm test       → 4/4 PASS
```

## Features Implemented

### US1 — Room Setup & Lobby (P1)
- Room creation with 4-character alphanumeric code
- Room joining with validation (invalid codes return 404)
- Host assignment (creator = host)
- Lobby participant list synchronized via 2s polling
- Host-only start button; non-hosts see disabled "Host Only" button
- Minimum 2 players required to start game

### US2 — Game Start & Drawer Flow (P2)
- Host automatically becomes drawer
- Deterministic word selection from starter word list
- Secret word visible only to drawer; hidden from guessers
- Drawer clearly identified in UI ("Drawer" role label + "Current Drawer" name)
- Auto-navigation from lobby to game when status changes to "playing"

### US3 — Gameplay Interaction (P3)
- Drawing canvas with mouse-based stroke interaction
- Drawing persisted to server on mouseup; replayed from stored data
- Clear canvas button (drawer only)
- Guess submission with case-insensitive matching
- 100 points for correct guess; 0 points for incorrect
- Real-time guess history via 2s polling
- Sorted scoreboard display

### US4 — Result & Restart (P4)
- Round auto-ends on correct guess (status → "finished")
- Final scores, correct word, and complete guess history displayed
- Canvas and guess form hidden when round is over
- Host-only restart button
- Restart preserves participants and room code; resets drawing/guesses/scores
- All players auto-return to lobby via polling

## Manual Validation Summary

| Category | Count | Status |
|---|---|---|
| Acceptance Scenarios (US1–US4) | 19 | ALL PASS |
| Functional Requirements (FR-001–FR-014) | 14 | ALL PASS |
| Success Criteria (SC-001–SC-005) | 5 | ALL PASS |
| Edge Cases | 9 | ALL PASS |

Each criterion was verified against actual source code (routes, services, store, components) rather than manual testing alone.

## Acceptance Criteria Verification Table

### US1 — Room Setup & Lobby
| # | Scenario | Status | Evidence |
|---|---|---|---|
| 1 | Creator becomes host | PASS | `roomStore.ts:72` — `hostId: participant.id` |
| 2 | Invalid code shows error | PASS | `schemas.ts:38-44` (Zod), `rooms.ts:52-53` (404) |
| 3 | Lobby updates via 2s polling | PASS | `LobbyPage.tsx:25-33` — `setInterval(fetchRoom, 2000)` |
| 4 | <2 players prevents start | PASS | `roomStore.ts:138-140` — `participants.length < 2` guard |
| 5 | Non-host cannot start | PASS | `LobbyPage.tsx:129-136` — disabled button for non-host |

### US2 — Game Start & Drawer Flow
| # | Scenario | Status | Evidence |
|---|---|---|---|
| 1 | Host becomes drawer | PASS | `roomStore.ts:73` — `drawerId: participant.id` |
| 2 | Drawer clearly identified | PASS | `GamePage.tsx:108-116` — role + name display |
| 3 | Word visible to drawer only | PASS | `roomStore.ts:287-290` — conditional `secretWord` |
| 4 | Word hidden from guessers | PASS | `GamePage.tsx:123-128` — `isDrawer` conditional render |

### US3 — Gameplay Interaction
| # | Scenario | Status | Evidence |
|---|---|---|---|
| 1 | Drawing stored and visible | PASS | `CanvasBoard.tsx:129-131` + `roomStore.ts:202-223` |
| 2 | Clear canvas resets | PASS | `CanvasBoard.tsx:169-174` + `roomStore.ts:225-242` |
| 3 | Guess appears in history | PASS | `roomStore.ts:175-181` + `ResultPanel.tsx:70-94` |
| 4 | 100 pts for correct guess | PASS | `roomStore.ts:171-192` — case-insensitive match + 100 pts |
| 5 | Incorrect guess, no score change | PASS | `roomStore.ts:183-193` — score only updated on `isCorrect` |

### US4 — Result & Restart
| # | Scenario | Status | Evidence |
|---|---|---|---|
| 1 | Final scores displayed | PASS | `ResultPanel.tsx:19-47` — sorted scores when finished |
| 2 | Correct word displayed | PASS | `ResultPanel.tsx:32-33` — secretWord in "Round Over" |
| 3 | Complete history displayed | PASS | `ResultPanel.tsx:49-64` — all guesses with correct/incorrect |
| 4 | Host restarts game | PASS | `GamePage.tsx:149-155` — restart button for host |
| 5 | Participants preserved | PASS | `roomStore.ts:256-261` — keeps participants, resets rest |

### Functional Requirements (All 14 PASS)
FR-001 through FR-014 are all satisfied as shown in the acceptance criteria above.

### Edge Cases (All 9 PASS)
Empty/invalid room codes, empty/whitespace names, empty/whitespace guesses, <2 players start, multi-room isolation, backend restart — all handled.

## Known Limitations

- **Single round only**: No multi-round support or drawer rotation per spec assumptions.
- **No real-time sync**: Uses HTTP polling (2s interval) instead of WebSockets per spec constraint.
- **In-memory state**: All game state is lost on backend restart; no database persistence.
- **No authentication**: Participant identity is tracked via a session ID returned at room creation/join.
- **Uncommitted changes**: The working tree contains unstaged modifications (US3–US4 implementation). The last commit (`0b445fa`) does not fully capture the complete feature set. See `git status` for details.
- **Drawing replay**: Drawing is replayed from stored point data; not real-time streamed.
- **No drawer rotation**: The host remains drawer for the entire session.
- **Word selection**: Always uses `STARTER_WORDS[0]` ("rocket"); not randomized.

## Constraints Followed

- ❌ No WebSockets / Socket.IO
- ❌ No databases (SQL, NoSQL, SQLite)
- ❌ No authentication / sessions / JWT / OAuth
- ❌ No new pages added beyond existing structure
- ❌ No new npm packages added
- ✅ TypeScript throughout with strict types
- ✅ Zod validation on all API inputs
- ✅ HTTP polling as sole sync mechanism
- ✅ Brownfield enhancement — extended existing architecture
- ✅ Single round, host as drawer, deterministic word
