<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/003-drawing-guessing-scoring/plan.md`

Active feature: **Active Round Drawing, Guessing & Scoring** (branch `003-drawing-guessing-scoring`).
Stack: Vite + React + TypeScript (frontend), Node.js + Express + TypeScript (backend),
in-memory store only, REST polling (~2s) — no WebSockets, no database, no new deps.
Builds on features 001 (`specs/001-room-lobby-management/`) and 002 (`specs/002-game-start-word-reveal/`).
Key points: guessers submit via the new `POST /rooms/:code/guess` (trimmed, case-insensitive,
empty rejected); correct = 100 points once per round (incorrect = 0); the guess history and scores
sync to all players through the existing GET poll; correct guesses are server-masked in the feed so
the word never leaks; the round does NOT end on a correct guess; the drawer's canvas is drawer-local
(not synced to guessers). Supporting artifacts: `research.md`, `data-model.md`, `contracts/rooms-api.md`, `quickstart.md`.
<!-- SPECKIT END -->
