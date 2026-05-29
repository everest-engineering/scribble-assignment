# Scenario 1 Checklist: Room Setup & Lobby

- [ ] Host ID is tracked in backend room model and snapshots.
- [ ] Room creation assigns host automatically.
- [ ] Room code validation rejects empty and invalid codes.
- [ ] Lobby polling refreshes participant state every ~2 seconds.
- [ ] Start Game is host-only and disabled until >= 2 players are present.
- [ ] Non-hosts see a waiting message instead of an enabled start button.
- [ ] Frontend and backend tests verify room code validation and host-start restrictions.
