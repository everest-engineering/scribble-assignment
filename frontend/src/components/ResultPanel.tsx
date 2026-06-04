import { Card } from "./Card";
import type { SnapshotGuessRecord } from "../services/api";

interface ResultPanelProps {
  guesses: SnapshotGuessRecord[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  const correctCount = guesses.filter((g) => g.correct).length;
  return (
    <Card title="Activity">
      <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
        {guesses.length} guess{guesses.length === 1 ? "" : "es"} so far, {correctCount} correct
      </p>
    </Card>
  );
}
