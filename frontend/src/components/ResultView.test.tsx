import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ResultView } from "./ResultView";
import type { GuessView, RoomSnapshot } from "../services/api";

function makeGuess(over: Partial<GuessView> = {}): GuessView {
  return {
    id: over.id ?? "g-" + Math.random().toString(36).slice(2),
    participantId: "p-bob",
    displayName: "Bob",
    text: "cat",
    isCorrect: false,
    submittedAt: "2026-06-11T11:00:00.000Z",
    ...over
  };
}

function makeResultRoom(overrides: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return {
    code: "ABCD",
    status: "result",
    hostParticipantId: "p-alice",
    viewerIsHost: false,
    canStart: false,
    availableWords: [],
    roles: ["drawer", "guesser"],
    participants: [
      { id: "p-alice", name: "Alice", joinedAt: "", isHost: true, isDrawer: true },
      { id: "p-bob", name: "Bob", joinedAt: "", isHost: false, isDrawer: false }
    ],
    round: {
      roundNumber: 1,
      drawerParticipantId: "p-alice",
      maskedWord: "______",
      secretWord: "rocket",
      guesses: [
        makeGuess({ text: "cat", isCorrect: false }),
        makeGuess({ text: "rocket", isCorrect: true })
      ],
      scores: { "p-alice": 0, "p-bob": 100 },
      lockedParticipantIds: ["p-bob"]
    },
    ...overrides
  };
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  if (container.parentNode) container.parentNode.removeChild(container);
});

function render(element: React.ReactElement) {
  act(() => {
    root.render(element);
  });
}

describe("ResultView", () => {
  it("returns null when room.status !== 'result'", () => {
    const room = makeResultRoom({ status: "round" });
    render(createElement(ResultView, { room, viewerParticipantId: "p-bob" }));
    expect(container.querySelector('[data-testid="result-view"]')).toBeNull();
  });

  it("renders the cleartext word in uppercase, the scoreboard, and the chronological feed", () => {
    const room = makeResultRoom();
    render(createElement(ResultView, { room, viewerParticipantId: "p-bob" }));

    const word = container.querySelector('[data-testid="result-word"]');
    expect(word?.textContent).toBe("ROCKET");

    // scoreboard via testids set by GuessPanel
    expect(container.querySelector('[data-testid="score-p-alice"]')?.textContent).toContain("0");
    expect(container.querySelector('[data-testid="score-p-bob"]')?.textContent).toContain("100");

    // feed entries in chronological order
    const items = container.querySelectorAll('[data-testid="guess-feed"] li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain("cat");
    expect(items[1].textContent).toContain("rocket");
  });

  it("does NOT render a guess input, a canvas, or a Start button", () => {
    const room = makeResultRoom();
    render(createElement(ResultView, { room, viewerParticipantId: "p-bob" }));
    expect(container.querySelector("input")).toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
    expect(container.querySelector('button[data-testid="start-game-button"]')).toBeNull();
  });

  it("renders the Restart button only when viewerIsHost === true", () => {
    const guestRoom = makeResultRoom({ viewerIsHost: false });
    render(createElement(ResultView, { room: guestRoom, viewerParticipantId: "p-bob" }));
    expect(container.querySelector('[data-testid="restart-button"]')).toBeNull();

    const hostRoom = makeResultRoom({ viewerIsHost: true });
    render(createElement(ResultView, { room: hostRoom, viewerParticipantId: "p-alice" }));
    expect(container.querySelector('[data-testid="restart-button"]')).not.toBeNull();
  });

  it("clicking Restart calls the onRestart prop exactly once", () => {
    const onRestart = vi.fn();
    const room = makeResultRoom({ viewerIsHost: true });
    render(
      createElement(ResultView, {
        room,
        viewerParticipantId: "p-alice",
        onRestart
      })
    );
    const button = container.querySelector(
      '[data-testid="restart-button"]'
    ) as HTMLButtonElement;
    expect(button).not.toBeNull();
    act(() => {
      button.click();
    });
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
