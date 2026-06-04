# Tasks

## Phase 1 — Spec Kit Foundation
- [x] 1.1 Create discovery notes (DISCOVERY.md)
- [x] 1.2 Create constitution (speckit.constitution.md)
- [x] 1.3 Create specification (speckit.specify.md)
- [x] 1.4 Create plan (speckit.plan.md)
- [x] 1.5 Create tasks (speckit.tasks.md)

## Phase 2 — Backend Implementation
- [ ] 2.1 Extend game types (models/game.ts) — hostId, status union, game state fields, GuessEntry, viewerRole
- [ ] 2.2 Add validation schemas (api/schemas.ts) — submitGuess, startGame, restartGame schemas
- [ ] 2.3 Implement game logic (services/roomStore.ts) — startGame, submitGuess, restartGame, name validation, filtered snapshots
- [ ] 2.4 Add API routes (api/rooms.ts) — POST /:code/start, POST /:code/guess, POST /:code/restart
- [ ] 2.5 Update backend tests

## Phase 3 — Frontend Implementation
- [ ] 3.1 Fix API base URL and update types/services (services/api.ts)
- [ ] 3.2 Update room store with game actions (state/roomStore.ts)
- [ ] 3.3 Add name validation on create/join pages
- [ ] 3.4 Implement lobby auto-polling and host controls (LobbyPage.tsx)
- [ ] 3.5 Create drawing canvas component (components/Canvas.tsx)
- [ ] 3.6 Implement full GamePage with all game flows
- [ ] 3.7 Wire GuessForm to API with validation
- [ ] 3.8 Wire Scoreboard and ResultPanel with game data
- [ ] 3.9 Add CSS styles for drawing canvas and game elements

## Phase 4 — Validation
- [ ] 4.1 Run backend tests
- [ ] 4.2 Run frontend tests
- [ ] 4.3 Manual end-to-end test: create room → join → start → draw → guess → result → restart
- [ ] 4.4 Test edge cases: empty names, invalid codes, non-host actions

## Phase 5 — Reflection
- [ ] 5.1 Write reflection report (REFLECTION.md)

## Dependencies
- 2.1 → 2.2 → 2.3 → 2.4 → 2.5 (sequential)
- 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7 → 3.8 → 3.9 (sequential, but some can overlap)
- 2.x and 3.x can proceed in parallel (backend/frontend are independent)
- 4.x depends on both 2.x and 3.x being complete
