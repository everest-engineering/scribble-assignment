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
            viewerParticipantId: "p1",
            isHost: true,
            canStart: false,
            availableWords: [],
            roles: []
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.createRoom("Alice");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ playerName: "Alice" })
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
            viewerParticipantId: "p1",
            isHost: true,
            canStart: false,
            availableWords: [],
            roles: []
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("joinRoom sends POST to /rooms/:code/join with playerName", async () => {
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
            viewerParticipantId: "p2",
            isHost: false,
            canStart: false,
            availableWords: [],
            roles: []
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.joinRoom("ABCD", "Bob");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/join"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ playerName: "Bob" })
      })
    );
  });

  it("throws error on non-ok join response", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ message: "Room not found" })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(api.joinRoom("ZZZZ", "Bob")).rejects.toThrow("Room not found");
  });

  it("startRoom sends POST to /rooms/:code/start with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "inGame",
            participants: [],
            hostParticipantId: "p1",
            viewerParticipantId: "p1",
            isHost: true,
            canStart: false,
            availableWords: [],
            roles: []
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.startRoom("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/start"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" })
      })
    );
  });

  it("throws error on non-ok start response", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ message: "Only the host can start the game" })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(api.startRoom("ABCD", "p2")).rejects.toThrow(
      "Only the host can start the game"
    );
  });
});
