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
          room: { code: "ABCD", status: "lobby", participants: [] },
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
          room: { code: "XYZW", status: "lobby", participants: [] },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("startRoom response includes drawerId and currentWord when drawer views snapshot", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "active",
            participants: [{ id: "p1", name: "Alice", joinedAt: "2026-01-01T00:00:00.000Z" }],
            hostId: "p1",
            drawerId: "p1",
            availableWords: ["rocket", "pizza"],
            roles: ["drawer", "guesser"],
            currentWord: "rocket",
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await api.startRoom("ABCD", "p1");

    expect(result.room.drawerId).toBe("p1");
    expect(result.room.currentWord).toBe("rocket");
  });

  it("fetchRoom returns null currentWord for non-drawer viewers", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "active",
            participants: [{ id: "p2", name: "Bob", joinedAt: "2026-01-01T00:00:00.000Z" }],
            hostId: "p1",
            drawerId: "p1",
            availableWords: ["rocket", "pizza"],
            roles: ["drawer", "guesser"],
            currentWord: null,
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await api.fetchRoom("ABCD", "p2");

    expect(result.room.drawerId).toBe("p1");
    expect(result.room.currentWord).toBeNull();
  });
});
