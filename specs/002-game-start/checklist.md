# Scenario 2 Checklist: Game Start & Drawer Flow

- [ ] `POST /rooms/:code/start` exists and requires host credentials.
- [ ] Room status transitions cleanly from `lobby` to `game`.
- [ ] Drawer ID is assigned to the host.
- [ ] Secret word is selected deterministically and stored in room state.
- [ ] Secret word is masked for non-drawers while status is `game`.
- [ ] UI shows drawer versus guesser state on the game screen.
- [ ] Tests verify host-only start and drawer-only secret word visibility.
