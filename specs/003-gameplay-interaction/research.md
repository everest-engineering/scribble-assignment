# Research & Decisions

## Decision 1: Sync Mechanism for Canvas
- **Decision**: Use batched HTTP polling (e.g., 500ms intervals during continuous drawing).
- **Rationale**: The project constitution strictly forbids WebSockets. To achieve the "near real-time" requirement for guessers, points must be batched and sent via HTTP POST from the drawer, and fetched via GET by guessers.
- **Alternatives considered**: Sending every pixel (network overload), waiting for `mouseup` (too slow/choppy for long strokes), WebSockets (forbidden).

## Decision 2: Stroke Data Structure
- **Decision**: Represent a stroke as an object containing color, thickness, and an array of `{x, y}` coordinate points.
- **Rationale**: Easy to serialize to JSON, standard representation for Canvas API `lineTo` operations.
- **Alternatives considered**: SVG paths (more complex to generate dynamically on the fly).

## Decision 3: Guess Rate Limiting
- **Decision**: In-memory timestamp tracking per user for the last guess submitted.
- **Rationale**: Satisfies the 1 guess/second requirement efficiently without external dependencies (no Redis).
- **Alternatives considered**: Token bucket algorithm (overkill for this scale).
