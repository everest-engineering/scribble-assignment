# Plan — Discovery

## Purpose
Identify gaps in the starter codebase and document assumptions before implementing the four scenarios. This ensures all changes are traceable to specific gaps and the scope is clearly bounded.

## Findings

1. The `Room` model lacks `hostId`, `status` is only `"lobby"`.
2. `toRoomSnapshot()` ignores viewer identity — everyone gets the same data.
3. Player names are not validated (empty → `"Player"`).
4. Guesses, scores, drawing data, and game round state are entirely absent.
5. Frontend has no polling; only manual refresh in the lobby.

## Out of Scope
- No WebSockets or real-time sync
- No databases or persistent storage
- No authentication, accounts, or sessions
- No multiple rounds, drawer rotation, timers
- No custom word packs or spectator mode
