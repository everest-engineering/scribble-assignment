import { RoomStore } from "./frontend/src/state/roomStore.js";
const store = new RoomStore();
console.log(store.getSnapshot());
