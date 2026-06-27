import type { Participant, RoundResult } from "../services/api";
import { Card } from "./Card";

interface RoundResultCardProps {
  result: RoundResult;
  participants: Participant[];
  onContinue?: () => void;
  onRestart?: () => void;
  onExit?: () => void;
}

export function RoundResultCard({ result, participants, onContinue, onRestart, onExit }: RoundResultCardProps) {
  function resolveName(participantId: string) {
    return participants.find((p) => p.id === participantId)?.name ?? participantId;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 100,
        overflowY: "auto",
        padding: "16px"
      }}
    >
      <div style={{ maxHeight: "90vh", overflowY: "auto" }}>
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
            {Object.entries(result.scores).map(([participantId, score]) => (
              <tr key={participantId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "4px 8px" }}>{resolveName(participantId)}</td>
                <td style={{ textAlign: "right", padding: "4px 8px" }}>{score.roundScore}</td>
                <td style={{ textAlign: "right", padding: "4px 8px" }}>{score.cumulativeScore}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {result.guessHistory.length > 0 && (
          <div style={{ marginTop: "12px" }}>
            <h4 style={{ margin: "0 0 4px", fontSize: "0.875rem" }}>Guess History</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.8rem" }}>
              {result.guessHistory.map((entry, index) => (
                <li
                  key={index}
                  style={{
                    padding: "2px 0",
                    color: entry.correct ? "#16a34a" : "#6b7280"
                  }}
                >
                  <strong>{resolveName(entry.participantId)}</strong>: {entry.guess}
                  {entry.correct ? " ✅" : " ❌"}
                  <span style={{ color: "#9ca3af", marginLeft: "8px" }}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="button-row button-row--spread" style={{ marginTop: "16px" }}>
          <div>
            {onContinue && (
              <button className="button button--primary" onClick={onContinue}>
                Continue
              </button>
            )}
            {onRestart && (
              <button className="button button--secondary" onClick={onRestart} style={{ marginLeft: "8px" }}>
                Restart Game
              </button>
            )}
          </div>
          {onExit && (
            <button className="button button--secondary" onClick={onExit}>
              Exit Game
            </button>
          )}
        </div>
      </Card>
      </div>
    </div>
  );
}
