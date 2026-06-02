# Specification

> Iterative specification by feature group. Each section corresponds to one scenario.
> Updated incrementally after each implementation phase.

---

## Iteration 1 — Room Setup & Lobby (Scenario 1)

### Acceptance Criteria

| ID | Criterion | Detail |
|---|---|---|
| 1.1 | Host assignment | Room creator is stored as `hostId`. Snapshot exposes `hostId` to all participants. |
| 1.2 | Name validation | Names are trimmed on create/join. Empty or whitespace-only names rejected with `"Name cannot be empty"`. |
| 1.3 | Room code handling | Room codes are case-insensitive (uppercased server-side). Non-existent codes return 404. |
| 1.4 | Multi-room isolation | Each room is an independent `Map` entry. No data leaks between rooms. |
| 1.5 | Lobby auto-polling | Lobby polls `GET /rooms/:code` every ~2 seconds. Existing manual refresh button retained. |
| 1.6 | Start game gating | "Start Game" button visible only to host. Enabled only when ≥2 participants present. |
| 1.7 | Start game call | Clicking "Start Game" calls `POST /rooms/:code/start` before navigating to `/game`. |
| 1.8 | Host indicator | Lobby shows a visual indicator next to the host's name (e.g., "(Host)"). |

### Edge Cases
- Player creates room, then a second player joins — both see the lobby with correct host.
- Player enters a 4-char code that doesn't exist — error message shown, not redirected.
- Room with 1 participant — "Start Game" button is visible to host but disabled.
