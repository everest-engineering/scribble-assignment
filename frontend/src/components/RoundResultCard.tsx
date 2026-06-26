import type { RoundResult } from "../services/api";
import { Card } from "./Card";

interface RoundResultCardProps {
  result: RoundResult;
}

export function RoundResultCard({ result }: RoundResultCardProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 100
      }}
    >
      <Card title={`Round ${result.roundNumber} Complete!`}>
        <div style={{ padding: "12px 0" }}>
          <p>
            The word was: <strong>{result.secretWord}</strong>
          </p>
          <p>
            Drawer: <strong>{result.drawerName}</strong>
          </p>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: "4px 8px" }}>Player</th>
              <th style={{ textAlign: "right", padding: "4px 8px" }}>Round</th>
              <th style={{ textAlign: "right", padding: "4px 8px" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(result.scores).map(([participantId, score]) => {
              const entry = result.guessHistory.find((g) => g.participantId === participantId);
              return (
                <tr key={participantId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "4px 8px" }}>{entry?.participantName ?? participantId}</td>
                  <td style={{ textAlign: "right", padding: "4px 8px" }}>{score.roundScore}</td>
                  <td style={{ textAlign: "right", padding: "4px 8px" }}>{score.cumulativeScore}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
