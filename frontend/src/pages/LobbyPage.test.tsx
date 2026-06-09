import { act, cleanup, render, screen } from "@testing-library/react";
import { vi, describe, it, beforeEach, afterEach, expect } from "vitest";
import React from "react";
import { RoomStoreProvider, useRoomStore } from "../state/roomStore";
import { MemoryRouter } from "react-router-dom";
import { LobbyPage } from "./LobbyPage";
import { api } from "../services/api";

function TestInit({ session }: { session: any }) {
  const store = useRoomStore();

  React.useEffect(() => {
    store.setRoomSession(session);
  }, [store, session]);

  return null;
}

describe("LobbyPage polling", () => {
  beforeEach(() => {
    // stub setInterval to invoke the callback immediately so polling runs synchronously
    vi.stubGlobal("setInterval", (fn: any) => {
      fn();
      return 123 as any;
    });
    vi.stubGlobal("clearInterval", vi.fn());
    // stub API
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  it("polls every 2s and updates participant list", async () => {
    const roomCode = "TEST";

    // first snapshot: single participant (host)
    const firstSnapshot = {
      room: {
        code: roomCode,
        status: "lobby",
        participants: [
          { id: "p1", name: "Host", joinedAt: new Date().toISOString() },
        ],
        availableWords: [],
        roles: [],
        hostParticipantId: "p1",
        viewerIsHost: true,
      },
    };

    // second snapshot: two participants
    const secondSnapshot = {
      room: {
        code: roomCode,
        status: "lobby",
        participants: [
          { id: "p1", name: "Host", joinedAt: new Date().toISOString() },
          { id: "p2", name: "Guest", joinedAt: new Date().toISOString() },
        ],
        availableWords: [],
        roles: [],
        hostParticipantId: "p1",
        viewerIsHost: true,
      },
    };

    // mock fetch responses for api.fetchRoom
    const fetchMock = global.fetch as unknown as any;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(firstSnapshot),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(secondSnapshot),
    });

    const session = { participantId: "p1", room: firstSnapshot.room };

    await act(async () => {
      render(
        <MemoryRouter>
          <RoomStoreProvider>
            <TestInit session={session} />
            <LobbyPage />
          </RoomStoreProvider>
        </MemoryRouter>,
      );
    });

    // initial participant present
    expect(screen.getByText(/Host/)).toBeDefined();

    // after polling, guest should appear (poll invoked synchronously via stubbed setInterval)
    expect(await screen.findByText(/Guest/)).toBeDefined();
  });

  it("enables the host start button when participantId matches host even if viewerIsHost is missing", async () => {
    const roomCode = "HOST";

    const snapshot = {
      room: {
        code: roomCode,
        status: "lobby",
        participants: [
          { id: "p1", name: "Host", joinedAt: new Date().toISOString() },
          { id: "p2", name: "Guest 1", joinedAt: new Date().toISOString() },
          { id: "p3", name: "Guest 2", joinedAt: new Date().toISOString() },
        ],
        availableWords: [],
        roles: [],
        hostParticipantId: "p1",
        viewerIsHost: false,
      },
    };

    const fetchMock = global.fetch as unknown as any;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ room: snapshot.room }),
    });

    const session = { participantId: "p1", room: snapshot.room };

    await act(async () => {
      render(
        <MemoryRouter>
          <RoomStoreProvider>
            <TestInit session={session} />
            <LobbyPage />
          </RoomStoreProvider>
        </MemoryRouter>,
      );
    });

    const startButtons = screen.getAllByRole("button", { name: /Start Game/i });
    expect(startButtons[0].hasAttribute("disabled")).toBe(false);
  });
});
