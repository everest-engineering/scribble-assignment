# Quickstart & Acceptance: Room & Lobby Management

Manual two-browser validation is the primary acceptance gate (per the constitution). This script maps each step to the user stories and FRs in [spec.md](./spec.md).

## Prerequisites

- Node `24.13.0` (see `.nvmrc`).
- Dependencies installed: `cd backend && npm install` and `cd frontend && npm install` (first run only).

## Run

Two terminals:

```bash
# Terminal 1 — backend API on http://localhost:3001
cd backend && npm run dev

# Terminal 2 — frontend (Vite) dev server
cd frontend && npm run dev
```

Open the printed Vite URL. For two-player testing, use **two browsers** or one normal + one incognito window (each window is an independent participant session).

## Build gate (must pass before any PR)

```bash
cd backend && npm run build
cd frontend && npm run build
```

Optional unit tests:

```bash
cd backend && npm test     # roomStore + schemas
cd frontend && npm test    # api client
```

## Acceptance script

### A. Host creates a room — User Story 1 (FR-001, FR-002, FR-003)

1. Window 1 → **Create Room**, enter name "Alice", continue.
2. ✅ A 4-character code is shown (e.g., `K7P2`).
3. ✅ Alice appears in Participants and is marked **Host**.
4. ✅ The **Start Game** control is visible to Alice but **disabled** (only 1 player). (FR-012)

### B. Second player joins — User Story 2 (FR-004, FR-009)

5. Window 2 → **Join Room**, enter name "Bob" and the code from step 2, join.
6. ✅ Bob lands in the same lobby and sees both Alice and Bob.
7. ✅ Within ~2s, **Window 1 updates automatically** to show Bob — no manual refresh. (FR-010)
8. ✅ Bob is a regular player (no Host badge) and sees **no** Start control. (FR-011)

### C. Code validation — User Story 3 (FR-005, FR-006, FR-007)

9. Window 2 (new join attempt) → submit an **empty** code → ✅ "Please enter a room code"; no navigation. (FR-005)
10. Submit a **wrong** code (e.g., `ZZZZ`) → ✅ "Room not found". (FR-006)
11. Submit the valid code in **lowercase** with spaces (e.g., ` k7p2 `) → ✅ joins successfully. (FR-007)

### D. Room isolation — User Story 4 (FR-008)

12. In a third window, create a **second** room (code `M3X9`) with "Carol".
13. ✅ Room `M3X9` shows only Carol; room `K7P2` shows only Alice/Bob.
14. ✅ Actions in one room (join, start) leave the other room's list unchanged.

### E. Presence / departure (FR-010a)

15. Close Bob's window (don't click anything — simulate a dropped tab).
16. ✅ Within ~10s, Alice's lobby auto-removes Bob from the list.

### F. Host-controlled start — User Story 5 (FR-011, FR-012, FR-013)

17. With Alice + Bob both present (≥2), Alice's **Start Game** is enabled. (FR-012)
18. Alice clicks **Start Game** → ✅ both windows navigate into the game view within ~2s. (FR-013)
19. (Negative) Before reaching 2 players, confirm Start stays disabled; a direct `POST /rooms/:code/start` by a non-host returns `403`. (FR-011)

### G. Late join after start (FR-014)

20. After the game has started, a new window attempts to join `K7P2` → ✅ "This game has already started"; not added.

### H. Host leaves closes room (FR-015)

21. Re-create a fresh room with Alice (host) + Bob. Close **Alice's** (host) window.
22. ✅ Within ~10s, Bob's lobby ejects him to the start screen with a "room closed / host left" message; the code stops working.

### I. Capacity (FR-016)

23. With a room at 8 players, a 9th join attempt → ✅ "This room is full".

## Definition of Done (this feature)

- [ ] All ✅ checks above pass in a two-browser run.
- [ ] `backend` and `frontend` builds pass.
- [ ] No WebSocket/persistent-storage/new-dependency introduced (constitution).
- [ ] Existing `roomStore`/`schemas`/`api` tests still pass; new behavior covered by added unit tests.
