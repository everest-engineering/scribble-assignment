import React, { StrictMode, act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GamePage } from "./GamePage";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  roomStore: {
    leaveRoom: vi.fn()
  },
  roomState: {
    room: {
      code: "ABCD",
      status: "game",
      hostParticipantId: "participant-1",
      currentDrawerId: "participant-1",
      currentWord: "rocket",
      participants: [
        {
          id: "participant-1",
          name: "Alice",
          joinedAt: "2026-06-05T00:00:00.000Z",
          role: "drawer"
        },
        {
          id: "participant-2",
          name: "Bob",
          joinedAt: "2026-06-05T00:00:01.000Z",
          role: "guesser"
        }
      ],
      availableWords: []
    },
    participantId: "participant-1",
    hostParticipantId: "participant-1",
    roomStatus: "game",
    error: null,
    isLoading: false
  }
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mocks.navigate
  };
});

vi.mock("../state/roomStore", () => ({
  useRoomState: () => mocks.roomState,
  useRoomStore: () => mocks.roomStore
}));

describe("GamePage", () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.roomStore.leaveRoom.mockReset();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("shows the secret word to the drawer and role labels to everyone", async () => {
    mocks.roomState.participantId = "participant-1";

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StrictMode>
          <GamePage />
        </StrictMode>
      );
    });

    expect(container.textContent).toContain("Drawer: Alice");
    expect(container.textContent).toContain("drawer");
    expect(container.querySelector(".word-reveal")?.textContent).toContain("rocket");
    expect(container.querySelector(".word-mask")).toBeNull();

    await act(async () => {
      root.unmount();
    });
  });

  it("hides the secret word from guessers", async () => {
    mocks.roomState.participantId = "participant-2";

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StrictMode>
          <GamePage />
        </StrictMode>
      );
    });

    expect(container.textContent).toContain("Drawer: Alice");
    expect(container.textContent).toContain("guesser");
    expect(container.querySelector(".word-reveal")).toBeNull();
    expect(container.querySelector(".word-mask__text")?.textContent).toContain("Hidden from guessers");

    await act(async () => {
      root.unmount();
    });
  });

  it("leaves the room when the game page unmounts", async () => {
    vi.useFakeTimers();
    mocks.roomState.participantId = "participant-1";

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StrictMode>
          <GamePage />
        </StrictMode>
      );
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      root.unmount();
    });

    expect(mocks.roomStore.leaveRoom).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
