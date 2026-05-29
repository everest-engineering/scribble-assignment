# Scenario 3 Checklist: Gameplay Interaction

- [ ] Drawing state is stored in the room model as serializable stroke/path data.
- [ ] Drawer-only drawing updates are enforced by backend checks.
- [ ] Clear canvas action is available only to the drawer.
- [ ] Guess submissions trim input and reject empty/whitespace-only values.
- [ ] Guess history is stored with participant identity, correctness, timestamp, and points.
- [ ] Correct guesses are scored 100 points, incorrect guesses 0 points.
- [ ] Repeated correct guesses do not award additional points.
- [ ] Polling syncs drawing, guess history, and scoreboard to all players.
