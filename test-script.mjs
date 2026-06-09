import { randomUUID } from "node:crypto";
import { createRoom, listWords } from "./backend/src/services/roomStore.js";
import { toRoomSnapshot } from "./backend/src/services/roomStore.js";

const result = createRoom("Alice");
console.log("Created room:", result.room.code, result.participantId);

const snapshot = toRoomSnapshot(result.room, result.participantId);
console.log("Snapshot for host:", snapshot.viewerIsHost, snapshot.hostParticipantId);
