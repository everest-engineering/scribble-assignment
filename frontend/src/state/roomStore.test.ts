import { describe, it, expect } from "vitest";
import { RoomStore } from "./roomStore";

describe("RoomStore.setRoomSnapshot", () => {
  it("preserves existing participants when server snapshot has none", () => {
    const store = new RoomStore();

    const initial = {
      code: "ROOM1",
      status: "lobby",
      participants: [{ id: "p1", name: "Alice", joinedAt: "t1" }],
      availableWords: [],
      roles: []
    } as any;

    store.setRoomSnapshot(initial);

    const server = {
      code: "ROOM1",
      status: "lobby",
      participants: [],
      availableWords: [],
      roles: []
    } as any;

    store.setRoomSnapshot(server);

    const snap = store.getSnapshot().room;
    expect(snap).not.toBeNull();
    expect(snap!.participants).toHaveLength(1);
    expect(snap!.participants[0].id).toBe("p1");
  });

  it("uses server participants when provided", () => {
    const store = new RoomStore();

    const initial = {
      code: "ROOM2",
      status: "lobby",
      participants: [{ id: "p1", name: "Alice", joinedAt: "t1" }],
      availableWords: [],
      roles: []
    } as any;

    store.setRoomSnapshot(initial);

    const server = {
      code: "ROOM2",
      status: "lobby",
      participants: [{ id: "p2", name: "Bob", joinedAt: "t2" }],
      availableWords: [],
      roles: []
    } as any;

    store.setRoomSnapshot(server);

    const snap = store.getSnapshot().room;
    expect(snap).not.toBeNull();
    expect(snap!.participants).toHaveLength(1);
    expect(snap!.participants[0].id).toBe("p2");
  });
});
