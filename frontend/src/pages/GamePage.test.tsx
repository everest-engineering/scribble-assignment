import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();
const enablePollingMock = vi.fn();
const disablePollingMock = vi.fn();
const restartRoomMock = vi.fn();

type GameRoomState = {
  room: {
    code: string;
    status: "game";
    participants: Array<{ id: string; name: string; joinedAt: string }>;
    availableWords: string[];
    roles: Array<"drawer" | "guesser">;
    drawerParticipantId: string;
    roundPhase: "active" | "ended" | null;
    canvasEvents: Array<unknown>;
    guessHistory: Array<unknown>;
    scores: Record<string, number>;
    secretWord?: string;
  };
  participantId: string;
};

const roomState: GameRoomState = {
  room: {
    code: "ABCD",
    status: "game",
    participants: [
      { id: "p1", name: "Alice", joinedAt: "2026-05-31T00:00:00.000Z" },
      { id: "p2", name: "Bob", joinedAt: "2026-05-31T00:00:01.000Z" }
    ],
    availableWords: [],
    roles: [],
    drawerParticipantId: "p1",
    roundPhase: "active",
    canvasEvents: [],
    guessHistory: [],
    scores: { p1: 0, p2: 0 },
    secretWord: "rocket"
  },
  participantId: "p2"
};

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock
}));

vi.mock("../state/roomStore", () => ({
  useRoomState: () => roomState,
  useRoomStore: () => ({
    enablePolling: enablePollingMock,
    disablePolling: disablePollingMock,
    restartRoom: restartRoomMock
  })
}));

import { GamePage } from "./GamePage";

describe("GamePage", () => {
  beforeEach(() => {
    document.body.innerHTML = "<div id=\"root\"></div>";
    navigateMock.mockReset();
    enablePollingMock.mockReset();
    disablePollingMock.mockReset();
    restartRoomMock.mockReset();
    roomState.room.participants = [
      { id: "p1", name: "Alice", joinedAt: "2026-05-31T00:00:00.000Z" },
      { id: "p2", name: "Bob", joinedAt: "2026-05-31T00:00:01.000Z" }
    ];
    roomState.room.drawerParticipantId = "p1";
    roomState.room.roundPhase = "active";
    roomState.room.secretWord = "rocket";
    roomState.participantId = "p2";
  });

  it("hides the secret word from guessers while the round is active", async () => {
    const container = document.getElementById("root") as HTMLElement;
    const root = createRoot(container);

    await act(async () => {
      root.render(<GamePage />);
    });

    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("Playing");
    expect(container.textContent).toContain("Hidden from guessers");
    expect(container.textContent).toContain("Submit Guess");

    await act(async () => {
      root.unmount();
    });
  });

  it("shows the ended round summary to the drawer", async () => {
    roomState.participantId = "p1";
    roomState.room.roundPhase = "ended";

    const container = document.getElementById("root") as HTMLElement;
    const root = createRoot(container);

    await act(async () => {
      root.render(<GamePage />);
    });

    expect(container.textContent).toContain("Round Summary");
    expect(container.textContent).toContain("Round complete");
    expect(container.textContent).toContain("rocket");
    expect(container.textContent).toContain("Final Scores");
    expect(container.textContent).not.toContain("Submit Guess");
    expect(container.textContent).toContain("Restart Game");

    const restartButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Restart Game"
    ) as HTMLButtonElement;

    await act(async () => {
      restartButton.click();
    });

    expect(restartRoomMock).toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });
});
