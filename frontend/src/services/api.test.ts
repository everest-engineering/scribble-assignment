import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

function makeMockResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body)
  } as unknown as Response;
}

const validRoom = {
  code: "ABCD",
  status: "lobby",
  hostId: "host-id",
  participants: [],
  availableWords: [],
  roles: [],
  drawerId: null,
  currentWord: null,
  canvasDataUrl: null,
  guesses: [],
  scores: {},
  roundEndsAt: null,
  hasGuessedCorrectly: false,
  resultExpiresAt: null
};

describe("api service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("createRoom sends POST to /rooms with playerName in body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      makeMockResponse({ participantId: "p1", room: validRoom })
    );

    await api.createRoom("Alice");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ playerName: "Alice" })
      })
    );
  });

  // T011: createRoom Zod parse — missing hostId throws
  it("createRoom throws a Zod error when response is missing hostId", async () => {
    const malformedRoom = { code: "ABCD", status: "lobby", participants: [] };
    vi.mocked(fetch).mockResolvedValue(
      makeMockResponse({ participantId: "p1", room: malformedRoom })
    );

    await expect(api.createRoom("Alice")).rejects.toThrow();
  });

  it("fetchRoom sends GET to /rooms/:code with participantId query param", async () => {
    vi.mocked(fetch).mockResolvedValue(
      makeMockResponse({ room: validRoom })
    );

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  // T020: joinRoom Zod parse — missing hostId throws; 409 rejects with "Room is full"
  it("joinRoom throws a Zod error when response is missing hostId", async () => {
    const malformedRoom = { code: "ABCD", status: "lobby", participants: [] };
    vi.mocked(fetch).mockResolvedValue(
      makeMockResponse({ participantId: "p1", room: malformedRoom })
    );

    await expect(api.joinRoom("ABCD", "Bob")).rejects.toThrow();
  });

  it("joinRoom rejects with 'Room is full' message on 409 response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      makeMockResponse({ message: "Room is full" }, 409)
    );

    await expect(api.joinRoom("ABCD", "Bob")).rejects.toThrow("Room is full");
  });

  // T029: startGame sends POST to /rooms/:code/start and parses response
  it("startGame sends POST to /rooms/:code/start with participantId", async () => {
    vi.mocked(fetch).mockResolvedValue(
      makeMockResponse({ room: validRoom })
    );

    await api.startGame("ABCD", "host-id");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/start"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "host-id" })
      })
    );
  });

  it("startGame throws a Zod error when response is missing hostId", async () => {
    const malformedRoom = { code: "ABCD", status: "lobby", participants: [] };
    vi.mocked(fetch).mockResolvedValue(
      makeMockResponse({ room: malformedRoom })
    );

    await expect(api.startGame("ABCD", "host-id")).rejects.toThrow();
  });

  // T023: restartGame sends POST to /rooms/:code/restart and parses roomResponseSchema
  it("restartGame sends POST to /rooms/:code/restart with participantId", async () => {
    vi.mocked(fetch).mockResolvedValue(
      makeMockResponse({ room: validRoom })
    );

    await api.restartGame("ABCD", "host-id");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/restart"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "host-id" })
      })
    );
  });

  it("restartGame throws when response fails Zod validation", async () => {
    vi.mocked(fetch).mockResolvedValue(
      makeMockResponse({ room: { code: "ABCD" } })
    );

    await expect(api.restartGame("ABCD", "host-id")).rejects.toThrow();
  });
});
