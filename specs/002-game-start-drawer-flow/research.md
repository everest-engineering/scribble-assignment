# Research: Game Start and Drawer Flow

## Decision: Deterministic first-round setup

- The host or first player is used as the first drawer.
- The first starter word is selected deterministically.
- Viewer-specific snapshots hide the word from guessers.

## Rationale

- Deterministic behavior makes tests simple and repeatable.
- Drawer-only visibility preserves the game rules.
- Keeping this as a single-round setup avoids out-of-scope drawer rotation.

## Alternatives Considered

- Random drawer or word: rejected because deterministic behavior is easier to validate.
- Drawer rotation: rejected because multiple rounds are out of scope.
- Showing word to all players: rejected because it breaks guessing.
