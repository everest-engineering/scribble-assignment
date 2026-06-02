import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { CreateRoomPage } from "./CreateRoomPage";
import { JoinRoomPage } from "./JoinRoomPage";
import { LobbyPage } from "./LobbyPage";
import { GamePage } from "./GamePage";
import { flushRender } from "../test-utils";

const useRoomStateMock = vi.fn();
const useRoomStoreMock = vi.fn();

vi.mock("../state/roomStore", () => ({
  useRoomState: () => useRoomStateMock(),
  useRoomStore: () => useRoomStoreMock(),
}));

// Mock PageHeader and other components if necessary, or just let them render
vi.mock("../components/PageHeader", () => ({
  PageHeader: ({ title }: any) => <div>{title}</div>,
}));

describe("frontend pages", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;
  const createRoomMock = vi.fn();
  const joinRoomMock = vi.fn();
  const fetchRoomMock = vi.fn();
  const startGameMock = vi.fn();

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    
    useRoomStoreMock.mockReturnValue({
      createRoom: createRoomMock,
      joinRoom: joinRoomMock,
      fetchRoom: fetchRoomMock,
      startGame: startGameMock,
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

  it("LobbyPage enables start button only for host with 2+ players", async () => {
    // Case 1: Host but 1 player
    useRoomStateMock.mockReturnValue({
      room: { 
        code: "ABCD", 
        participants: [{ id: "h1", name: "Host", isHost: true }],
        status: "lobby"
      },
      participantId: "h1",
    });

    root?.render(<MemoryRouter><LobbyPage /></MemoryRouter>);
    await flushRender();
    
    let startButton = container.querySelector("button.button--primary") as HTMLButtonElement;
    expect(startButton.disabled).toBe(true);

    // Case 2: Host with 2 players
    useRoomStateMock.mockReturnValue({
      room: { 
        code: "ABCD", 
        participants: [
          { id: "h1", name: "Host", isHost: true },
          { id: "p2", name: "Player 2", isHost: false }
        ],
        status: "lobby"
      },
      participantId: "h1",
    });

    root?.render(<MemoryRouter><LobbyPage /></MemoryRouter>);
    await flushRender();
    
    startButton = container.querySelector("button.button--primary") as HTMLButtonElement;
    expect(startButton.disabled).toBe(false);
  });

  it("LobbyPage polls for room updates", async () => {
    vi.useFakeTimers();
    
    useRoomStateMock.mockReturnValue({
      room: { code: "ABCD", participants: [], status: "lobby" },
      participantId: "h1",
    });

    root?.render(<MemoryRouter><LobbyPage /></MemoryRouter>);
    await vi.advanceTimersByTimeAsync(0);

    expect(fetchRoomMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchRoomMock).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("CreateRoomPage validates player name", async () => {
    root?.render(<MemoryRouter><CreateRoomPage /></MemoryRouter>);
    await flushRender();

    const form = container.querySelector("form")!;
    form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    await flushRender();

    expect(container.textContent).toContain("Player name is required");
    expect(createRoomMock).not.toHaveBeenCalled();
  });

  it("JoinRoomPage validates player name", async () => {
    root?.render(<MemoryRouter><JoinRoomPage /></MemoryRouter>);
    await flushRender();

    const form = container.querySelector("form")!;
    form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    await flushRender();

    expect(container.textContent).toContain("Player name is required");
    expect(joinRoomMock).not.toHaveBeenCalled();
  });

  it("GamePage hides secret word from guessers", async () => {
    // Drawer case
    useRoomStateMock.mockReturnValue({
      room: { 
        code: "ABCD", 
        participants: [
          { id: "h1", name: "Host", isHost: true },
          { id: "p2", name: "Bob", isHost: false }
        ],
        status: "active",
        drawerId: "h1",
        secretWord: "rocket",
        scores: { h1: 0, p2: 0 },
        guesses: []
      },
      participantId: "h1",
    });

    root?.render(<MemoryRouter><GamePage /></MemoryRouter>);
    await flushRender();
    expect(container.textContent).toContain("rocket");
    expect(container.textContent).toContain("Only you can see this word.");

    // Guesser case
    useRoomStateMock.mockReturnValue({
      room: { 
        code: "ABCD", 
        participants: [
          { id: "h1", name: "Host", isHost: true },
          { id: "p2", name: "Bob", isHost: false }
        ],
        status: "active",
        drawerId: "h1",
        secretWord: undefined,
        scores: { h1: 0, p2: 0 },
        guesses: []
      },
      participantId: "p2",
    });

    root?.render(<MemoryRouter><GamePage /></MemoryRouter>);
    await flushRender();
    expect(container.textContent).not.toContain("rocket");
    expect(container.textContent).not.toContain("Secret word");
    expect(container.textContent).not.toContain("Only you can see this word.");
  });

  it("GamePage shows restart button only for host in results state", async () => {
    // Host case
    useRoomStateMock.mockReturnValue({
      room: { 
        code: "ABCD", 
        participants: [{ id: "h1", name: "Host", isHost: true }],
        status: "results",
        drawerId: "h1",
        secretWord: "rocket",
        scores: { h1: 100 },
        guesses: []
      },
      participantId: "h1",
    });

    root?.render(<MemoryRouter><GamePage /></MemoryRouter>);
    await flushRender();
    expect(container.textContent).toContain("Restart Round");

    // Non-host case
    useRoomStateMock.mockReturnValue({
      room: { 
        code: "ABCD", 
        participants: [
          { id: "h1", name: "Host", isHost: true },
          { id: "p2", name: "Bob", isHost: false }
        ],
        status: "results",
        drawerId: "h1",
        secretWord: "rocket",
        scores: { h1: 0, p2: 100 },
        guesses: []
      },
      participantId: "p2",
    });

    root?.render(<MemoryRouter><GamePage /></MemoryRouter>);
    await flushRender();
    expect(container.textContent).not.toContain("Restart Round");
    expect(container.textContent).toContain("Waiting for the host to restart the game.");
  });

  it("GamePage reveals the secret word to everyone in results state", async () => {
    useRoomStateMock.mockReturnValue({
      room: { 
        code: "ABCD", 
        participants: [
          { id: "h1", name: "Host", isHost: true },
          { id: "p2", name: "Bob", isHost: false }
        ],
        status: "results",
        drawerId: "h1",
        secretWord: "rocket",
        scores: { h1: 0, p2: 100 },
        guesses: []
      },
      participantId: "p2", // Bob is a guesser
    });

    root?.render(<MemoryRouter><GamePage /></MemoryRouter>);
    await flushRender();
    
    // In results state, even guessers should see the word
    expect(container.textContent).toContain("rocket");
    expect(container.textContent).toContain("Round complete. Review the results below.");
  });
});
