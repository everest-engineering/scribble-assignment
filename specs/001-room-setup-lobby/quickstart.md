# Quickstart: Validate Room Setup & Lobby

**Feature**: `001-room-setup-lobby`  
**Prerequisites**: Backend on `:3001`, frontend on `:5173`

## Start services

```bash
cd backend && npm run dev
```

```bash
cd frontend && npm run dev
```

## Manual test checklist (two browser tabs)

### 1. Host creates room

1. Tab A → **Create Room** → enter name → submit.
2. Confirm lobby shows room code and your name with `(Host)` label.

### 2. Second player joins

1. Tab B → **Join Room** → enter name + code from Tab A.
2. Within ~3 s, Tab A participant list shows Tab B player **without** clicking refresh.

### 3. Join validation

| Action | Expected |
|--------|----------|
| Join with empty code | "Room code is required" |
| Join with `IO01` | Format error (not "not found") |
| Join with `ZZZZ` (valid format, missing room) | "Room not found" |

### 4. Host-only start rules

| Action | Expected |
|--------|----------|
| Tab A alone clicks Start | Blocked — need 2 players |
| Tab B (non-host) | No Start button (or disabled with reason) |
| Tab A with 2+ players clicks Start | Success |

### 5. Auto-navigation

1. After host starts with 2 players, both tabs land on **Game** within ~3 s automatically.

### 6. Post-start join blocked

1. Tab C → join same code → "Game already in progress".

### 7. Room isolation

1. Create second room in Tab C/D with different code.
2. Join/actions in room 1 do not change room 2 participant list.

### 8. Manual refresh fallback

1. In lobby, click **Refresh Room** — list updates; polling continues.

## Build verification

```bash
cd backend && npm run build
cd frontend && npm run build
```

Both MUST exit 0 before marking Scenario 1 complete.
