import type { Guess, Participant } from "../services/api";
import { Card } from "./Card";
import { GuessHistory } from "./GuessHistory";

interface ResultPanelProps {
  guesses: Guess[];
  participants: Participant[];
}

export function ResultPanel({ guesses, participants }: ResultPanelProps) {
  return (
    <Card title="Activity">
      <GuessHistory guesses={guesses} participants={participants} />
    </Card>
  );
}
