# Feature Group 1: Room Setup & Lobby

## Scenario

Given a player wants to host or join a drawing game, when they create or join a room via a unique code, then the creator automatically becomes host, invalid or empty room codes are rejected with clear feedback, rooms remain isolated, the lobby refreshes every 2 seconds via HTTP polling, only the host can start the game, and the game requires at least 2 players.

## User Stories

1. As a player, I want to create a room so that I can host a new Scribble game.
2. As a host, I want my created room to identify me as host so that start-game permissions are clear.
3. As a joining player, I want to enter a room code so that I can join my friend's lobby.
4. As a joining player, I want invalid or empty room codes to show clear feedback so that I can correct my input.
5. As a lobby participant, I want the player list to refresh automatically so that I can see new players without manually refreshing.
6. As a non-host participant, I want start-game controls to be unavailable so that only the host can begin the game.
7. As a host, I want the start-game action to require at least 2 players so that a game cannot begin without a guesser.
8. As a participant in one room, I want my lobby to remain separate from other rooms so that players and game state do not leak between room codes.

## Functional Requirements

1. Room creation must generate a unique room code.
2. Room creation must create the first participant and mark that participant as the host.
3. Room snapshots must expose enough host information for the frontend to determine whether the current participant is the host.
4. Joining a room must require a non-empty room code after trimming whitespace.
5. Joining a room with an unknown or invalid code must fail with a clear error message.
6. Joining a room must add the participant only to the matching room.
7. Room codes must be normalized consistently so lowercase input can still match an existing uppercase room code.
8. The lobby must fetch the current room snapshot approximately every 2 seconds while the participant remains on the lobby page.
9. Lobby polling must stop when the participant leaves the lobby page.
10. The lobby must display the latest participant list from the most recent room snapshot.
11. Only the host may attempt to start the game.
12. Non-host participants must not be able to start the game through the UI.
13. The backend must reject start-game attempts from non-host participants.
14. The backend must reject start-game attempts when fewer than 2 participants are in the room.
15. A successful start-game action must transition the shared room out of lobby state for all participants on their next poll.
16. All synchronization must use HTTP requests and polling only; no WebSockets, Socket.io, server-sent events, or push protocols are allowed.
17. Room state must remain in memory only.

## Acceptance Criteria

1. Given a player creates a room, when the create-room request succeeds, then the response includes the room code, participant id, participant list, and host identity.
2. Given a player creates a room, when the lobby renders, then the creator is shown as host or otherwise recognized as the only participant allowed to start the game.
3. Given a second player enters the created room code, when the join request succeeds, then the second player appears in that room's participant list.
4. Given a player enters an empty or whitespace-only room code, when they submit the join form, then the join does not proceed and a clear error message is displayed.
5. Given a player enters a code that does not match an active room, when they submit the join form, then the backend rejects it and the frontend displays a clear error message.
6. Given two separate rooms exist, when a participant joins one room, then the other room's participant list is unchanged.
7. Given one player is waiting in a lobby, when another player joins from another tab, then the first player sees the new participant within approximately 2 seconds without clicking refresh.
8. Given a participant leaves the lobby page, when time passes, then that page no longer continues lobby polling.
9. Given a non-host participant is in the lobby, when they view the lobby, then they cannot successfully start the game.
10. Given a non-host participant tries to call the start-game API directly, when the request reaches the backend, then it is rejected.
11. Given the host is alone in the lobby, when the host tries to start the game, then the start is rejected with a clear minimum-player message.
12. Given the host and at least one other participant are in the lobby, when the host starts the game, then the room transitions to game state and other participants observe that transition through polling.

## Edge Cases

1. Room code contains leading or trailing spaces.
2. Room code is lowercase but otherwise valid.
3. Room code is empty, whitespace-only, too short, too long, or contains unsupported characters.
4. Room code belongs to no active room.
5. Two rooms are created close together and must still receive distinct room codes.
6. A participant joins one room while another lobby is polling a different room.
7. The host attempts to start the game with only one participant.
8. A non-host attempts to start the game through a stale UI or direct API call.
9. A lobby poll fails because the backend is unavailable or the room no longer exists.
10. The user navigates away from the lobby while a poll request is in flight.
11. Multiple browser tabs poll the same room at the same time.
12. A participant refreshes the browser and loses local participant session state.
