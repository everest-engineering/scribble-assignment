import { createRoom, joinRoom, getRoom, startGame, submitGuess, leaveRoom, restartGame, toRoomSnapshot } from "./services/roomStore.js";

console.log("Starting reproduction...");

// 1. Host creates room
const hostResult = createRoom("Player 1");
const code = hostResult.room.code;
const p1Id = hostResult.participantId;
console.log(`Room created: ${code}, Host ID: ${p1Id}`);

// 2. Player 2 joins
const p2Result = joinRoom(code, "Player 2");
if (!p2Result) throw new Error("Player 2 failed to join");
const p2Id = p2Result.participantId;
console.log(`Player 2 joined: ${p2Id}`);

// 3. Player 3 joins
const p3Result = joinRoom(code, "Player 3");
if (!p3Result) throw new Error("Player 3 failed to join");
const p3Id = p3Result.participantId;
console.log(`Player 3 joined: ${p3Id}`);

// 4. Start game
let room = startGame(code, p1Id);
console.log(`Game started. Status: ${room.status}, Drawer: ${room.drawerId}, Word: ${room.secretWord}`);

// 5. Submit guess to finish game
room = submitGuess(code, p2Id, room.secretWord!);
console.log(`Guess submitted. Status: ${room.status}`);

// 6. Player 3 leaves
const leaveRes = leaveRoom(code, p3Id);
console.log("Player 3 left.", leaveRes ? "Room still exists" : "Room was deleted");

// 7. Host restarts game (returns to lobby)
room = restartGame(code, p1Id);
console.log(`Game restarted. Status: ${room.status}`);

// 8. Host starts next game
room = startGame(code, p1Id);
console.log(`Next game started. Status: ${room.status}, Drawer: ${room.drawerId}, Word: ${room.secretWord}`);

// 9. Now simulate Player 2 fetching the room
const p2Snapshot = toRoomSnapshot(getRoom(code)!, p2Id);
console.log("Player 2 room snapshot fetched successfully!", p2Snapshot.status);
console.log("All participants:", p2Snapshot.participants.map(p => p.name));
