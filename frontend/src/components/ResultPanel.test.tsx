import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResultPanel } from "./ResultPanel";

afterEach(cleanup);

function makeParticipant(id: string, name: string) {
  return { id, name, joinedAt: new Date().toISOString() };
}

function makeGuess(participantId: string, text: string, isCorrect: boolean) {
  return { participantId, text, isCorrect, timestamp: new Date().toISOString() };
}

describe("ResultPanel", () => {
  const participants = [makeParticipant("p1", "Alice"), makeParticipant("p2", "Bob")];

  it("shows placeholder when no guesses and not revealed", () => {
    render(<ResultPanel guesses={[]} participants={participants} />);
    expect(screen.getByText("Game activity and guesses will appear here.")).toBeDefined();
  });

  it("shows 'No guesses were submitted' when revealed with no guesses", () => {
    render(<ResultPanel guesses={[]} participants={participants} revealed />);
    expect(screen.getByText("No guesses were submitted.")).toBeDefined();
  });

  it("shows revealed word when round is complete", () => {
    render(
      <ResultPanel
        guesses={[]}
        participants={participants}
        revealed
        secretWord="pizza"
      />
    );
    expect(screen.getByText(/The word was:/)).toBeDefined();
    const words = screen.getAllByText("pizza");
    expect(words.length).toBeGreaterThanOrEqual(1);
  });

  it("renders guess history with correct and incorrect indicators", () => {
    const guesses = [
      makeGuess("p1", "rocket", false),
      makeGuess("p2", "pizza", true),
    ];

    render(<ResultPanel guesses={guesses} participants={participants} />);

    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("rocket")).toBeDefined();
    const pizzas = screen.getAllByText("pizza");
    expect(pizzas.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("✓ Correct")).toBeDefined();
    expect(screen.getByText("✗ Wrong")).toBeDefined();
  });

  it("shows 'Unknown' for participants not in the list", () => {
    const guesses = [makeGuess("unknown_id", "hello", false)];
    render(<ResultPanel guesses={guesses} participants={participants} />);
    expect(screen.getByText("Unknown")).toBeDefined();
  });
});
