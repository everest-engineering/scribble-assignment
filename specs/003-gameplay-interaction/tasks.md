# Tasks: Gameplay Interaction

## Backend
- [ ] 3.1 — Add `POST /rooms/:code/draw` endpoint (store canvas strokes)
- [ ] 3.2 — Add `POST /rooms/:code/guess` endpoint with validation
- [ ] 3.3 — Implement guess comparison (trimmed, case-insensitive)
- [ ] 3.4 — Implement scoring: correct = +100, incorrect = +0
- [ ] 3.5 — Store guess history and expose in snapshot
- [ ] 3.6 — Expose canvasData in snapshot

## Frontend
- [ ] 3.7 — Implement interactive `<canvas>` for drawer (freeform drawing)
- [ ] 3.8 — Add "Clear Canvas" button wired to API
- [ ] 3.9 — Display canvas for guessers (read-only, from snapshot data)
- [ ] 3.10 — Wire GuessForm to API with validation (empty rejected)
- [ ] 3.11 — Disable GuessForm for drawer
- [ ] 3.12 — Populate Scoreboard dynamically from snapshot scores
- [ ] 3.13 — Add polling to GamePage (~2s) for canvas + guesses + scores

## Validation
- [ ] 3.14 — Manual test: drawer draws, guesser sees it; guesses validated; scores update
