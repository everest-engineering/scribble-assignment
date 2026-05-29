# Research: Game Start and Drawer Flow

## Decision: Store Current Round on the In-Memory Room

**Rationale**: The existing room store is the backend source of truth and already owns lobby-to-playing transitions. Adding a `currentRound` object to the room keeps first-round drawer and word state isolated by room without introducing persistence or a second state container.

**Alternatives considered**: A separate round registry was rejected because it adds coordination complexity without cross-room benefits. Persistent storage was rejected by assignment constraints.

## Decision: Host Drawer with First-Player Fallback

**Rationale**: The spec says the host, or first player, becomes the drawer. The deterministic rule is: use the host if the host ID references a current participant; otherwise use the earliest joined participant. This keeps behavior predictable when host metadata is stale.

**Alternatives considered**: Random drawer selection was rejected because it conflicts with the requested host/first-player rule. Blocking start on stale host metadata was rejected because the spec defines a fallback.

## Decision: Deterministic Word Selection from Room Code

**Rationale**: The starter word list is ordered and room codes are stable. A simple stable checksum of the room code modulo the word count selects the same first word for the same room setup while distributing choices across rooms.

**Alternatives considered**: Always choosing the first word was rejected because it is deterministic but poor gameplay. Random choice was rejected because repeated starts from the same setup would not be verifiable.

## Decision: Viewer-Specific Snapshot as Privacy Boundary

**Rationale**: The backend already creates room snapshots using `viewerParticipantId`. Extending that function to include `secretWord` only for the drawer centralizes the privacy rule and prevents frontend-only hiding from leaking the answer.

**Alternatives considered**: Returning the word to all players and hiding it in the UI was rejected because guessers could inspect API responses or client state. Masking the word for guessers was rejected because the requirement says it must be omitted entirely.

## Decision: Keep Start Endpoint as Round Creation Trigger

**Rationale**: `POST /rooms/:code/start` already validates host and minimum player count. Adding first-round creation there ensures the room transitions once and returns a complete playing snapshot immediately after the valid start.

**Alternatives considered**: Creating the round lazily on first game-screen fetch was rejected because players could see inconsistent intermediate state.

## Decision: Game Screen Renders from Snapshot Only

**Rationale**: The frontend should not recompute drawer or secret-word visibility. `GamePage` can display public drawer identity and use `isDrawer` plus optional `secretWord` from the snapshot to render drawer versus guesser views.

**Alternatives considered**: Duplicating assignment and visibility logic in frontend state was rejected because it risks divergence from backend enforcement.
