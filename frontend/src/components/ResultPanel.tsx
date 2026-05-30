import { Card } from "./Card";
import { GuessHistory } from "./GuessHistory";
import type { Guess } from "../services/api";

interface ResultPanelProps {
  guesses: Guess[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  return (
    <Card title="Activity">
      <GuessHistory guesses={guesses} />
    </Card>
  );
}
