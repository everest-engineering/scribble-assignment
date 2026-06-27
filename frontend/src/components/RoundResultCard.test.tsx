import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoundResultCard } from "./RoundResultCard";
import type { Participant, RoundResult } from "../services/api";

function makeResult(overrides?: Partial<RoundResult>): RoundResult {
  return {
    roundNumber: 1,
    secretWord: "rocket",
    drawerId: "p1",
    drawerName: "Alice",
    guessHistory: [],
    scores: { p1: { roundScore: 0, cumulativeScore: 0 } },
    ...overrides
  };
}

function makeParticipants(): Participant[] {
  return [
    { id: "p1", name: "Alice", joinedAt: "2024-01-01T00:00:00Z", lastSeenAt: "2024-01-01T00:00:00Z" },
    { id: "p2", name: "Bob", joinedAt: "2024-01-01T00:00:00Z", lastSeenAt: "2024-01-01T00:00:00Z" }
  ];
}

describe("RoundResultCard", () => {
  it("shows round number and secret word", () => {
    const result = makeResult();
    const onContinue = vi.fn();

    render(<RoundResultCard result={result} participants={makeParticipants()} onContinue={onContinue} />);

    expect(screen.getByText(/round 1 complete/i)).toBeInTheDocument();
    expect(screen.getByText(/rocket/)).toBeInTheDocument();
  });

  it("displays scores for participants", () => {
    const result = makeResult({
      scores: { p1: { roundScore: 0, cumulativeScore: 0 }, p2: { roundScore: 100, cumulativeScore: 100 } }
    });

    render(<RoundResultCard result={result} participants={makeParticipants()} onContinue={vi.fn()} />);

    const hundreds = screen.getAllByText("100");
    expect(hundreds.length).toBeGreaterThanOrEqual(1);
  });

  it("resolves participant IDs to names from participants prop", () => {
    const result = makeResult({
      scores: { p1: { roundScore: 0, cumulativeScore: 0 }, p2: { roundScore: 100, cumulativeScore: 100 } }
    });

    render(<RoundResultCard result={result} participants={makeParticipants()} onContinue={vi.fn()} />);

    const aliceElements = screen.getAllByText("Alice");
    expect(aliceElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("displays guess history with names resolved from participants", () => {
    const result = makeResult({
      guessHistory: [
        { participantId: "p2", participantName: "Bob", guess: "car", correct: false, timestamp: "2024-01-01T00:00:01Z", roundScoreAfter: 0, cumulativeScoreAfter: 0 },
        { participantId: "p2", participantName: "Bob", guess: "rocket", correct: true, timestamp: "2024-01-01T00:00:02Z", roundScoreAfter: 100, cumulativeScoreAfter: 100 }
      ]
    });

    render(<RoundResultCard result={result} participants={makeParticipants()} onContinue={vi.fn()} />);

    const carElements = screen.getAllByText((content) => content.includes("car"));
    expect(carElements.length).toBeGreaterThanOrEqual(1);
    const rocketElements = screen.getAllByText((content) => content.includes("rocket"));
    expect(rocketElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows Continue button for all players", () => {
    const onContinue = vi.fn();

    render(<RoundResultCard result={makeResult()} participants={makeParticipants()} onContinue={onContinue} />);

    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
  });

  it("hides Restart Game button when onRestart is not provided", () => {
    render(<RoundResultCard result={makeResult()} participants={makeParticipants()} onContinue={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /restart game/i })).not.toBeInTheDocument();
  });

  it("shows Restart Game button when onRestart is provided", () => {
    render(
      <RoundResultCard
        result={makeResult()}
        participants={makeParticipants()}
        onContinue={vi.fn()}
        onRestart={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /restart game/i })).toBeInTheDocument();
  });
});
