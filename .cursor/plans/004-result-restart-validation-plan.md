# Plan: Result, Restart & Final Validation (Scenario 4)

**Branch**: `004-result-restart-validation`  
**Spec**: [specs/004-result-restart-validation/spec.md](../specs/004-result-restart-validation/spec.md)  
**Full plan**: [specs/004-result-restart-validation/plan.md](../specs/004-result-restart-validation/plan.md)

## Summary

Scenario 4 adds host-only end-round (`playing` → `result`) and restart (`result` → `lobby`)
transitions. Result mode reveals the secret word to all players on the same `/game` screen
(word, scores, history — no canvas). Restart preserves players and clears all round state.

## Key artifacts

- [research.md](../specs/004-result-restart-validation/research.md)
- [data-model.md](../specs/004-result-restart-validation/data-model.md)
- [contracts/rooms-api.md](../specs/004-result-restart-validation/contracts/rooms-api.md)
- [quickstart.md](../specs/004-result-restart-validation/quickstart.md)

## New API endpoints

- `POST /rooms/:code/end` — host end round → result state
- `POST /rooms/:code/restart` — host restart → lobby with cleared round state

## Next step

Run `/speckit-tasks` to generate implementation tasks.
