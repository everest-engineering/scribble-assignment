# Feature Tasks: Result State & Restart

## Tasks
- [ ] Add `endRound()` and `restartRoom()` backend logic. (depends on backend status transitions)
- [ ] Add `POST /rooms/:code/end` and `POST /rooms/:code/restart` routes. (depends on backend logic)
- [ ] Add end/restart request validation schemas. (depends on new routes)
- [ ] Add frontend API methods for end and restart actions. (depends on backend routes)
- [ ] Add host-only result UI in `GamePage.tsx`. (depends on room status and API actions)
- [ ] Add restart redirect handling after lobby reset. (depends on results and lobby polling)
- [ ] Add tests for result word visibility and host-only restart. (depends on implementation)
- [ ] Manually verify result state and restart flow across two tabs. (depends on tests)
