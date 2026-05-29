# Scenario 4 Checklist: Result State & Restart

- [ ] Host-only round end operation is implemented.
- [ ] Room status transitions from `game` to `results`.
- [ ] Correct word is visible to all participants in result state.
- [ ] Result screen shows final scores and full guess history.
- [ ] Host-only restart operation exists and is protected.
- [ ] Restart preserves participants and host identity.
- [ ] Restart clears drawer assignment, secret word, drawing, guesses, and active-round scores.
- [ ] Polling clients redirect to `/lobby` after restart.
