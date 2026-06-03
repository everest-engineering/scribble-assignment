# Tasks 002 — Game Start & Drawer Flow

Ordered; later tasks depend on earlier ones.

## Backend
- [x] T1. Add a shared `playerName` field schema (trim → reject empty → max 24)
  and use it in `createRoomSchema` and `joinRoomSchema`. *(none)*
- [x] T2. Add `pickWord(code)` pure helper: deterministic index from code char
  codes into the starter word list. *(none)*
- [x] T3. In `startRound`, after the guards pass, build the `Round`
  (`drawerId = hostId`, `word = pickWord(code)`, empty strokes/guesses,
  `winnerId: null`) and attach it. *(T2)*
- [x] T4. Confirm `toRoomSnapshot` exposes the word only to the drawer during play
  (already implemented in group 1) and reports `drawerId`/`isDrawer`/`role`. *(T3)*

## Frontend
- [x] T5. `CreateRoomPage`: trim name, block empty submit, show server error. *(none)*
- [x] T6. `JoinRoomPage`: trim name, block empty submit (code check already added). *(none)*
- [x] T7. `GamePage`: poll the room; render the viewer's role; show the word for the
  drawer and a guess prompt for guessers. *(T4)*

## Tests / validation
- [x] T8. Backend tests: whitespace-only name rejected; surrounding spaces trimmed;
  `pickWord` deterministic; drawer-vs-guesser word visibility. *(T1,T2,T3)*
- [x] T9. Manual two-tab: host is the drawer and sees the word; guesser does not. *(T7)*
- [x] T10. `npm run build` + `npm test` green for backend and frontend. *(all)*
