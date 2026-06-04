import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("api service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("createRoom sends POST to /rooms with playerName in body", async () => {
    const mockResponse = {
      ok: true,
      status: 201,
      json: () =>
        Promise.resolve({
          participantId: "p1",
          room: {
            code: "ABCD",
            status: "lobby",
            hostParticipantId: "p1",
            participants: []
          }
        })
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
      status: 200,
      json: () =>
        Promise.resolve({
          room: {
            code: "XYZW",
            status: "lobby",
            hostParticipantId: "p1",
            participants: []
          }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("startRoom sends POST to /rooms/:code/start with participantId in body", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          room: {
            code: "XYZW",
            status: "game",
            hostParticipantId: "p1",
            participants: []
          }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.startRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW/start"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" })
      })
    );
  });

  it("leaveRoom sends POST to /rooms/:code/leave with participantId in body", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true, deleted: true })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.leaveRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW/leave"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" })
      })
    );
  });
});
