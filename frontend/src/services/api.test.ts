import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("api service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  function mockOk(data: unknown) {
    return {
      ok: true,
      json: () => Promise.resolve(data),
    } as unknown as Response;
  }

  it("createRoom sends POST to /rooms with playerName in body", async () => {
    vi.mocked(fetch).mockResolvedValue(mockOk({
      participantId: "p1",
      room: { code: "ABCD", status: "lobby", participants: [] },
    }));

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
    vi.mocked(fetch).mockResolvedValue(mockOk({
      room: { code: "XYZW", status: "lobby", participants: [] },
    }));

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("startGame sends POST to /rooms/:code/start with participantId", async () => {
    vi.mocked(fetch).mockResolvedValue(mockOk({
      room: { code: "ABCD", status: "playing", participants: [] },
    }));

    await api.startGame("ABCD", "host-id");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/start"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "host-id" }),
      })
    );
  });

  it("submitGuess sends POST to /rooms/:code/guess with participantId and text", async () => {
    vi.mocked(fetch).mockResolvedValue(mockOk({
      room: { code: "ABCD", status: "playing", participants: [] },
    }));

    await api.submitGuess("ABCD", "p1", "castle");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/guess"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1", text: "castle" }),
      })
    );
  });

  it("updateCanvas sends POST to /rooms/:code/canvas with participantId and canvasData", async () => {
    vi.mocked(fetch).mockResolvedValue(mockOk({ ok: true }));

    await api.updateCanvas("ABCD", "p1", "data:image/png;base64,abc");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/canvas"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1", canvasData: "data:image/png;base64,abc" }),
      })
    );
  });

  it("endGame sends POST to /rooms/:code/end with participantId", async () => {
    vi.mocked(fetch).mockResolvedValue(mockOk({
      room: { code: "ABCD", status: "result", participants: [] },
    }));

    await api.endGame("ABCD", "host-id");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/end"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "host-id" }),
      })
    );
  });

  it("restartGame sends POST to /rooms/:code/restart with participantId", async () => {
    vi.mocked(fetch).mockResolvedValue(mockOk({
      room: { code: "ABCD", status: "lobby", participants: [] },
    }));

    await api.restartGame("ABCD", "host-id");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/restart"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "host-id" }),
      })
    );
  });
});
