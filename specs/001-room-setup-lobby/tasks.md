# Tasks: Room Setup & Lobby

## Backend
- [x] 1.1 — Fix `roomStore.saveRoom` dead code (remove or wire it in)
- [x] 1.2 — Add `hostId` to Room model and set on creation
- [x] 1.3 — Add join validation: reject empty/whitespace names with clear error
- [x] 1.4 — Add create-room validation: reject empty/whitespace names
- [x] 1.5 — Expose `hostId` in `RoomSnapshot`

## Frontend
- [x] 1.6 — Fix API base URL typo (`/bug` → ``)
- [x] 1.7 — Add auto-polling to LobbyPage (useEffect + setInterval ~2s)
- [x] 1.8 — Show "Start Game" button only for host
- [x] 1.9 — Disable "Start Game" until ≥2 participants
- [x] 1.10 — Add form validation for empty/whitespace names on create/join pages

## Validation
- [x] 1.11 — Manual test: two tabs, create + join, verify polling, host-only start, error messages
