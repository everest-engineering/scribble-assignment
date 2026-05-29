import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("api service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("createRoom sends POST to /rooms with playerName in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p1",
          room: {
            code: "ABCD",
            status: "lobby",
            hostParticipantId: "p1",
            participants: [],
            viewerIsHost: true,
            canStartGame: false,
            minimumPlayersToStart: 2,
            viewerIsDrawer: false
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.createRoom("Alice");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ playerName: "Alice" }),
      })
    );
  });

  it("fetchRoom sends GET to /rooms/:code with participantId query param", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "XYZW",
            status: "lobby",
            hostParticipantId: "p1",
            participants: [],
            viewerIsHost: true,
            canStartGame: false,
            minimumPlayersToStart: 2,
            viewerIsDrawer: false
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("joinRoom sends POST to /rooms/:code/join with playerName in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p2",
          room: {
            code: "ABCD",
            status: "lobby",
            hostParticipantId: "p1",
            participants: [],
            viewerIsHost: false,
            canStartGame: false,
            minimumPlayersToStart: 2,
            viewerIsDrawer: false
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.joinRoom("ABCD", "Bob");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/join"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ playerName: "Bob" }),
      })
    );
  });

  it("startGame sends POST to /rooms/:code/start with participantId in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            hostParticipantId: "p1",
            participants: [],
            viewerIsHost: true,
            canStartGame: false,
            minimumPlayersToStart: 2,
            drawerParticipantId: "p1",
            viewerIsDrawer: true,
            wordVisibility: "visible",
            secretWord: "rocket"
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.startGame("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/start"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });

  it("fetchRoom supports polling a viewer-specific playing room snapshot", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            hostParticipantId: "p1",
            participants: [],
            viewerIsHost: false,
            canStartGame: false,
            minimumPlayersToStart: 2,
            drawerParticipantId: "p1",
            viewerIsDrawer: false,
            wordVisibility: "hidden"
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const response = await api.fetchRoom("ABCD", "p2");

    expect(response.room.status).toBe("playing");
    expect(response.room.viewerIsDrawer).toBe(false);
    expect(response.room.secretWord).toBeUndefined();
  });
});
