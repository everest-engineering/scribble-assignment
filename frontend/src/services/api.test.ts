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
            participants: [],
            hostParticipantId: "p1",
            isHost: true,
            canStart: false,
            isDrawer: false,
            availableWords: [],
            roles: []
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
            participants: [],
            hostParticipantId: "p1",
            isHost: true,
            canStart: false,
            isDrawer: false,
            availableWords: [],
            roles: []
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

  it("joinRoom sends normalized code path and playerName body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p2",
          room: {
            code: "ABCD",
            status: "lobby",
            participants: [],
            hostParticipantId: "p1",
            isHost: false,
            canStart: false,
            isDrawer: false,
            availableWords: [],
            roles: []
          },
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

  it("startRoom sends POST to /rooms/:code/start with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            participants: [],
            hostParticipantId: "p1",
            isHost: true,
            canStart: false,
            currentRound: {
              roundNumber: 1,
              drawerParticipantId: "p1",
              drawerName: "Alice"
            },
            viewerRole: "drawer",
            isDrawer: true,
            secretWord: "rocket",
            availableWords: [],
            roles: []
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.startRoom("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/start"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });

  it("throws clear API error messages for rejected requests", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ message: "Unable to join room" }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(api.joinRoom("ZZZZ", "Bob")).rejects.toThrow("Unable to join room");
  });

  it("accepts drawer snapshots with secretWord", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            participants: [],
            hostParticipantId: "p1",
            viewerParticipantId: "p1",
            isHost: true,
            canStart: false,
            currentRound: {
              roundNumber: 1,
              drawerParticipantId: "p1",
              drawerName: "Alice"
            },
            viewerRole: "drawer",
            isDrawer: true,
            secretWord: "rocket",
            availableWords: [],
            roles: []
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const response = await api.fetchRoom("ABCD", "p1");

    expect(response.room.isDrawer).toBe(true);
    expect(response.room.secretWord).toBe("rocket");
  });

  it("accepts guesser snapshots without secretWord", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            participants: [],
            hostParticipantId: "p1",
            viewerParticipantId: "p2",
            isHost: false,
            canStart: false,
            currentRound: {
              roundNumber: 1,
              drawerParticipantId: "p1",
              drawerName: "Alice"
            },
            viewerRole: "guesser",
            isDrawer: false,
            availableWords: [],
            roles: []
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const response = await api.fetchRoom("ABCD", "p2");

    expect(response.room.isDrawer).toBe(false);
    expect("secretWord" in response.room).toBe(false);
  });
});
