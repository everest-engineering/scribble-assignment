import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, type RoomSnapshot } from "../services/api";
import { RoomStoreProvider, useRoomStore } from "../state/roomStore";
import { LobbyPage } from "./LobbyPage";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function snapshot(overrides: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return {
    code: "ABCD",
    status: "lobby",
    hostParticipantId: "host-id",
    participants: [{ id: "host-id", name: "Alice", joinedAt: "2026-01-01T00:00:00.000Z" }],
    currentRound: null,
    availableWords: [],
    roles: [],
    ...overrides
  };
}

function GameRouteProbe() {
  return createElement("div", { "data-testid": "game-route-marker" }, "GAME PAGE");
}

function StoreSeed({
  participantId,
  room,
  children
}: {
  participantId: string;
  room: RoomSnapshot;
  children?: ReactNode;
}) {
  const store = useRoomStore();
  store.setRoomSession({ participantId, room });
  return createElement("div", null, children);
}

describe("LobbyPage", () => {
  let container: HTMLDivElement;
  let root: Root;
  let activeSnapshot: RoomSnapshot;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    activeSnapshot = snapshot();
    vi.spyOn(api, "fetchRoom").mockImplementation(async () => ({ room: activeSnapshot }));
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  async function render(participantId: string, room: RoomSnapshot) {
    activeSnapshot = room;
    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/lobby"] },
          createElement(
            RoomStoreProvider,
            null,
            createElement(
              StoreSeed,
              { participantId, room },
              createElement(
                Routes,
                null,
                createElement(Route, { path: "/lobby", element: createElement(LobbyPage) }),
                createElement(Route, { path: "/game", element: createElement(GameRouteProbe) })
              )
            )
          )
        )
      );
      // Let the polling effect's initial fetchRoom() resolve so its setState
      // happens inside act().
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it("renders Start (disabled) and the waiting copy when host is alone", async () => {
    await render(
      "host-id",
      snapshot({ participants: [{ id: "host-id", name: "Alice", joinedAt: "t" }] })
    );

    const button = container.querySelector("button.button--primary") as HTMLButtonElement | null;
    expect(button).not.toBeNull();
    expect(button!.textContent).toContain("Start Game");
    expect(button!.disabled).toBe(true);
    expect(container.textContent).toContain("Waiting for another player");
  });

  it("renders Start (enabled) once a second player has joined", async () => {
    await render(
      "host-id",
      snapshot({
        participants: [
          { id: "host-id", name: "Alice", joinedAt: "t" },
          { id: "guest-id", name: "Bob", joinedAt: "t" }
        ]
      })
    );

    const button = container.querySelector("button.button--primary") as HTMLButtonElement | null;
    expect(button).not.toBeNull();
    expect(button!.disabled).toBe(false);
    expect(container.textContent).not.toContain("Waiting for another player");
  });

  it("does not render a Start control for non-hosts at any player count", async () => {
    await render(
      "guest-id",
      snapshot({
        participants: [
          { id: "host-id", name: "Alice", joinedAt: "t" },
          { id: "guest-id", name: "Bob", joinedAt: "t" }
        ]
      })
    );

    const button = container.querySelector("button.button--primary");
    expect(button).toBeNull();
  });

  it("navigates to /game when the room's status transitions to playing", async () => {
    await render(
      "host-id",
      snapshot({
        status: "playing",
        participants: [
          { id: "host-id", name: "Alice", joinedAt: "t" },
          { id: "guest-id", name: "Bob", joinedAt: "t" }
        ],
        currentRound: { drawerParticipantId: "host-id", secretWord: "rocket" }
      })
    );

    expect(container.querySelector('[data-testid="game-route-marker"]')).not.toBeNull();
    expect(container.querySelector(".lobby-header")).toBeNull();
  });

  it("marks the host participant with a 'host' label and others with 'joined'", async () => {
    await render(
      "host-id",
      snapshot({
        participants: [
          { id: "host-id", name: "Alice", joinedAt: "t" },
          { id: "guest-id", name: "Bob", joinedAt: "t" }
        ]
      })
    );

    const items = Array.from(container.querySelectorAll(".player-list li"));
    expect(items[0].textContent).toContain("Alice");
    expect(items[0].textContent).toContain("host");
    expect(items[1].textContent).toContain("Bob");
    expect(items[1].textContent).toContain("joined");
  });
});
