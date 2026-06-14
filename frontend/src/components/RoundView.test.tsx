import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { RoomSnapshot } from "../services/api";
import { RoundView, getRoundViewState } from "./RoundView";

function makeRoom(overrides: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return {
    code: "ABCD",
    status: "round",
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
      guesses: [],
      scores: { "p-alice": 0, "p-bob": 0 },
      lockedParticipantIds: []
    },
    ...overrides
  };
}

describe("getRoundViewState", () => {
  it("returns mode='lobby' when room.round is null", () => {
    const state = getRoundViewState(makeRoom({ round: null, status: "lobby" }), "p-alice");
    expect(state).toEqual({ mode: "lobby" });
  });

  it("returns mode='drawer' with the cleartext word when the viewer is the drawer", () => {
    const room = makeRoom({
      round: {
        roundNumber: 1,
        drawerParticipantId: "p-alice",
        maskedWord: "______",
        secretWord: "rocket",
        guesses: [],
        scores: { "p-alice": 0, "p-bob": 0 },
        lockedParticipantIds: []
      }
    });
    const state = getRoundViewState(room, "p-alice");
    expect(state).toEqual({
      mode: "drawer",
      roundNumber: 1,
      drawerName: "Alice",
      word: "rocket",
      maskedWord: "______"
    });
  });

  it("returns mode='guesser' (no word) when the viewer is not the drawer", () => {
    const state = getRoundViewState(makeRoom(), "p-bob");
    expect(state).toEqual({
      mode: "guesser",
      roundNumber: 1,
      drawerName: "Alice",
      maskedWord: "______"
    });
  });

  it("treats a missing secretWord as guesser mode even if the viewer id matches the drawer", () => {
    // Defensive: if the server (for any reason) didn't include secretWord, the UI must not render
    // an empty cleartext panel — it should fall back to guesser mode.
    const state = getRoundViewState(makeRoom(), "p-alice");
    expect(state.mode).toBe("guesser");
  });

  it("treats null viewerParticipantId as guesser mode", () => {
    const state = getRoundViewState(makeRoom(), null);
    expect(state.mode).toBe("guesser");
  });
});

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

describe("<RoundView /> rendering", () => {
  it("renders the round banner with the drawer's name for both modes", () => {
    const room = makeRoom({
      round: {
        roundNumber: 1,
        drawerParticipantId: "p-alice",
        maskedWord: "______",
        secretWord: "rocket",
        guesses: [],
        scores: { "p-alice": 0, "p-bob": 0 },
        lockedParticipantIds: []
      }
    });
    render(createElement(RoundView, { room, viewerParticipantId: "p-alice" }));
    expect(container.textContent).toContain("Round 1");
    expect(container.textContent).toContain("Alice is drawing");
  });

  it("shows the cleartext word ONLY in drawer mode and the mask alongside", () => {
    const room = makeRoom({
      round: {
        roundNumber: 1,
        drawerParticipantId: "p-alice",
        maskedWord: "______",
        secretWord: "rocket",
        guesses: [],
        scores: { "p-alice": 0, "p-bob": 0 },
        lockedParticipantIds: []
      }
    });
    render(createElement(RoundView, { room, viewerParticipantId: "p-alice" }));
    const wordEl = container.querySelector('[data-testid="drawer-word"]');
    expect(wordEl?.textContent).toBe("ROCKET");
    expect(container.textContent).toContain("Your word");
  });

  it("renders only the mask for a guesser and does NOT contain the cleartext word", () => {
    render(createElement(RoundView, { room: makeRoom(), viewerParticipantId: "p-bob" }));
    const maskEl = container.querySelector('[data-testid="guesser-mask"]');
    expect(maskEl).not.toBeNull();
    expect(container.textContent).not.toContain("rocket");
    expect(container.textContent).not.toContain("ROCKET");
    expect(container.querySelector('[data-testid="drawer-word"]')).toBeNull();
  });

  it("renders nothing when room.round is null", () => {
    render(
      createElement(RoundView, {
        room: makeRoom({ round: null, status: "lobby" }),
        viewerParticipantId: "p-alice"
      })
    );
    expect(container.textContent ?? "").toBe("");
  });
});
