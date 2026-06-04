# Reflection Report

## What the starter app already had
The starter provided a minimal brownfield enhancement scaffold with room creation/join flows, in-memory backend storage, a React frontend with routing, and placeholder UI for the game screen. It had working endpoints for creating/joining/polling rooms, seed data (5 words, 2 roles), and a custom RoomStore for frontend state. The manual lobby refresh button was the only polling mechanism.

## What I added
All 4 feature groups were implemented incrementally:

**Group 1 — Room Setup & Lobby:** Host tracking (`isHost` flag), player name validation (trim/reject empty), auto-polling (~2s), host-only start button with 2-player minimum.

**Group 2 — Game Start & Drawer Flow:** Room status machine (`lobby` → `playing` → `finished`), drawer assignment (first participant), deterministic word selection via room code hash, per-viewer word visibility (drawer sees word, guessers see null until round ends).

**Group 3 — Gameplay Interaction:** Interactive HTML5 Canvas with freehand drawing and clear, drawing sync via POST+GET polling, guess submission with trimming and case-insensitive comparison, +100 scoring on correct guess, synced guess history and live scoreboard.

**Group 4 — Result, Restart & Final Validation:** Result state showing word/scores/guesses to all players when finished, host-only restart that preserves the player list while clearing all round state.

## Key decisions
- Used HTTP polling over WebSockets to stay within the out-of-scope constraints.
- Chose deterministic word selection (hash of room code) rather than random to meet the spec's "deterministically selected" requirement.
- Stored drawing as a base64 data URL on the server for simple sync without WebSockets.
- Added `"finished"` status to enable result visibility and restart gating.

## AI usage
AI assisted with code generation, test writing, and file-level planning. Every generated line was reviewed before committing. The AI was instructed to follow existing conventions (Zod validation, Express patterns, React hooks, existing type structures).

## Tradeoffs
- Canvas sync uses full data URL transfers rather than incremental strokes — simpler but less bandwidth-efficient. Acceptable for a lab with one round.
- No drawer rotation or multiple rounds (explicitly out of scope).
- No stale room cleanup — rooms persist in memory until server restart.
