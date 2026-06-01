import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();
const createRoomMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock
}));

vi.mock("../state/roomStore", () => ({
  useRoomStore: () => ({
    createRoom: createRoomMock
  })
}));

import { CreateRoomPage } from "./CreateRoomPage";

describe("CreateRoomPage", () => {
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
    createRoomMock.mockReset();
  });

  it("creates a room from the submitted player name", async () => {
    createRoomMock.mockResolvedValue({
      participantId: "p1",
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
      root.render(<CreateRoomPage />);
    });

    const input = container.querySelector("input") as HTMLInputElement;
    const button = container.querySelector("button[type='submit']") as HTMLButtonElement;

    await act(async () => {
      setInputValue(input, "Alice");
    });

    await act(async () => {
      button.click();
    });

    expect(createRoomMock).toHaveBeenCalledWith("Alice");
    expect(navigateMock).toHaveBeenCalledWith("/lobby");
  });
});
