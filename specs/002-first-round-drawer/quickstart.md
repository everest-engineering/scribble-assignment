# Quickstart: Verify 002 First Round Drawer and Secret Word

## Prerequisites

- Feature `001-host-join-rooms` implemented (create, join, host start).
- Backend and frontend dev servers running.

## Manual checklist (two browsers)

1. **Names**: Host ` Alice ` (spaces) and guest `Bob` in lobby; start game — names display trimmed.
2. **Drawer**: After start, both see host labeled as drawer / drawing; guest labeled as guesser.
3. **Word (drawer)**: Host browser shows secret word from starter list (e.g., rocket, pizza, …).
4. **Word (guesser)**: Guest browser shows no secret word anywhere.
5. **Determinism**: Restart lobby cycle with same room code and players; round-one word is identical across starts.
6. **Invalid name**: Add participant with whitespace-only name (if possible via API test) — start blocked with message.

## Automated tests

```bash
cd backend && npm test
```

Target: `wordSelection.test.ts`, `roomStore` start/drawer/word visibility tests.

## Key files

| Area | Path |
|------|------|
| Word pick | `backend/src/services/wordSelection.ts` |
| Start logic | `backend/src/services/roomStore.ts` |
| Game UI | `frontend/src/pages/GamePage.tsx` |
