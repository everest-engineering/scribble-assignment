# Requirements Checklist — 004-result-restart-validation

## Specification Quality

- [x] **User stories are prioritized** (P1, P2, P3)
- [x] **Each user story is independently testable**
- [x] **Acceptance scenarios use Given/When/Then format**
- [x] **Edge cases are documented** (at least 10)
- [x] **Functional requirements are numbered sequentially** (continuing from FR-033 → FR-034)
- [x] **Success criteria are measurable**
- [x] **Assumptions are explicitly stated**
- [x] **No [NEEDS CLARIFICATION] markers remain unresolved**

## Functional Requirement Coverage

### FR-034 — Persistent lastRoundResult
- [ ] `clearExpiredRoundResult()` function is removed
- [ ] `lastRoundResult` no longer auto-expires after 6 seconds
- [ ] `lastRoundResult` persists in snapshot until restart clears it
- [ ] `lastRoundResultSetAt` is kept for potential future use but not read by auto-clear logic

### FR-035 — Result overlay display
- [ ] `RoundResultCard` renders when `lastRoundResult` is present in room state
- [ ] Overlay uses `position: fixed; inset: 0` backdrop pattern (existing)
- [ ] Overlay disappears when `lastRoundResult` is null (initially or after restart)

### FR-036 — Result overlay content
- [ ] Shows correct secret word (bolded)
- [ ] Shows drawer name
- [ ] Shows table of all participants with round and cumulative scores
- [ ] Shows full guess history: guesser name, guess text, correct/incorrect badge, timestamp
- [ ] All participant names resolved from `participants[]` (not just guessHistory)

### FR-037 — Continue button
- [ ] Visible to all players regardless of role
- [ ] Label reads "Continue" or equivalent

### FR-038 — Continue dismisses locally
- [ ] Clicking does NOT call any API endpoint
- [ ] Overlay is dismissed on the client only
- [ ] Subsequent polls do NOT re-show overlay (client remembers dismissal)
- [ ] Other players are NOT affected

### FR-039 — Restart endpoint
- [ ] `POST /:code/restart` route exists
- [ ] Body accepts `{ playerId }`
- [ ] Validates with Zod schema
- [ ] Resets: `status = "lobby"`, clears `currentRound`, `drawerId`, `secretWord`, `strokes`, `guessHistory`, `scores`, `lastRoundResult`, `lastRoundResultSetAt`
- [ ] Preserves: `participants`, `hostId`, `code`, `createdAt`
- [ ] Returns updated room snapshot with lobby status

### FR-040 — Host-only restart
- [ ] Non-host caller receives 403 error
- [ ] Host caller succeeds

### FR-041 — No-op prevention
- [ ] Room not in "playing" status returns 400 error
- [ ] Room in "playing" status (with or without lastRoundResult) succeeds

### FR-042 — Restart button visibility
- [ ] Host sees "Restart Game" button on result overlay
- [ ] Non-host does NOT see "Restart Game" button on result overlay
- [ ] Button triggers `roomStore.restartGame()` on click

### FR-043 — Exit Game coexists
- [ ] "Exit Game" button visible on result screen
- [ ] "Exit Game" clears sessionStorage and redirects to home
- [ ] Both buttons are visible to host simultaneously

### FR-044 — Participant lastSeenAt
- [ ] `Participant` model has `lastSeenAt: string` (ISO timestamp)
- [ ] `GET /:code` updates the requesting participant's `lastSeenAt` in the room
- [ ] New participants get `lastSeenAt` set on join/create

### FR-045 — hostDisconnected in snapshot
- [ ] `RoomSnapshot` includes `hostDisconnected: boolean`
- [ ] `toRoomSnapshot()` computes it: `true` if host's `lastSeenAt` is >30s from now
- [ ] `hostDisconnected` is `false` when host has polled within 30s

### FR-046 — drawerDisconnected in snapshot
- [ ] `RoomSnapshot` includes `drawerDisconnected: boolean`
- [ ] `toRoomSnapshot()` computes it: `true` if room is playing and drawer's `lastSeenAt` >30s from now
- [ ] `drawerDisconnected` is `false` when not in "playing" status

### FR-047 — Claim-host endpoint
- [ ] `POST /:code/claim-host` route exists
- [ ] Body accepts `{ participantId }`
- [ ] Validates with Zod schema
- [ ] Sets `room.hostId = participantId`
- [ ] Returns updated room snapshot

### FR-048 — Claim-host validation
- [ ] Accepts request from any participant (including current host)
- [ ] Rejects non-existent participantId with 404
- [ ] No game-state check needed (works in lobby or playing)

### FR-049 — Host disconnected popup
- [ ] Popup/banner shown when `hostDisconnected` is `true` and viewer is NOT host
- [ ] "Claim Host" button visible in the popup
- [ ] Popup visible on both GamePage and LobbyPage
- [ ] Popup disappears when `hostDisconnected` becomes `false` (host returns or claim happens)
- [ ] Popup does NOT show for the host themselves

### FR-050 — Skip-round endpoint
- [ ] `POST /:code/skip-round` route exists
- [ ] Body accepts `{ playerId }`
- [ ] Validates with Zod schema
- [ ] Calls `advanceRound()` (increments round, picks new drawer, resets strokes/guesses/roundScores, sets lastRoundResult)
- [ ] Returns updated room snapshot

### FR-050a — Skip-round rejects ended round
- [ ] Endpoint rejects with 400 if correct guess exists in current round's guessHistory

### FR-051 — Skip-round host-only
- [ ] Non-host caller receives 403 error
- [ ] Host caller succeeds

### FR-052 — Skip Round button
- [ ] "Skip Round" button visible on GamePage whenever viewer is host
- [ ] Non-host does NOT see "Skip Round" button
- [ ] Button triggers `roomStore.skipRound()` on click

### FR-053 — Max name length (backend)
- [ ] `trimmedNonEmptyString` schema adds `.max(20)` constraint
- [ ] Names >20 chars return a clear validation error

### FR-054 — Max name length (frontend)
- [ ] Create-room name input has `maxLength={20}`
- [ ] Join-room name input has `maxLength={20}`

### FR-055 — Drawer disconnected popup
- [ ] Popup shown when `drawerDisconnected` is `true` and viewer is NOT host
- [ ] "Notify Host" button visible in the popup
- [ ] Popup disappears when `drawerDisconnected` becomes `false` (drawer reconnects or round skipped)

### FR-056 — Suggest-skip endpoint
- [ ] `POST /:code/suggest-skip` route exists
- [ ] Body accepts `{ participantId }`
- [ ] Validates with Zod schema
- [ ] Sets room's `skipSuggested = true`
- [ ] Returns updated room snapshot

### FR-057 — skipSuggested in snapshot
- [ ] `RoomSnapshot` includes `skipSuggested: boolean`
- [ ] Cleared to `false` when a skip-round or restart is called

### FR-058 — Host skip-requested badge
- [ ] "Skip Round" button shows visual badge/pulse when `skipSuggested` is `true`
- [ ] Badge hidden when `skipSuggested` is `false`

### FR-059 — skipSuggested lifecycle clearance
- [ ] `skipSuggested` cleared on `advanceRound()` (normal or skip)
- [ ] `skipSuggested` cleared on `restartGame()`

## Success Criterion Validation

- [ ] **SC-016**: Manual test — observe result overlay for 10+ seconds; it does not disappear
- [ ] **SC-017**: Open 2+ browser tabs; verify result data matches within 2 seconds
- [ ] **SC-018**: Host clicks Restart; all tabs see lobby within 2 seconds with all players
- [ ] **SC-019**: Non-host tab has no restart button; direct API call returns 403
- [ ] **SC-020**: Player A clicks Continue while Player B does not; A sees next round, B still sees result
- [ ] **SC-021**: Close host tab; non-host tabs see `hostDisconnected: true` within 32 seconds (30s + 2s poll)
- [ ] **SC-022**: Non-host clicks Claim Host; all tabs see new hostId within 2 seconds
- [ ] **SC-023**: Close drawer tab; host tab sees skip-requested badge within 32 seconds
- [ ] **SC-024**: Host clicks Skip Round; all tabs see result overlay with correct word, advance to next round
- [ ] **SC-025**: Submit name >20 chars via API returns error; UI input blocks typing past 20
- [ ] **SC-026**: Close drawer tab; non-host tabs see "Drawer disconnected" popup within 32 seconds; clicking "Notify Host" shows badge on host's Skip Round button

## Code Review Checklist

- [ ] **Backend: `models/game.ts`** — add `lastSeenAt: string` to `Participant`, add `hostDisconnected` and `drawerDisconnected` to `RoomSnapshot`
- [ ] **Backend: `services/roomStore.ts`** — remove `clearExpiredRoundResult()` and call site; update `createParticipant()` to set `lastSeenAt`; update `getRoom()` to update caller's `lastSeenAt`; add `restartGame()`, `claimHost()`, `skipRound()` functions
- [ ] **Backend: `services/roomStore.ts`** — update `toRoomSnapshot()` to compute `hostDisconnected` and `drawerDisconnected`
- [ ] **Backend: `api/rooms.ts`** — add routes: `POST /:code/restart`, `POST /:code/claim-host`, `POST /:code/skip-round`, `POST /:code/suggest-skip`
- [ ] **Backend: `api/schemas.ts`** — add schemas: `restartGameSchema`, `claimHostSchema`, `skipRoundSchema`, `suggestSkipSchema`; update `trimmedNonEmptyString` with `.max(20)`
- [ ] **Frontend: `services/api.ts`** — add methods: `restartGame()`, `claimHost()`, `skipRound()`, `suggestSkip()`
- [ ] **Frontend: `services/api.ts`** — update `RoomSnapshot` type with `hostDisconnected`, `drawerDisconnected`, `skipSuggested`
- [ ] **Frontend: `state/roomStore.ts`** — add methods: `restartGame()`, `claimHost()`, `skipRound()`, `suggestSkip()`, `dismissLastRoundResult()`; update `fetchRoom()` to respect local dismissal; add `lastSeenAt` passthrough
- [ ] **Frontend: `pages/GamePage.tsx`** — wire Continue, Restart, Skip Round, Claim Host, Suggest Skip handlers; pass new props to RoundResultCard; show host-disconnected and drawer-disconnected popups
- [ ] **Frontend: `components/RoundResultCard.tsx`** — add guess history table, Continue button, Restart button (host only), participant name fix using `participants[]`
- [ ] **Frontend: `components/HostDisconnectedBanner.tsx`** — new component: shows "Host disconnected" message + "Claim Host" button
- [ ] **Frontend: `components/DrawerDisconnectedBanner.tsx`** — new component: shows "Drawer disconnected" popup + "Notify Host" button for non-host players
- [ ] **Frontend: name input fields** — add `maxLength={20}` to create-room and join-room name inputs
- [ ] All files pass `npm run typecheck` and `npm run lint`
