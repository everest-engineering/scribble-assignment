import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();
const joinRoomMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock
}));

vi.mock("../state/roomStore", () => ({
  useRoomStore: () => ({
    joinRoom: joinRoomMock
  })
}));

import { JoinRoomPage } from "./JoinRoomPage";

describe("JoinRoomPage", () => {
  function setInputValue(input: HTMLInputElement, value: string) {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");

    if (!descriptor?.set) {
      throw new Error("Unable to set input value in test");
    }

    descriptor.set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  beforeEach(() => {
    document.body.innerHTML = "<div id=\"root\"></div>";
    navigateMock.mockReset();
    joinRoomMock.mockReset();
  });

  it("submits an uppercased room code when joining a room", async () => {
    joinRoomMock.mockResolvedValue({
      participantId: "p2",
      room: {
        code: "ABCD",
        status: "lobby",
        participants: [],
        availableWords: [],
        roles: [],
        drawerParticipantId: null,
        roundPhase: null,
        canvasEvents: [],
        guessHistory: [],
        scores: {}
      }
    });

    const container = document.getElementById("root") as HTMLElement;
    const root = createRoot(container);

    await act(async () => {
      root.render(<JoinRoomPage />);
    });

    const inputs = container.querySelectorAll("input");
    const playerNameInput = inputs[0] as HTMLInputElement;
    const roomCodeInput = inputs[1] as HTMLInputElement;
    const button = container.querySelector("button[type='submit']") as HTMLButtonElement;

    await act(async () => {
      setInputValue(playerNameInput, "Bob");
      setInputValue(roomCodeInput, "abcd");
    });

    await act(async () => {
      button.click();
    });

    expect(joinRoomMock).toHaveBeenCalledWith("ABCD", "Bob");
    expect(navigateMock).toHaveBeenCalledWith("/lobby");
  });
});
