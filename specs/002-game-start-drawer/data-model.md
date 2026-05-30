# Data Model: Scenario 2 Game Start & Drawer Flow

## Room

**Purpose**: Represents one isolated multiplayer room that can move from lobby
state into an active round.

**Fields**:

- `code`: unique 4-character room identifier
- `status`: `"lobby" | "playing"`
- `hostParticipantId`: participant ID for the room host
- `participants`: ordered room members with trimmed accepted names
- `round`: current round state, present when the room is actively playing
- `createdAt`: room creation timestamp
- `updatedAt`: last room mutation timestamp

**Validation Rules**:

- `hostParticipantId` must reference an existing participant while host state is
  healthy
- `participants` may not contain whitespace-only accepted names
- `round` is initialized only when the room transitions out of lobby

## Participant

**Purpose**: Represents a room member visible in lobby and game views.

**Fields**:

- `id`: unique participant identifier
- `name`: accepted trimmed display name
- `joinedAt`: timestamp when the participant entered the room

**Validation Rules**:

- incoming names are trimmed before storage
- whitespace-only names are rejected before participant creation

## Round State

**Purpose**: Represents the deterministic game-start state created for Scenario 2.

**Fields**:

- `drawerParticipantId`: participant assigned as drawer
- `secretWord`: selected deterministic word from the starter list
- `startedAt`: timestamp for when the round began

**Validation Rules**:

- `drawerParticipantId` must reference a participant in the room
- `secretWord` must come from the starter word list
- the same room state must produce the same drawer/word selection outcome

## Viewer Game Snapshot

**Purpose**: Represents the room snapshot returned to a specific participant
after the round begins.

**Fields**:

- shared room fields from Scenario 1
- `drawerParticipantId`: current round drawer
- `viewerIsDrawer`: whether the current participant is the drawer
- `secretWord`: actual word only when the viewer is the drawer
- `wordVisibility`: viewer-facing state such as `visible` or `hidden`

**Derived Rules**:

- `viewerIsDrawer = participantId === drawerParticipantId`
- `secretWord` is omitted or hidden for non-drawers
- all viewers share the same drawer and round identity, but not the same word
  visibility payload

## Player Name Input

**Purpose**: Represents player name submission for room creation and joining.

**Normalization Rules**:

- trim leading and trailing whitespace

**Validation Rules**:

- empty result after trim is rejected
- accepted names are stored in trimmed form and reused in lobby/game displays
