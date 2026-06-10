import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoomStoreProvider, useRoomStore } from "../state/roomStore";
import { GamePage } from "./GamePage";

function TestHarness({ snapshot, pid }: { snapshot: Record<string, unknown>; pid?: string }) {
  const store = useRoomStore();

  store.setRoomSession({ participantId: pid ?? "test-id", room: snapshot as never });

  return <GamePage />;
}

describe("GamePage", () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "playing", hostId: "host-1", drawerId: "host-1", participants: [], availableWords: [], roles: [], canvasActions: [], guessHistory: [], scores: {}, roundOver: false } })
    }));
  });

  afterEach(() => {
    if (root) {
      act(() => { root.unmount(); });
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function render(snapshot: Record<string, unknown> = {}, pid?: string) {
    act(() => {
      root = createRoot(container);
      root.render(
        <MemoryRouter>
          <RoomStoreProvider>
            <TestHarness snapshot={snapshot} pid={pid} />
          </RoomStoreProvider>
        </MemoryRouter>
      );
    });
  }

  const baseSnapshot = {
    canvasActions: [],
    guessHistory: [],
    scores: {},
    roundOver: false
  };

  it("renders game page with a valid playing room", () => {
    render({
      ...baseSnapshot,
      code: "ABCD",
      status: "playing",
      hostId: "host-1",
      drawerId: "host-1",
      participants: [{ id: "host-1", name: "Alice", joinedAt: new Date().toISOString() }],
      availableWords: ["rocket", "pizza"],
      roles: ["drawer", "guesser"]
    });

    expect(container.querySelector(".game-page")).toBeTruthy();
    expect(container.textContent).toContain("Round 1");
  });

  it("shows drawer indicator for the drawer", () => {
    render({
      ...baseSnapshot,
      code: "ABCD",
      status: "playing",
      hostId: "host-1",
      drawerId: "host-1",
      secretWord: "pizza",
      participants: [
        { id: "host-1", name: "Alice", joinedAt: new Date().toISOString() },
        { id: "guest-1", name: "Bob", joinedAt: new Date().toISOString() }
      ],
      availableWords: ["rocket", "pizza"],
      roles: ["drawer", "guesser"]
    }, "host-1");

    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("pizza");
  });

  it("shows drawer name for guessers without secret word", () => {
    render({
      ...baseSnapshot,
      code: "ABCD",
      status: "playing",
      hostId: "host-1",
      drawerId: "host-1",
      participants: [
        { id: "host-1", name: "Alice", joinedAt: new Date().toISOString() },
        { id: "guest-1", name: "Bob", joinedAt: new Date().toISOString() }
      ],
      availableWords: ["rocket", "pizza"],
      roles: ["drawer", "guesser"]
    }, "guest-1");

    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("Canvas");
  });
});
