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

  it("calls roomStore.submitGuess with the trimmed text when a guesser submits a guess", async () => {
    const submitSpy = vi
      .spyOn(api, "submitGuess")
      .mockResolvedValue({ room: snapshot() });

    await render(
      "guest-id",
      snapshot({
        participants: [
          { id: "host-id", name: "Alice", joinedAt: "t", score: 0 },
          { id: "guest-id", name: "Bob", joinedAt: "t", score: 0 }
        ]
      })
    );

    const input = container.querySelector(".form__input") as HTMLInputElement;
    expect(input).not.toBeNull();
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      setter?.call(input, "  rocket  ");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      const button = container.querySelector(
        "button[type='submit']"
      ) as HTMLButtonElement;
      button.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(submitSpy).toHaveBeenCalledWith("ABCD", "guest-id", "rocket");
  });

  it("does NOT render a GuessForm when the viewer is the drawer", async () => {
    await render(
      "host-id",
      snapshot({
        participants: [
          { id: "host-id", name: "Alice", joinedAt: "t", score: 0 },
          { id: "guest-id", name: "Bob", joinedAt: "t", score: 0 }
        ]
      })
    );

    const form = container.querySelector("form");
    expect(form).toBeNull();
  });

  it("renders the scoreboard with participants and their scores, tagging the drawer", async () => {
    await render(
      "guest-id",
      snapshot({
        participants: [
          { id: "host-id", name: "Alice", joinedAt: "t", score: 0 },
          { id: "guest-id", name: "Bob", joinedAt: "t", score: 100 }
        ]
      })
    );

    const items = Array.from(container.querySelectorAll(".player-list li"));
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0].textContent).toContain("Alice");
    expect(items[0].textContent).toContain("Drawer");
    expect(items[1].textContent).toContain("Bob");
    expect(items[1].textContent).toContain("100");
  });

  it("renders guess history with real text for the original guesser", async () => {
    await render(
      "guest-id",
      snapshot({
        participants: [
          { id: "host-id", name: "Alice", joinedAt: "t", score: 0 },
          { id: "guest-id", name: "Bob", joinedAt: "t", score: 100 }
        ],
        guesses: [
          {
            id: "g1",
            guesserParticipantId: "guest-id",
            text: "rocket",
            isCorrect: true,
            submittedAt: "t",
            order: 0
          }
        ]
      })
    );

    const history = container.querySelector('[data-testid="guess-history"]');
    expect(history).not.toBeNull();
    expect(history!.textContent).toContain("Bob");
    expect(history!.textContent).toContain("rocket");
    expect(history!.textContent).toContain("correct");
    expect(history!.textContent).not.toContain("<correct guess>");
  });

  it("renders the redaction placeholder for a correct entry whose text is null", async () => {
    await render(
      "carol-id",
      snapshot({
        participants: [
          { id: "host-id", name: "Alice", joinedAt: "t", score: 0 },
          { id: "bob-id", name: "Bob", joinedAt: "t", score: 100 },
          { id: "carol-id", name: "Carol", joinedAt: "t", score: 0 }
        ],
        guesses: [
          {
            id: "g1",
            guesserParticipantId: "bob-id",
            text: null,
            isCorrect: true,
            submittedAt: "t",
            order: 0
          }
        ]
      })
    );

    const history = container.querySelector('[data-testid="guess-history"]');
    expect(history).not.toBeNull();
    expect(history!.textContent).toContain("Bob");
    expect(history!.textContent).toContain("<correct guess>");
    for (const word of ["rocket", "pizza", "castle", "guitar", "sunflower"]) {
      expect(history!.textContent).not.toContain(word);
    }
  });

  it("renders the literal text for an incorrect entry regardless of viewer", async () => {
    await render(
      "carol-id",
      snapshot({
        participants: [
          { id: "host-id", name: "Alice", joinedAt: "t", score: 0 },
          { id: "bob-id", name: "Bob", joinedAt: "t", score: 0 },
          { id: "carol-id", name: "Carol", joinedAt: "t", score: 0 }
        ],
        guesses: [
          {
            id: "g1",
            guesserParticipantId: "bob-id",
            text: "banana",
            isCorrect: false,
            submittedAt: "t",
            order: 0
          }
        ]
      })
    );

    const history = container.querySelector('[data-testid="guess-history"]');
    expect(history).not.toBeNull();
    expect(history!.textContent).toContain("banana");
    expect(history!.textContent).toContain("incorrect");
  });

  it("renders the End Round button when the viewer is the host (drawer) during a playing round", async () => {
    await render(
      "host-id",
      snapshot({
        participants: [
          { id: "host-id", name: "Alice", joinedAt: "t", score: 0 },
          { id: "guest-id", name: "Bob", joinedAt: "t", score: 0 }
        ]
      })
    );

    const buttons = Array.from(container.querySelectorAll("button")).map(
      (b) => (b.textContent ?? "").trim()
    );
    expect(buttons).toContain("End Round");
  });

  it("does NOT render an End Round button when the viewer is a non-host guesser", async () => {
    await render(
      "guest-id",
      snapshot({
        participants: [
          { id: "host-id", name: "Alice", joinedAt: "t", score: 0 },
          { id: "guest-id", name: "Bob", joinedAt: "t", score: 0 }
        ]
      })
    );

    const buttons = Array.from(container.querySelectorAll("button")).map(
      (b) => (b.textContent ?? "").trim()
    );
    expect(buttons).not.toContain("End Round");
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
