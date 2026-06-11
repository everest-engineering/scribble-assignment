import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { GuessPanel, isGuessSubmittable, MAX_GUESS_LENGTH } from "./GuessPanel";
import type { GuessView, RoomSnapshot } from "../services/api";

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

// FR-008 — pure helper
describe("isGuessSubmittable", () => {
  it.each([
    ["", false],
    ["   ", false],
    ["a", true],
    ["rocket", true],
    ["x".repeat(MAX_GUESS_LENGTH), true],
    ["x".repeat(MAX_GUESS_LENGTH + 1), false]
  ] as const)("isGuessSubmittable(%j) === %s", (input, expected) => {
    expect(isGuessSubmittable(input)).toBe(expected);
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

// React tracks <input>.value via an internal value tracker; setting `.value`
// directly bypasses it, so `onChange` doesn't fire. The standard workaround is
// to use the native prototype setter to update both the DOM value AND the
// tracker before dispatching the input event.
function setReactInputValue(input: HTMLInputElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;
  nativeSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

// FR-006 + FR-008 (US1) + FR-005 (US2)
describe("<GuessPanel /> rendering", () => {
  it("renders the scoreboard with every participant's score for any viewer", () => {
    const room = makeRoom({
      round: {
        roundNumber: 1,
        drawerParticipantId: "p-alice",
        maskedWord: "______",
        guesses: [],
        scores: { "p-alice": 0, "p-bob": 100 },
        lockedParticipantIds: ["p-bob"]
      }
    });
    render(createElement(GuessPanel, { room, viewerParticipantId: "p-alice" }));
    expect(container.querySelector('[data-testid="score-p-alice"]')?.textContent).toContain("0");
    expect(container.querySelector('[data-testid="score-p-bob"]')?.textContent).toContain("100");
  });

  it("DOES NOT render a guess input for the drawer viewer", () => {
    render(createElement(GuessPanel, { room: makeRoom(), viewerParticipantId: "p-alice" }));
    expect(container.querySelector('[data-testid="guess-input"]')).toBeNull();
    expect(container.querySelector('[data-testid="guess-submit"]')).toBeNull();
  });

  it("renders the input + submit button for a non-drawer, non-locked viewer", () => {
    render(createElement(GuessPanel, { room: makeRoom(), viewerParticipantId: "p-bob" }));
    expect(container.querySelector('[data-testid="guess-input"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="guess-submit"]')).not.toBeNull();
  });

  it("disables submit on empty / whitespace / >50-char input; enables otherwise", () => {
    render(createElement(GuessPanel, { room: makeRoom(), viewerParticipantId: "p-bob" }));
    const input = container.querySelector('[data-testid="guess-input"]') as HTMLInputElement;
    const button = container.querySelector('[data-testid="guess-submit"]') as HTMLButtonElement;

    expect(button.disabled).toBe(true); // empty by default

    act(() => setReactInputValue(input, "rocket"));
    expect(button.disabled).toBe(false);

    act(() => setReactInputValue(input, "x".repeat(51)));
    expect(button.disabled).toBe(true);

    act(() => setReactInputValue(input, "   "));
    expect(button.disabled).toBe(true);
  });

  it("calls onSubmit with the typed text and clears the input on a successful submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      createElement(GuessPanel, {
        room: makeRoom(),
        viewerParticipantId: "p-bob",
        onSubmit
      })
    );
    const input = container.querySelector('[data-testid="guess-input"]') as HTMLInputElement;
    const form = container.querySelector("form") as HTMLFormElement;

    act(() => setReactInputValue(input, "Rocket"));

    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(onSubmit).toHaveBeenCalledWith("Rocket");
    expect(
      (container.querySelector('[data-testid="guess-input"]') as HTMLInputElement).value
    ).toBe("");
  });

  it("renders the chronological feed with displayName / text / verdict per entry", () => {
    const guesses: GuessView[] = [
      makeGuess({ id: "g1", text: "cat", isCorrect: false }),
      makeGuess({ id: "g2", text: "rocket", isCorrect: true })
    ];
    const room = makeRoom({
      round: {
        roundNumber: 1,
        drawerParticipantId: "p-alice",
        maskedWord: "______",
        guesses,
        scores: { "p-alice": 0, "p-bob": 100 },
        lockedParticipantIds: ["p-bob"]
      }
    });
    render(createElement(GuessPanel, { room, viewerParticipantId: "p-alice" }));
    const feedText = container.querySelector('[data-testid="guess-feed"]')?.textContent ?? "";
    expect(feedText).toContain("cat");
    expect(feedText).toContain("Wrong");
    expect(feedText).toContain("rocket");
    expect(feedText).toContain("Correct");

    // chronological order: cat (g1) appears before rocket (g2)
    const items = container.querySelectorAll('[data-testid="guess-feed"] li');
    expect(items[0].getAttribute("data-testid")).toBe("guess-g1");
    expect(items[1].getAttribute("data-testid")).toBe("guess-g2");
  });

  it("replaces the input with a lockout line when the viewer is in lockedParticipantIds", () => {
    const room = makeRoom({
      round: {
        roundNumber: 1,
        drawerParticipantId: "p-alice",
        maskedWord: "______",
        guesses: [],
        scores: { "p-alice": 0, "p-bob": 100 },
        lockedParticipantIds: ["p-bob"]
      }
    });
    render(createElement(GuessPanel, { room, viewerParticipantId: "p-bob" }));
    expect(container.querySelector('[data-testid="guess-input"]')).toBeNull();
    expect(container.querySelector('[data-testid="guess-locked"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="guess-locked"]')?.textContent).toContain(
      "already guessed correctly"
    );
  });

  // FR-005 carry-over leak guard: guesser DOM must not contain the cleartext secret
  // when only wrong guesses are in the feed.
  it("guesser DOM never contains the cleartext secret word when only wrong guesses exist", () => {
    const room = makeRoom({
      round: {
        roundNumber: 1,
        drawerParticipantId: "p-alice",
        maskedWord: "______",
        guesses: [
          makeGuess({ id: "g1", text: "cat", isCorrect: false }),
          makeGuess({ id: "g2", text: "dog", isCorrect: false })
        ],
        scores: { "p-alice": 0, "p-bob": 0 },
        lockedParticipantIds: []
      }
    });
    render(createElement(GuessPanel, { room, viewerParticipantId: "p-bob" }));
    expect(container.textContent ?? "").not.toContain("rocket");
    expect(container.textContent ?? "").not.toContain("ROCKET");
  });
});
