import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GuessHistory } from "./GuessHistory";

describe("GuessHistory", () => {
  it("shows empty state when no guesses", () => {
    render(<GuessHistory guesses={[]} />);

    expect(screen.getByText(/no guesses yet/i)).toBeInTheDocument();
  });

  it("renders guess entries with name, text, and correct badge", () => {
    const guesses = [
      { participantId: "p1", participantName: "Alice", guess: "rocket", correct: true, timestamp: "2024-01-01", roundScoreAfter: 100, cumulativeScoreAfter: 100 },
      { participantId: "p2", participantName: "Bob", guess: "planet", correct: false, timestamp: "2024-01-01", roundScoreAfter: 0, cumulativeScoreAfter: 0 },
    ];

    render(<GuessHistory guesses={guesses} />);

    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/rocket/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getByText(/planet/)).toBeInTheDocument();

    const badges = screen.getAllByText(/correct|wrong/i);
    expect(badges.length).toBe(2);
  });
});
