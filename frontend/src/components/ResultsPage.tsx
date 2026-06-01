import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "./Card";
import { api, type RoundSummary } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

export default function ResultsPage() {
  const navigate = useNavigate();
  const { room } = useRoomState();
  const store = useRoomStore();
  const [summary, setSummary] = useState<RoundSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!room) return;
      setLoading(true);
      try {
        const res = await api.getLastRoundSummary(room.code);
        if (mounted) setSummary(res.lastRoundSummary);
      } catch (e) {
        // log and show friendly error
        // eslint-disable-next-line no-console
        console.error("Failed to load last round summary", e);
        if (mounted)
          setError(
            "Could not load round results. You can still return to the lobby."
          );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [room?.code]);

  if (!room) return null;

  return (
    <section className="panel results-page">
      <div className="results-page__header">
        <h1>Round Results</h1>
      </div>

      <div className="results-page__content">
        <Card title="Summary">
          {loading && <div>Loading…</div>}
          {!loading && summary && (
            <div>
              <div>
                <strong>Word:</strong> {summary.word ?? "(hidden)"}
              </div>
              <div style={{ marginTop: 8 }}>
                <strong>Final Scores</strong>
                <ul>
                  {(summary.finalScores ?? []).map((s) => (
                    <li key={s.participantId}>
                      {s.participantId}: {s.score ?? 0}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ marginTop: 8 }}>
                <strong>Guesses</strong>
                <ul>
                  {(summary.guesses ?? []).map((g) => (
                    <li key={g.timestamp}>{g.textTrimmed}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {!loading && !summary && <div>No results available.</div>}
          {error && (
            <div role="alert" style={{ color: "#b00020", marginTop: 8 }}>
              {error}
            </div>
          )}
        </Card>

        <div className="button-row" style={{ marginTop: 12 }}>
          <button
            className="button button--primary"
            onClick={async () => {
              // verify last-round-summary then navigate to lobby
              try {
                if (room) await api.getLastRoundSummary(room.code);
              } catch (e) {
                // log and show error but still navigate
                // eslint-disable-next-line no-console
                console.error("Verification of last-round-summary failed", e);
                setError(
                  "Network error while verifying results — returning to lobby."
                );
              }
              // refresh snapshot if possible
              if (typeof (store as any).fetchRoom === "function") {
                try {
                  await (store as any).fetchRoom();
                } catch (e) {
                  // ignore
                }
              }
              navigate("/lobby");
            }}
          >
            Return to Lobby
          </button>
        </div>
      </div>
    </section>
  );
}
