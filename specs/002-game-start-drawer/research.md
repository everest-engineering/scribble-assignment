# Research: Game Start and Drawer Flow

## Current State Analysis

### Backend: Existing Patterns

- **startGame()**: Currently only transitions room status to `"active"`. No Round creation, no word selection, no drawer assignment.
- **toRoomSnapshot()**: Returns `availableWords` (full list) and `roles` arrays. Ignores `viewerParticipantId` — no viewer-scoped filtering.
- **STARTER_WORDS**: 5 words only (rocket, pizza, castle, guitar, sunflower).
- **Room model**: No `currentRound` field, no Round type.
- **Name validation**: Done at create/join via Zod schemas (FR-011). No re-validation at game start.

### Frontend: Existing Patterns

- **GamePage.tsx**: Skeleton component, renders placeholder text. No drawer/word logic.
- **api.ts**: `RoomSnapshot` type has `availableWords: string[]` and `roles: ParticipantRole[]`. No round/currentRound fields.
- **roomStore.ts**: `startGame()` calls API, updates snapshot with response. Polling on `/game` page continues to fetch room state.
- **Canvas.tsx**: Scaffolded component, does nothing yet.

### Identified Gaps

| Gap | Detail |
|-----|--------|
| No Round entity | Game start needs to create and persist a Round with drawer, word, status |
| No word selection | No function to deterministically pick a word from the list |
| Word list too small | Only 5 words — needs expansion to 20+ |
| No viewer-scoped filtering | Snapshot returns all words to all viewers; must filter secret word per role |
| No drawer assignment | Host is always drawer per spec, but no mechanism to record this |
| No name re-validation | Game start does not check participant names (should reject if any are invalid) |
| No drawer disconnect handling | No mechanism to abort game if drawer disconnects before drawing |
| Guesser game screen | GamePage shows same content for all; guessers need placeholder instead of word |

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Round entity location | New `Round` interface in `game.ts`, stored alongside Room (in-memory) | Keeps models co-located; no DB needed |
| Word selection algorithm | Sum of char codes of room code modulo word list length | Deterministic, pure function of room code, simple |
| Word list expansion | Add 15+ words to `STARTER_WORDS` array in `starterData.ts` | Follows existing pattern; no config file needed |
| Word visibility filtering | Filter `secretWord` in `toRoomSnapshot()` based on `viewerParticipantId === round.drawerId` | Single responsibility; minimal change surface |
| Drawer disconnect detection | Check in `getRoom()`/polling path — if drawer missing and no drawing started, revert status to lobby | Simple polling-based approach, no new infrastructure |
| Name re-validation at start | Iterate participants in `startGame()` and validate against Zod schema | Reuses existing `createRoomSchema` patterns |
| Round status enum | `"drawing"` only (single value for this scope) | Future: `"judging"`, `"complete"` added later |
| GamePage drawer display | Conditional render: `room.currentRound.drawerId === participantId` | Simple, no routing changes needed |
| Guesser placeholder | Show animated waiting indicator / meme image instead of word | Keeps guesser engaged; specified in clarification Q4 |

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| Separate Round storage (Map) | Over-engineered for single-round scope; Room field is simpler |
| Random word selection (Math.random) | Non-deterministic; violates FR-004 requirement |
| External word list file (JSON) | Adds file I/O complexity; const array is sufficient for <100 words |
| Word visibility via separate endpoint | Adds unnecessary API surface; filtering in snapshot is simpler and consistent with polling pattern |
| WebSocket for real-time drawer assignment | Constitution explicitly forbids WebSockets |
| Host role transfer on drawer disconnect | Spec clarified: game aborts, return to lobby (simple abort) |
