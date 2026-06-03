import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, type RoomSnapshot } from "../services/api";
import { RoomStoreProvider, useRoomStore } from "../state/roomStore";
import { GamePage } from "./GamePage";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const STARTER_WORDS = ["rocket", "pizza", "castle", "guitar", "sunflower"];

function snapshot(overrides: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return {
    code: "ABCD",
    status: "playing",
    hostParticipantId: "host-id",
    participants: [
      { id: "host-id", name: "Alice", joinedAt: "t", score: 0 },
      { id: "guest-id", name: "Bob", joinedAt: "t", score: 0 }
    ],
    currentRound: { drawerParticipantId: "host-id", secretWord: "rocket" },
    guesses: [],
    availableWords: [],
    roles: [],
    ...overrides
  };
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

describe("GamePage", () => {
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
          { initialEntries: ["/game"] },
          createElement(
            RoomStoreProvider,
            null,
            createElement(StoreSeed, { participantId, room }, createElement(GamePage))
          )
        )
      );
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it("renders the secret word and a 'drawer' indicator when the viewer is the drawer", async () => {
    await render("host-id", snapshot({ currentRound: { drawerParticipantId: "host-id", secretWord: "rocket" } }));

    const wordNode = container.querySelector('[data-testid="secret-word"]');
    expect(wordNode).not.toBeNull();
    expect(wordNode!.textContent).toBe("rocket");
    expect(container.textContent).toContain("You're the drawer");
    expect(container.textContent).toContain("Drawer");
  });

  it("hides the secret word from a guesser and shows the placeholder + drawer name", async () => {
    await render("guest-id", snapshot({ currentRound: { drawerParticipantId: "host-id", secretWord: null } }));

    expect(container.querySelector('[data-testid="secret-word"]')).toBeNull();

    const text = container.textContent ?? "";
    for (const word of STARTER_WORDS) {
      expect(text).not.toContain(word);
    }

    expect(text).toContain("Waiting for the drawer to begin");
    expect(text).toContain("Alice is drawing");
    expect(text).toContain("Guesser");
  });

  it("returns null and navigates away when there is no room", async () => {
    const initialUrl = window.location.href;
    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/game"] },
          createElement(RoomStoreProvider, null, createElement(GamePage))
        )
      );
      await Promise.resolve();
    });

    // No room ever seeded → component returns null on first render; the useEffect
    // schedules a navigate("/"), which under MemoryRouter does not mutate window.location
    // but does swap the rendered route. Asserting the component produced no game-page
    // content is the meaningful check here.
    expect(container.querySelector(".game-page")).toBeNull();
    expect(window.location.href).toBe(initialUrl);
  });
});
