<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/002-game-start-word-reveal/plan.md`

Active feature: **Game Start, Drawer Selection & Secret Word Reveal** (branch `002-game-start-word-reveal`).
Stack: Vite + React + TypeScript (frontend), Node.js + Express + TypeScript (backend),
in-memory store only, REST polling (~2s) — no WebSockets, no database, no new deps.
Builds on feature 001 (`specs/001-room-lobby-management/`). Key points: on game start the
host becomes the round-1 drawer; the secret word is deterministically picked (seed = code+round)
and withheld from guessers' responses (drawer-only); player names are trimmed and empty ones rejected.
Supporting artifacts: `research.md`, `data-model.md`, `contracts/rooms-api.md`, `quickstart.md`.
<!-- SPECKIT END -->
