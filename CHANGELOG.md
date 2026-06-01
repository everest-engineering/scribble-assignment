# Changelog

## 2026-06-01 - Round End Restart (specs/005-round-end-restart)

- Add API endpoints: `GET /rooms/:code/last-round-summary`, `POST /rooms/:code/restart`
- Persist player roster across host-triggered restarts while clearing transient round state
- Frontend: `ResultsPage` UI showing final scores and guess history; preserved players return to lobby
- Tests: Backend integration tests for restart, reconnect, and secrets clearance; Frontend component tests for `ResultsPage`
