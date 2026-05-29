# Quickstart: Game Start and Drawer Flow

## Scope

Validate Feature Group 2: trimmed player names, first-round start, drawer assignment, deterministic word selection, drawer-only secret word visibility, guesser-safe state, and lobby-to-playing transition.

## Implementation Steps

1. Extend backend room and snapshot models with current round and viewer-role fields.
2. Update room start behavior to create first-round state during the lobby-to-playing transition.
3. Add deterministic drawer assignment: host when valid, otherwise earliest joined player.
4. Add deterministic starter-word selection and persist the selected word on the round.
5. Update snapshot generation so only drawer viewers receive `secretWord`.
6. Update room API route tests for drawer and guesser snapshots.
7. Extend frontend API and room state types for current round and viewer role.
8. Update `GamePage` to show drawer identity to all players and the secret word only to the drawer.
9. Add focused tests and run build validation.

## Validation Commands

From `backend/`:

```sh
npm run test
npm run build
```

From `frontend/`:

```sh
npm run test
npm run build
```

## Manual Two-Tab Check

1. Start backend and frontend dev servers.
2. In tab A, create a room as Alice.
3. In tab B, join the room as Bob.
4. In tab A, start the game.
5. Confirm both tabs show the room as playing and identify Alice as drawer.
6. Confirm Alice sees the secret word.
7. Confirm Bob does not see the secret word in the UI.
8. Refresh both tabs and confirm the same drawer and word visibility rules remain.
9. Try joining the room after start and confirm the join is rejected.

## Review Checklist

- No WebSockets, server-sent events, long polling, databases, authentication, sessions, or unrelated dependencies were introduced.
- Empty and whitespace-only player names are rejected with clear feedback.
- The selected drawer is always a current participant.
- The selected word is deterministic and stable for the round.
- Guesser API responses and frontend state omit `secretWord` entirely.
- Public round fields match for all players in the same room.

## Validation Findings

- Backend validation passed with `npm run test` and `npm run build`.
- Frontend validation passed with `npm run test` and `npm run build`.
- Automated service and API tests confirm drawer snapshots include `secretWord`, while guesser and unknown-viewer snapshots omit the property.
- Manual two-tab browser validation is still pending.
