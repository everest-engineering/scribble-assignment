import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RoomSnapshot } from "shared/schemas/index.js";
import { ResultsScreen } from "./ResultsScreen";

afterEach(cleanup);

const HOST_ID = "host-id";
const GUEST_ID = "guest-id";

function makeFinishedRoom(overrides: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return {
    code: "ABCD",
    status: "finished",
    hostId: HOST_ID,
    participants: [
      { id: HOST_ID, name: "Alice", joinedAt: "2026-01-01T00:00:00Z" },
      { id: GUEST_ID, name: "Bob", joinedAt: "2026-01-01T00:00:01Z" }
    ],
    availableWords: [],
    roles: [],
    drawerId: HOST_ID,
    currentWord: "rocket",
    canvasDataUrl: null,
    guesses: [],
    scores: { [HOST_ID]: 50, [GUEST_ID]: 100 },
    roundEndsAt: null,
    hasGuessedCorrectly: true,
    resultExpiresAt: new Date(Date.now() + 30_000).toISOString(),
    ...overrides
  };
}

// T017: ResultsScreen renders the revealed currentWord
describe("ResultsScreen — word reveal (US1)", () => {
  it("renders the correct word prominently", () => {
    render(
      <ResultsScreen
        room={makeFinishedRoom()}
        participantId={GUEST_ID}
        onRestart={vi.fn()}
      />
    );
    expect(screen.getByText(/rocket/i)).toBeTruthy();
  });
});

// T018: ResultsScreen renders each participant's name and score
describe("ResultsScreen — scores (US1)", () => {
  it("renders each participant name and their score", () => {
    render(
      <ResultsScreen
        room={makeFinishedRoom()}
        participantId={GUEST_ID}
        onRestart={vi.fn()}
      />
    );
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(screen.getByText("50")).toBeTruthy();
    expect(screen.getByText("100")).toBeTruthy();
  });
});

// T020: Accessibility — interactive elements have accessible labels
describe("ResultsScreen — accessibility (US1)", () => {
  it("has no interactive elements without accessible names", () => {
    render(
      <ResultsScreen
        room={makeFinishedRoom()}
        participantId={HOST_ID}
        onRestart={vi.fn()}
      />
    );
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      const label = btn.getAttribute("aria-label") ?? btn.textContent ?? "";
      expect(label.trim().length).toBeGreaterThan(0);
    });
  });

  it("countdown region has aria-live attribute", () => {
    render(
      <ResultsScreen
        room={makeFinishedRoom()}
        participantId={GUEST_ID}
        onRestart={vi.fn()}
      />
    );
    const liveRegion = document.querySelector("[aria-live]");
    expect(liveRegion).toBeTruthy();
  });
});

// T024: host-only restart button (US2)
describe("ResultsScreen — restart button (US2)", () => {
  it("shows Return to Lobby button only for the host", () => {
    render(
      <ResultsScreen
        room={makeFinishedRoom()}
        participantId={HOST_ID}
        onRestart={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /return to lobby/i })).toBeTruthy();
  });

  it("does not show Return to Lobby button for non-host", () => {
    render(
      <ResultsScreen
        room={makeFinishedRoom()}
        participantId={GUEST_ID}
        onRestart={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /return to lobby/i })).toBeNull();
  });

  it("calls onRestart when host clicks the button", async () => {
    const onRestart = vi.fn();
    const { getByRole } = render(
      <ResultsScreen
        room={makeFinishedRoom()}
        participantId={HOST_ID}
        onRestart={onRestart}
      />
    );
    getByRole("button", { name: /return to lobby/i }).click();
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});

// T025: countdown display (US2)
describe("ResultsScreen — countdown (US2)", () => {
  it("renders a countdown message when resultExpiresAt is set", () => {
    render(
      <ResultsScreen
        room={makeFinishedRoom()}
        participantId={GUEST_ID}
        onRestart={vi.fn()}
      />
    );
    expect(screen.getByText(/returning to lobby/i)).toBeTruthy();
  });

  it("does not render countdown when resultExpiresAt is null", () => {
    render(
      <ResultsScreen
        room={makeFinishedRoom({ resultExpiresAt: null })}
        participantId={GUEST_ID}
        onRestart={vi.fn()}
      />
    );
    expect(screen.queryByText(/returning to lobby/i)).toBeNull();
  });
});

// T034: guess history rendering (US3)
describe("ResultsScreen — guess history (US3)", () => {
  it("renders guesses in order with participant names", () => {
    render(
      <ResultsScreen
        room={makeFinishedRoom({
          guesses: [
            { id: "g1", participantId: GUEST_ID, participantName: "Bob", text: "pizza", correct: false, submittedAt: "2026-06-03T10:00:00Z" },
            { id: "g2", participantId: GUEST_ID, participantName: "Bob", text: "rocket", correct: true, submittedAt: "2026-06-03T10:00:05Z" }
          ]
        })}
        participantId={GUEST_ID}
        onRestart={vi.fn()}
      />
    );
    expect(screen.getByText("pizza")).toBeTruthy();
    expect(screen.getAllByText("rocket").length).toBeGreaterThanOrEqual(1);
    const guessTexts = document.querySelectorAll(".guess-entry__text");
    expect(guessTexts[0].textContent).toBe("pizza");
    expect(guessTexts[1].textContent).toBe("rocket");
  });

  // T035: empty state message
  it("shows empty state message when no guesses were made", () => {
    render(
      <ResultsScreen
        room={makeFinishedRoom({ guesses: [] })}
        participantId={GUEST_ID}
        onRestart={vi.fn()}
      />
    );
    expect(screen.getByText(/no guesses were made this round/i)).toBeTruthy();
  });

  // T036: correct guess highlighting
  it("applies guess-entry--correct class to correct guesses", () => {
    const { container } = render(
      <ResultsScreen
        room={makeFinishedRoom({
          guesses: [
            { id: "g1", participantId: GUEST_ID, participantName: "Bob", text: "rocket", correct: true, submittedAt: "2026-06-03T10:00:00Z" },
            { id: "g2", participantId: GUEST_ID, participantName: "Bob", text: "pizza", correct: false, submittedAt: "2026-06-03T10:00:01Z" }
          ]
        })}
        participantId={GUEST_ID}
        onRestart={vi.fn()}
      />
    );
    const correctItems = container.querySelectorAll(".guess-entry--correct");
    expect(correctItems).toHaveLength(1);
    expect(correctItems[0].textContent).toContain("rocket");
  });
});
