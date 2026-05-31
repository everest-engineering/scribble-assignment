# Quickstart: Result, Restart & Final Validation

**Feature**: `004-result-restart` | **Branch**: `004-result-state-host`

## Prerequisites

1. Scenarios 1–3 implemented and working.
2. Backend `http://localhost:3001`, frontend `http://localhost:5173`.
3. Two browser tabs.

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

## Full loop checklist (SC-007)

### §1 Setup and start round

1. Tab A: Create room as **Alice** (host).
2. Tab B: Join as **Bob**.
3. Host starts game; both reach `/game`.

### §2 End round (US1)

1. Tab B submits wrong guess → stays on game, room still `playing`.
2. Tab B submits **correct** guess (match secret word, any casing).
3. Tab B navigates to `/result` immediately.
4. Tab A reaches `/result` within ~5 s (poll).
5. Tab A tries to draw → no effect / rejected if attempted via API.

### §3 Shared result (US2)

On both tabs at `/result`:

1. Same **secret word** visible (including former guesser).
2. Same **final scores** (Bob +100 if one correct guess).
3. Same **guess history** (all guesses from the round).

### §4 Host restart (US3)

1. Tab A (host): click **Restart** / return to lobby.
2. Tab B reaches `/lobby` within ~5 s without manual refresh.
3. Both see Alice and Bob still in participant list; same room code.
4. Host starts new round → scores 0, empty history, empty canvas.

### §5 Scenario 1–3 regression

- Lobby polling still works.
- Name/code validation unchanged.
- Drawer-only word during `playing` (not during `result`).
- Guesser cannot guess on result screen.

## Automated checks

```bash
cd backend && npm test
cd backend && npm run build
cd frontend && npm run build
```

## Troubleshooting

- **Stuck on `/game` after correct guess**: Check poll interval and `room.status` in GET response.
- **403 on restart**: Must be host; room must be `result`.
- **Word hidden on result**: Snapshot must include `secretWord` for all viewers when `status === "result"`.
