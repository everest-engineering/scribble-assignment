import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../services/api";

vi.mock("../services/api", async () => {
  const actual = await vi.importActual<typeof import("../services/api")>("../services/api");
  return {
    ...actual,
    api: {
      createRoom: vi.fn(),
      joinRoom: vi.fn(),
      fetchRoom: vi.fn(),
      startRoom: vi.fn()
    }
  };
});

import { api } from "../services/api";
import { RoomStore } from "./roomStore";

const mockedFetchRoom = vi.mocked(api.fetchRoom);

beforeEach(() => {
  window.sessionStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  window.sessionStorage.clear();
});

describe("RoomStore rehydration", () => {
  it("rehydrates participantId and a shell room from sessionStorage on construction", () => {
    window.sessionStorage.setItem("scribble.participantId", "p1");
    window.sessionStorage.setItem("scribble.roomCode", "ABCD");

    const store = new RoomStore();
    const state = store.getSnapshot();

    expect(state.participantId).toBe("p1");
    expect(state.room?.code).toBe("ABCD");
    expect(state.room?.participants).toEqual([]);
  });

  it("starts empty when sessionStorage is empty", () => {
    const store = new RoomStore();
    const state = store.getSnapshot();
    expect(state.participantId).toBeNull();
    expect(state.room).toBeNull();
  });
});

describe("RoomStore.fetchRoom", () => {
  it("clears the session and marks the room missing on 404 without throwing", async () => {
    window.sessionStorage.setItem("scribble.participantId", "p1");
    window.sessionStorage.setItem("scribble.roomCode", "ABCD");
    const store = new RoomStore();

    mockedFetchRoom.mockRejectedValueOnce(new ApiError(404, "Room not found"));

    await expect(store.fetchRoom()).resolves.toBeNull();
    const state = store.getSnapshot();
    expect(state.room).toBeNull();
    expect(state.participantId).toBeNull();
    expect(state.roomMissing).toBe(true);
    expect(window.sessionStorage.getItem("scribble.participantId")).toBeNull();
    expect(window.sessionStorage.getItem("scribble.roomCode")).toBeNull();
  });

  it("preserves the last known room on transient errors", async () => {
    window.sessionStorage.setItem("scribble.participantId", "p1");
    window.sessionStorage.setItem("scribble.roomCode", "ABCD");
    const store = new RoomStore();

    mockedFetchRoom.mockRejectedValueOnce(new Error("network down"));

    await expect(store.fetchRoom()).resolves.toBeNull();
    const state = store.getSnapshot();
    expect(state.room?.code).toBe("ABCD");
    expect(state.error).toBe("network down");
    expect(state.roomMissing).toBe(false);
  });
});
