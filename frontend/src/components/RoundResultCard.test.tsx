import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoundResultCard } from "./RoundResultCard";

describe("RoundResultCard", () => {
  it("shows round number and secret word", () => {
    const result = {
      roundNumber: 1,
      secretWord: "rocket",
      drawerId: "p1",
      drawerName: "Alice",
      guessHistory: [],
      scores: { p1: { roundScore: 0, cumulativeScore: 0 } }
    };

    render(<RoundResultCard result={result} />);

    expect(screen.getByText(/round 1 complete/i)).toBeInTheDocument();
    expect(screen.getByText(/rocket/)).toBeInTheDocument();
  });

  it("displays scores for participants", () => {
    const result = {
      roundNumber: 1,
      secretWord: "rocket",
      drawerId: "p1",
      drawerName: "Alice",
      guessHistory: [
        { participantId: "p2", participantName: "Bob", guess: "rocket", correct: true, timestamp: "2024-01-01", roundScoreAfter: 100, cumulativeScoreAfter: 100 }
      ],
      scores: { p1: { roundScore: 0, cumulativeScore: 0 }, p2: { roundScore: 100, cumulativeScore: 100 } }
    };

    render(<RoundResultCard result={result} />);

    const hundreds = screen.getAllByText("100");
    expect(hundreds.length).toBeGreaterThanOrEqual(1);
  });
});
