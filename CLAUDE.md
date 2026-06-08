<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/004-round-result-restart/plan.md`

Active feature: **Round Result & Host Restart** (branch `004-round-result-restart`).
Stack: Vite + React + TypeScript (frontend), Node.js + Express + TypeScript (backend),
in-memory store only, REST polling (~2s) — no WebSockets, no database, no new deps.
Builds on features 001 (`specs/001-room-lobby-management/`), 002 (`specs/002-game-start-word-reveal/`)
and 003 (`specs/003-drawing-guessing-scoring/`).
Key points: `RoomStatus` gains a third value `ended`; the host ends the active round via the new
host-only `POST /rooms/:code/end` (`playing → ended`) and restarts via the new host-only
`POST /rooms/:code/restart` (`ended → lobby`). In `ended`, `toRoundSnapshot` reveals the word to
everyone and unmasks all guesses (the 002/003 masking applies ONLY while `playing` — regression-safe).
Restart sets `round = null`, resets all `score = 0`, and preserves participants + host; it is
idempotent (no-op when already `lobby`). Result + return-to-lobby sync via the existing GET poll;
a new `ResultsPage` at `/results` follows the page-per-status pattern and reuses `Scoreboard` +
`ResultPanel`. No host transfer exists — the host leaving closes the room (existing behavior).
Supporting artifacts: `research.md`, `data-model.md`, `contracts/rooms-api.md`, `quickstart.md`.
<!-- SPECKIT END -->
