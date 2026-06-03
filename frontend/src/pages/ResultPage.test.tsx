import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, type RoomSnapshot } from "../services/api";
import { RoomStoreProvider, useRoomStore } from "../state/roomStore";
import { ResultPage } from "./ResultPage";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function snapshot(overrides: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return {
    code: "ABCD",
    status: "result",
    hostParticipantId: "host-id",
    participants: [
      { id: "host-id", name: "Alice", joinedAt: "t", score: 0 },
      { id: "bob-id", name: "Bob", joinedAt: "t", score: 100 },
      { id: "carol-id", name: "Carol", joinedAt: "t", score: 0 }
    ],
    currentRound: { drawerParticipantId: "host-id", secretWord: "rocket" },
    guesses: [
      {
        id: "g1",
        guesserParticipantId: "bob-id",
        text: "rocket",
        isCorrect: true,
        submittedAt: "t",
        order: 0
      },
      {
        id: "g2",
        guesserParticipantId: "carol-id",
        text: "banana",
        isCorrect: false,
        submittedAt: "t",
        order: 1
      }
    ],
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

describe("ResultPage", () => {
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
          { initialEntries: ["/result"] },
          createElement(
            RoomStoreProvider,
            null,
            createElement(StoreSeed, { participantId, room }, createElement(ResultPage))
          )
        )
      );
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it("renders the secret word as a literal string for every viewer", async () => {
    for (const viewer of ["host-id", "bob-id", "carol-id"]) {
      const fresh = snapshot();
      await render(viewer, fresh);

      const wordNode = container.querySelector('[data-testid="result-secret-word"]');
      expect(wordNode, `viewer ${viewer}`).not.toBeNull();
      expect(wordNode!.textContent, `viewer ${viewer}`).toBe("rocket");

      act(() => {
        root.unmount();
      });
      container.innerHTML = "";
      root = createRoot(container);
    }
  });

  it("renders the scoreboard with each participant's final score", async () => {
    await render("carol-id", snapshot());

    const items = Array.from(container.querySelectorAll(".player-list li"));
    expect(items[0].textContent).toContain("Alice");
    expect(items[0].textContent).toContain("Drawer");
    expect(items[0].textContent).toContain("0");
    expect(items[1].textContent).toContain("Bob");
    expect(items[1].textContent).toContain("100");
    expect(items[2].textContent).toContain("Carol");
  });

  it("renders the full guess history with the literal text of every entry and NO redaction placeholder", async () => {
    await render("carol-id", snapshot());

    const history = container.querySelector('[data-testid="result-guess-history"]');
    expect(history).not.toBeNull();
    expect(history!.textContent).toContain("rocket");
    expect(history!.textContent).toContain("banana");
    expect(history!.textContent).not.toContain("<correct guess>");
  });

  it("renders the host's 'You can restart the room' copy when the viewer is the host", async () => {
    await render("host-id", snapshot());

    expect(container.textContent).toContain("You can restart");
    expect(container.textContent).not.toContain("Waiting for the host to restart");
  });

  it("renders the 'Waiting for the host to restart…' copy when the viewer is a guesser", async () => {
    await render("carol-id", snapshot());

    expect(container.textContent).toContain("Waiting for the host to restart");
  });

});
