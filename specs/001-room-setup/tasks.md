# Tasks — Scenario 1: Room Setup & Lobby

## Backend
- [x] T1.1 Add `hostId` to Room model and set on creation
- [x] T1.2 Add player name validation (trim, reject empty/whitespace)
- [x] T1.3 Add `POST /rooms/:code/start` endpoint with host validation and 2-player minimum
- [x] T1.4 Update `toRoomSnapshot` to include `hostId`

## Frontend
- [x] T1.5 Update API client with `startGame` method and updated types
- [x] T1.6 Fix API base URL (remove `/bug` suffix)
- [x] T1.7 Add auto-polling to LobbyPage (~2s interval)
- [x] T1.8 Show "Start Game" only for host, disabled until ≥2 players
- [x] T1.9 Add name validation on create/join forms

## Dependencies
- T1.1 → T1.4 → T1.5 (backend before frontend)
