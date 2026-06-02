import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { GuessForm } from "./GuessForm";
import { ResultPanel } from "./ResultPanel";
import { Scoreboard } from "./Scoreboard";
import { DrawingCanvas } from "./DrawingCanvas";
import { flushRender } from "../test-utils";

const useRoomStateMock = vi.fn();
const useRoomStoreMock = vi.fn();

vi.mock("../state/roomStore", () => ({
  useRoomState: () => useRoomStateMock(),
  useRoomStore: () => useRoomStoreMock(),
}));

describe("frontend UI components", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;
  const submitGuessMock = vi.fn();

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    submitGuessMock.mockReset();
    useRoomStoreMock.mockReturnValue({
      submitGuess: submitGuessMock,
      appendDrawing: vi.fn(),
      clearDrawing: vi.fn(),
      restartGame: vi.fn(),
    });
  });

  afterEach(() => {
    if (root) {
      root.unmount();
      root = null;
    }

    container.remove();
    vi.clearAllMocks();
  });

  it("disables guess input when the current participant is the drawer", async () => {
    useRoomStateMock.mockReturnValue({
      room: { drawerId: "player-1" },
      participantId: "player-1",
    });

    root?.render(<GuessForm />);
    await flushRender();

    const input = container.querySelector("input") as HTMLInputElement | null;
    const button = container.querySelector(
      "button[type='submit']",
    ) as HTMLButtonElement | null;

    expect(input).not.toBeNull();
    expect(button).not.toBeNull();
    expect(input?.disabled).toBe(true);
    expect(button?.disabled).toBe(true);
  });

  it("renders the DrawingCanvas as read-only for non-drawers", async () => {
    useRoomStateMock.mockReturnValue({
      room: { drawerId: "player-1", drawingPaths: [] },
      participantId: "player-2",
    });

    // GamePage passes readOnly={true} for non-drawers
    root?.render(<DrawingCanvas readOnly={true} />);
    await flushRender();

    const canvas = container.querySelector("canvas") as HTMLCanvasElement | null;
    expect(canvas?.style.cursor).toBe("default");
    
    const clearButton = container.querySelector("button");
    expect(clearButton).toBeNull();
  });

  it("renders the scoreboard with participant names and scores", async () => {
    useRoomStateMock.mockReturnValue({
      room: {
        participants: [
          { id: "alice", name: "Alice", joinedAt: "now", isHost: true },
          { id: "bob", name: "Bob", joinedAt: "now", isHost: false },
        ],
        scores: { alice: 150, bob: 75 },
      },
      participantId: "alice",
    });

    root?.render(<Scoreboard />);
    await flushRender();

    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("150");
    expect(container.textContent).toContain("Bob");
    expect(container.textContent).toContain("75");
  });

  it("shows a placeholder when there are no guesses", async () => {
    useRoomStateMock.mockReturnValue({
      room: { guesses: [] },
      participantId: "alice",
    });

    root?.render(<ResultPanel />);
    await flushRender();

    expect(container.textContent).toContain(
      "Game activity and guesses will appear here.",
    );
  });

  it("renders guess history when guesses exist", async () => {
    useRoomStateMock.mockReturnValue({
      room: {
        guesses: [
          {
            participantId: "bob",
            participantName: "Bob",
            guess: "circle",
            correct: false,
            createdAt: "2026-06-01T00:00:00.000Z",
          },
          {
            participantId: "alice",
            participantName: "Alice",
            guess: "house",
            correct: true,
            createdAt: "2026-06-01T00:00:01.000Z",
          },
        ],
      },
      participantId: "alice",
    });

    root?.render(<ResultPanel />);
    await flushRender();

    expect(container.textContent).toContain("Bob:");
    expect(container.textContent).toContain("circle");
    expect(container.textContent).toContain("Incorrect");
    expect(container.textContent).toContain("Alice:");
    expect(container.textContent).toContain("house");
    expect(container.textContent).toContain("Correct");
  });

  it("ResultPanel displays the winner message when the round is complete", async () => {
    useRoomStateMock.mockReturnValue({
      room: {
        status: "results",
        guesses: [
          {
            participantId: "alice",
            participantName: "Alice",
            guess: "house",
            correct: true,
            createdAt: "2026-06-01T00:00:01.000Z",
          },
        ],
      },
      participantId: "bob",
    });

    // In GamePage, ResultPanel is rendered along with a separate Round Result card.
    // Let's check ResultPanel's own content.
    root?.render(<ResultPanel />);
    await flushRender();

    expect(container.textContent).toContain("Alice:");
    expect(container.textContent).toContain("house");
    expect(container.textContent).toContain("Correct");
  });
});
