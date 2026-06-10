import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoomStore } from "./roomStore";

function makeMockRoom(overrides: Record<string, unknown> = {}) {
  return {
    code: "ABCD",
    status: "lobby" as const,
    participants: [] as Array<{ id: string; name: string; joinedAt: string }>,
    availableWords: [] as string[],
    roles: [] as Array<"drawer" | "guesser">,
    hostParticipantId: "",
    canvasState: { strokes: [] },
    ...overrides,
  };
}

describe("RoomStore session persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists the current room session and restores it after refresh", async () => {
    const session = {
      participantId: "p1",
      room: makeMockRoom({
        participants: [
          { id: "p1", name: "Host", joinedAt: new Date().toISOString() },
        ],
        hostParticipantId: "p1",
        viewerIsHost: true,
      }),
    };

    const store = new RoomStore();
    store.setRoomSession(session);

    expect(localStorage.getItem("scribble:lastRoomCode")).toBe("ABCD");
    expect(localStorage.getItem("scribble:participant:ABCD")).toBe("p1");

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ room: session.room }),
    } as unknown as Response);

    const refreshedStore = new RoomStore();
    const restored = await refreshedStore.restoreRoomSession();

    expect(restored?.room.code).toBe("ABCD");
    expect(restored?.room.participants[0].name).toBe("Host");
    expect(refreshedStore.getSnapshot().participantId).toBe("p1");
  });
});
