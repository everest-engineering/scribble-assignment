# Tasks: Result, Restart & Final Validation

## Backend
- [ ] 4.1 — Set status to `"roundEnd"` on correct guess
- [ ] 4.2 — Add `POST /rooms/:code/restart` endpoint (host-only)
- [ ] 4.3 — Implement restart: clear round state, set status to `"lobby"`, preserve participants

## Frontend
- [ ] 4.4 — Detect `"roundEnd"` in GamePage and show result state
- [ ] 4.5 — Populate ResultPanel with final word, scores, guess history
- [ ] 4.6 — Show "Restart" button only for host
- [ ] 4.7 — Wire restart button to API, navigate to `/lobby`

## Validation
- [ ] 4.8 — Full end-to-end test: create → join → start → draw → guess → result → restart → play again
- [ ] 4.9 — Run `npm run build` on both frontend and backend
- [ ] 4.10 — Verify all existing tests still pass
