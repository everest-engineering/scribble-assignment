# Tasks 001 — Room Setup & Lobby

1. Document discovery gaps (host, validation, polling) — **done in docs/discovery.md**
2. Extend `Room` / `RoomSnapshot` types with `hostId` and viewer flags — depends on (1)
3. Implement `normalizePlayerName` and use in create/join — depends on (2)
4. Add Zod schemas for trimmed non-empty names and room codes — depends on (3)
5. Set `hostId` in `createRoom` — depends on (2)
6. Add `POST /rooms/:code/start` with host + min-players checks — depends on (5)
7. Fix frontend `API_BASE_URL` — parallel with (4)
8. Add lobby polling hook (~2000ms) — depends on (7)
9. Wire host-only Start button and error states — depends on (6), (8)
10. Add backend tests for host and validation — depends on (5)
11. Manual two-tab lobby validation — depends on (9)
