# Plan: Gameplay Interaction (Scenario 3)

**Branch**: `003-gameplay-interaction`  
**Spec**: [specs/003-gameplay-interaction/spec.md](../specs/003-gameplay-interaction/spec.md)  
**Full plan**: [specs/003-gameplay-interaction/plan.md](../specs/003-gameplay-interaction/plan.md)

## Summary

Scenario 3 adds drawer canvas (stroke sync via poll), clear canvas, guess submission with
validation, shared guess history, and deterministic scoring (+100 first correct, +0 incorrect).

## Key artifacts

- [research.md](../specs/003-gameplay-interaction/research.md)
- [data-model.md](../specs/003-gameplay-interaction/data-model.md)
- [contracts/rooms-api.md](../specs/003-gameplay-interaction/contracts/rooms-api.md)
- [quickstart.md](../specs/003-gameplay-interaction/quickstart.md)

## New API endpoints

- `POST /rooms/:code/strokes` — drawer append stroke
- `POST /rooms/:code/canvas/clear` — drawer clear canvas
- `POST /rooms/:code/guesses` — guesser submit guess

## Next step

Run `/speckit-tasks` to generate implementation tasks.
