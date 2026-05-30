# Quickstart: Validate Game Start & Drawer Flow

**Feature**: 002-game-start-drawer-flow | **Prerequisites**: Scenario 1 complete, Node 18+, two browser tabs

## 1. Start services

```bash
cd backend && npm install && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

Confirm `http://localhost:3001/health` returns `{ "ok": true }`.

## 2. Name validation — create (Tab A)

1. Open `http://localhost:5173` → **Create Room**
2. Submit with empty name or `"   "` → error **before** lobby; message explains name is required
3. Submit name `"  Host  "` → lobby shows **Host** (trimmed)

## 3. Name validation — join (Tab B)

1. **Join Room** with valid code from Tab A
2. Submit whitespace-only name → error before lobby
3. Join with `"  Guest  "` → lobby shows **Guest** (trimmed)

## 4. Start game and navigation

| Step | Tab | Expected |
|------|-----|----------|
| Host + Guest in lobby | A, B | Both lists show trimmed names |
| Host clicks Start | A | Both tabs on `/game` within ~3s |
| Guest was waiting in lobby | B | Auto-navigates to `/game` without manual refresh |

## 5. Drawer identification

| Tab | Expected |
|-----|----------|
| A (Host) | UI shows Host as **drawer** (badge/label) |
| B (Guest) | UI shows Guest as **guesser**; Host identified as drawer |

## 6. Secret word visibility

| Tab | Expected |
|-----|----------|
| A (Drawer) | Secret word **rocket** visible in plain text |
| B (Guesser) | No secret word anywhere on screen; neutral guess prompt only |

**Network check (optional)**: In Tab B devtools, inspect poll response JSON — confirm
`secretWord` key is absent.

## 7. Determinism

1. Repeat create → join → start in a fresh room
2. Confirm drawer is always the host and word is always **rocket**

## 8. Game guard and polling cleanup

1. With room in lobby, open `/game` manually → redirect to `/lobby`
2. After game starts, leave `/game` via Exit → confirm game polling stops in network tab

## 9. Poll error resilience

1. Stop backend while on game screen
2. Confirm non-blocking error/status; prior roles remain visible until next successful poll

## 10. Build check

```bash
cd backend && npm run build
cd frontend && npm run build
```

Both must complete without errors before marking Scenario 2 complete.
