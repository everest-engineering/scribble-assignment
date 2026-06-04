import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { api } from "../services/api";
import { RoomStore } from "./roomStore";

vi.mock("../services/api", () => ({
  api: {
    fetchRoom: vi.fn()
  }
}));

describe("RoomStore Polling", () => {
  let store: any;

  beforeEach(() => {
    store = new (RoomStore as any)();
    vi.useFakeTimers();
  });

  afterEach(() => {
    store.stopPolling();
    vi.restoreAllMocks();
  });

  it("startPolling sets up interval and calls fetchRoom", async () => {
    const mockRoom = { code: "ABCD", status: "lobby", participants: [] };
    store.setRoomSnapshot(mockRoom);
    
    // @ts-ignore
    api.fetchRoom.mockResolvedValue({ room: mockRoom });

    store.startPolling();
    
    await vi.advanceTimersByTimeAsync(2000);
    expect(api.fetchRoom).toHaveBeenCalledWith("ABCD", undefined);
    
    await vi.advanceTimersByTimeAsync(2000);
    expect(api.fetchRoom).toHaveBeenCalledTimes(2);
  });

  it("stopPolling clears interval", async () => {
    const mockRoom = { code: "ABCD", status: "lobby", participants: [] };
    store.setRoomSnapshot(mockRoom);
    // @ts-ignore
    api.fetchRoom.mockResolvedValue({ room: mockRoom });

    store.startPolling();
    store.stopPolling();

    await vi.advanceTimersByTimeAsync(4000);
    expect(api.fetchRoom).not.toHaveBeenCalled();
  });

  it("fetchRoom prevents overlapping requests", async () => {
    const mockRoom = { code: "ABCD", status: "lobby", participants: [] };
    store.setRoomSnapshot(mockRoom);
    
    let resolveFetch: any;
    const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
    // @ts-ignore
    api.fetchRoom.mockReturnValue(fetchPromise);

    // First call
    store.fetchRoom();
    // Second call while first is pending
    store.fetchRoom();

    expect(api.fetchRoom).toHaveBeenCalledTimes(1);

    resolveFetch({ room: mockRoom });
    await fetchPromise;

    // Third call should now go through
    store.fetchRoom();
    expect(api.fetchRoom).toHaveBeenCalledTimes(2);
  });
});
