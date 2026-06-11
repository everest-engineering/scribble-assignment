import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, type StrokeData } from "../components/Canvas";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { FinalStandings } from "../components/FinalStandings";
import { LeaveButton } from "../components/LeaveButton";
import { RoleBadge } from "../components/RoleBadge";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { WordDisplay } from "../components/WordDisplay";
import { useRoomState, useRoomStore } from "../state/roomStore";
import { api } from "../services/api";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, canvasStrokes, localStrokes } = useRoomState();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    roomStore.startPolling();
    roomStore.startCanvasPolling();

    return () => {
      roomStore.stopPolling();
      roomStore.stopCanvasPolling();
    };
  }, [navigate, room, roomStore]);

  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby");
    }
  }, [navigate, room?.status]);

  useEffect(() => {
    if (room?.status === "round_end" || room?.status === "game_over") {
      roomStore.stopCanvasPolling();
    }
  }, [room?.status, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = viewer?.role === "drawer";
  const isHost = viewer?.id === room.hostId;
  const drawer = room.participants.find((p) => p.role === "drawer");

  const handleStrokeComplete = useCallback(async (stroke: StrokeData) => {
    if (!participantId) return;
    roomStore.addLocalStroke(stroke);
    try {
      await api.submitDraw(room!.code, participantId, stroke.color, stroke.points);
    } catch {
      // stroke submission failed — local stroke already rendered optimistically
    }
  }, [participantId, roomStore]);

  const handleClear = useCallback(async () => {
    if (!participantId) return;
    roomStore.clearLocalStrokes();
    try {
      await api.clearCanvas(room!.code, participantId);
    } catch {
      // clear failed — local clear already applied
    }
  }, [participantId, roomStore]);

  const handleReturnToLobby = useCallback(async () => {
    setActionError(null);
    try {
      await roomStore.returnToLobby();
    } catch {
      setActionError("Failed to return to lobby. Please try again.");
    }
  }, [roomStore]);

  const allStrokes = isDrawer
    ? [...canvasStrokes, ...localStrokes]
    : canvasStrokes;

  const isRoundOver = room.status === "round_end" || room.status === "game_over";

  if (room.status === "game_over") {
    return (
      <section className="panel game-page">
        <div className="game-page__header">
          <div className="game-page__header-left">
            <span className="section-kicker">Game Complete</span>
            <h1 className="game-page__title">Final Standings</h1>
          </div>
          <RoomCodeBadge code={room.code} />
        </div>

        <div className="game-page__layout">
          <aside className="game-page__sidebar game-page__sidebar--left">
            <Scoreboard scores={room.scores} participants={room.participants} />
          </aside>

          <div className="game-page__main">
            <FinalStandings
              finalStandings={room.finalStandings ?? []}
              participants={room.participants}
            />
            <Card title="The Word Was">
              <div className="word-display">
                <span className="word-display__word" style={{ fontSize: "2rem" }}>{room.secretWord}</span>
              </div>
            </Card>
            <Canvas readOnly strokes={allStrokes} />
          </div>

          <aside className="game-page__sidebar game-page__sidebar--right">
            <Card title="Player Info">
              <dl className="detail-list">
                <div>
                  <dt>Name</dt>
                  <dd>{viewer?.name ?? "Unknown player"}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd><RoleBadge role={viewer?.role} /></dd>
                </div>
              </dl>
            </Card>
          </aside>
        </div>

        <div className="button-row">
          <LeaveButton />
          <button className="button button--secondary" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </section>
    );
  }

  if (isRoundOver) {
    return (
      <section className="panel game-page">
        <div className="game-page__header">
          <div className="game-page__header-left">
            <span className="section-kicker">Round Over</span>
            <h1 className="game-page__title">Results</h1>
          </div>
          <RoomCodeBadge code={room.code} />
        </div>

        <div className="game-page__layout">
          <aside className="game-page__sidebar game-page__sidebar--left">
            <Scoreboard scores={room.scores} participants={room.participants} />
            <ResultPanel
              guessLog={room.guessLog}
              participants={room.participants}
              roundResult={room.roundResult}
              isHost={isHost}
              isPlaying={false}
            />
          </aside>

          <div className="game-page__main">
            <Card title="The Word Was">
              <div className="word-display">
                <span className="word-display__word" style={{ fontSize: "2rem" }}>{room.secretWord}</span>
              </div>
            </Card>
            <Canvas readOnly strokes={allStrokes} />
          </div>

          <aside className="game-page__sidebar game-page__sidebar--right">
            <Card title="Player Info">
              <dl className="detail-list">
                <div>
                  <dt>Name</dt>
                  <dd>{viewer?.name ?? "Unknown player"}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd><RoleBadge role={viewer?.role} /></dd>
                </div>
              </dl>
            </Card>

            {actionError && (
              <p style={{ color: "red", fontSize: "0.875rem", marginTop: "8px" }}>{actionError}</p>
            )}

            {isHost ? (
              <div className="button-row">
                <button className="button button--primary" onClick={handleReturnToLobby}>
                  Back to Lobby
                </button>
              </div>
            ) : (
              <div className="waiting-message">
                <p>Waiting for host to return to lobby...</p>
              </div>
            )}
          </aside>
        </div>

        <div className="button-row">
          <LeaveButton />
          <button className="button button--secondary" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">{room.roundCounter ? `Round ${room.roundCounter}` : "Round 1"}</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard scores={room.scores} participants={room.participants} />
          <ResultPanel guessLog={room.guessLog} participants={room.participants} isPlaying={true} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <WordDisplay secretWord={room.secretWord} />
            {isDrawer ? (
              <Canvas
                strokes={allStrokes}
                onStrokeComplete={handleStrokeComplete}
                onClear={handleClear}
              />
            ) : (
              <Canvas readOnly strokes={allStrokes} />
            )}
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd><RoleBadge role={viewer?.role} /></dd>
              </div>
            </dl>
          </Card>

          {!isDrawer && (
            <Card title="Your Guess">
              <GuessForm />
            </Card>
          )}

          {isHost && (
            <div className="button-row">
              <button className="button button--danger" onClick={() => roomStore.endRound()}>
                End Round
              </button>
            </div>
          )}
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
