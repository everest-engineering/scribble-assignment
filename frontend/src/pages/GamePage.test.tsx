import React, { StrictMode, act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GamePage } from "./GamePage";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  roomStore: {
    leaveRoom: vi.fn(),
    startLobbyPolling: vi.fn(),
    stopLobbyPolling: vi.fn(),
    submitGuess: vi.fn(),
    submitStroke: vi.fn(),
    clearCanvas: vi.fn(),
    restartRoom: vi.fn()
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
          role: "drawer",
          score: 0,
          hasGuessedCorrectly: false
        },
        {
          id: "participant-2",
          name: "Bob",
          joinedAt: "2026-06-05T00:00:01.000Z",
          role: "guesser",
          score: 100,
          hasGuessedCorrectly: true
        }
      ],
      drawing: [],
      guessHistory: [
        {
          participantId: "participant-2",
          participantName: "Bob",
          guess: "rocket",
          isCorrect: true
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
    mocks.roomStore.startLobbyPolling.mockReset();
    mocks.roomStore.stopLobbyPolling.mockReset();
    mocks.roomStore.submitGuess.mockReset();
    mocks.roomStore.submitStroke.mockReset();
    mocks.roomStore.clearCanvas.mockReset();
    mocks.roomStore.restartRoom.mockReset();
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
    expect(mocks.roomStore.startLobbyPolling).toHaveBeenCalled();

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
    expect(mocks.roomStore.startLobbyPolling).toHaveBeenCalled();

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
    expect(mocks.roomStore.stopLobbyPolling).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("shows the shared result state and restart action for the host", async () => {
    mocks.roomState.room = {
      ...mocks.roomState.room,
      status: "result",
      currentWord: "rocket"
    };
    mocks.roomStore.restartRoom.mockResolvedValue({
      room: {
        ...mocks.roomState.room,
        status: "lobby",
        currentDrawerId: null,
        currentWord: undefined
      }
    });

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

    expect(container.textContent).toContain("Round Complete");
    expect(container.textContent).toContain("Revealed to everyone");
    expect(container.querySelector(".word-reveal")?.textContent).toContain("rocket");
    expect(container.textContent).not.toContain("Submit Guess");
    expect(container.textContent).toContain("Restart / Play Again");

    await act(async () => {
      root.unmount();
    });
  });
});
