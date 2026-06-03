# Tasks 004 — Result, Restart & Final Validation

Ordered; later tasks depend on earlier ones.

## Backend
- [x] T1. `api/schemas.ts`: add `restartRoomSchema` (`{ participantId }`). *(none)*
- [x] T2. `roomStore.restartRound(code, participantId)`: host guard (403),
  lobby guard (409); set `round = null`, `status = "lobby"`, reset all scores to 0,
  preserve participants. *(none)*
- [x] T3. `api/rooms.ts`: `POST /:code/restart`. *(T1,T2)*

## Frontend
- [x] T4. `services/api.ts`: `restart(code, participantId)`. *(none)*
- [x] T5. `state/roomStore.ts`: `restart()` action. *(T4)*
- [x] T6. `components/ResultPanel.tsx`: correct word, winner, final scoreboard,
  full guess history; host Restart button + waiting message for others. *(T5)*
- [x] T7. `pages/GamePage.tsx`: render `ResultPanel` when `status === "results"`;
  rely on existing lobby redirect for restart. *(T6)*

## Tests / validation
- [x] T8. Backend tests: `restartRound` 403/409/reset paths; results-state word
  visibility for all. *(T2)*
- [x] T9. Manual two-tab: complete round → shared result → host restart → both back
  in lobby with players preserved + scores cleared → start again. *(T7)*
- [x] T10. `npm run build` + `npm test` green for backend and frontend. *(all)*
