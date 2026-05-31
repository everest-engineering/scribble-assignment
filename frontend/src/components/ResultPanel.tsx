import { Card } from "./Card";
import type { Guess } from "../services/api";

interface ResultPanelProps {
  guesses: Guess[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  return (
    <Card title="Guesses">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            No guesses yet.
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {guesses.map((g, i) => (
            <li
              key={i}
              style={{
                padding: "4px 8px",
                backgroundColor: g.isCorrect ? "#d1fae5" : "#f9fafb",
                borderRadius: "4px",
                marginBottom: "4px",
                fontSize: "0.875rem",
              }}
            >
              <span>{g.text}</span>
              {g.isCorrect ? (
                <span style={{ color: "#059669", fontWeight: "bold", marginLeft: "8px" }}>
                  ✓ Correct!
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
