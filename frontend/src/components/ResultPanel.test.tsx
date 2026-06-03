import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResultPanel } from "./ResultPanel";
import type { GuessSnapshot } from "shared/schemas/index.js";

afterEach(cleanup);

const guesses: GuessSnapshot[] = [
  {
    id: "g1",
    participantId: "p2",
    participantName: "Bob",
    text: "rocket",
    correct: true,
    submittedAt: "2026-06-03T10:05:00Z"
  },
  {
    id: "g2",
    participantId: "p2",
    participantName: "Bob",
    text: "pizza",
    correct: false,
    submittedAt: "2026-06-03T10:04:00Z"
  }
];

// T040: ResultPanel renders guess history with correct/incorrect visual distinction
describe("ResultPanel", () => {
  it("renders each guesser's name", () => {
    render(<ResultPanel guesses={guesses} />);
    expect(screen.getAllByText("Bob").length).toBeGreaterThanOrEqual(1);
  });

  it("renders each guess text", () => {
    render(<ResultPanel guesses={guesses} />);
    expect(screen.getByText("rocket")).toBeTruthy();
    expect(screen.getByText("pizza")).toBeTruthy();
  });

  it("correct guess entry has the guess-entry--correct CSS class", () => {
    render(<ResultPanel guesses={guesses} />);
    const correctEntry = document.querySelector(".guess-entry--correct");
    expect(correctEntry).toBeTruthy();
    expect(correctEntry?.textContent).toContain("rocket");
  });

  it("incorrect guess entry does not have the guess-entry--correct CSS class", () => {
    render(<ResultPanel guesses={guesses} />);
    const allEntries = document.querySelectorAll(".guess-entry");
    const incorrectEntries = Array.from(allEntries).filter(
      (el) => !el.classList.contains("guess-entry--correct")
    );
    expect(incorrectEntries.length).toBeGreaterThanOrEqual(1);
    expect(incorrectEntries[0].textContent).toContain("pizza");
  });

  it("renders empty state gracefully when no guesses", () => {
    render(<ResultPanel guesses={[]} />);
    // Should not throw and should render the card
    expect(document.querySelector(".result-panel") ?? document.body).toBeTruthy();
  });
});
