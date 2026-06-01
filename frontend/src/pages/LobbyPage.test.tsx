import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();
const enablePollingMock = vi.fn();
const disablePollingMock = vi.fn();
const fetchRoomMock = vi.fn();
const startRoomMock = vi.fn();

const roomState = {
  room: {
    code: "ABCD",
    status: "lobby",
    participants: [
      { id: "p1", name: "Alice", joinedAt: "2026-05-31T00:00:00.000Z" },
      { id: "p2", name: "Bob", joinedAt: "2026-05-31T00:00:01.000Z" }
    ],
    availableWords: ["rocket", "pizza"],
    roles: [],
    drawerParticipantId: null,
    roundPhase: null,
    canvasEvents: [],
    guessHistory: [],
    scores: {}
  },
  participantId: "p1",
  error: null,
  isLoading: false
} as const;

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock
}));

vi.mock("../state/roomStore", () => ({
  useRoomState: () => roomState,
  useRoomStore: () => ({
    enablePolling: enablePollingMock,
    disablePolling: disablePollingMock,
    fetchRoom: fetchRoomMock,
    startRoom: startRoomMock
  })
}));

import { LobbyPage } from "./LobbyPage";

describe("LobbyPage", () => {
  beforeEach(() => {
    document.body.innerHTML = "<div id=\"root\"></div>";
    navigateMock.mockReset();
    enablePollingMock.mockReset();
    disablePollingMock.mockReset();
    fetchRoomMock.mockReset();
    startRoomMock.mockReset();
  });

  it("shows the start button for the host and starts the game", async () => {
    startRoomMock.mockResolvedValue({
      room: {
        code: "ABCD",
        status: "game",
        participants: roomState.room.participants,
        availableWords: ["rocket", "pizza"],
        roles: [],
        drawerParticipantId: "p1",
        roundPhase: "active",
        canvasEvents: [],
        guessHistory: [],
        scores: { p1: 0, p2: 0 },
        secretWord: "rocket"
      }
    });

    const container = document.getElementById("root") as HTMLElement;
    const root = createRoot(container);

    await act(async () => {
      root.render(<LobbyPage />);
    });

    expect(enablePollingMock).toHaveBeenCalled();

    const select = container.querySelector("select") as HTMLSelectElement;
    await act(async () => {
      select.value = "pizza";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const startButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Start Game"
    ) as HTMLButtonElement;

    await act(async () => {
      startButton.click();
    });

    expect(startRoomMock).toHaveBeenCalledWith("pizza");
    expect(navigateMock).toHaveBeenCalledWith("/game");

    await act(async () => {
      root.unmount();
    });

    expect(disablePollingMock).toHaveBeenCalled();
  });
});
