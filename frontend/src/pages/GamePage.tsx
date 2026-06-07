import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GameCanvas } from "../components/GameCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  const isDrawer = room !== null && participantId === room.currentDrawerId;
  const isRoundEnd = room !== null && room.status === "roundEnd";
  const isHost = room !== null && participantId === room.hostId;

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    const interval = setInterval(() => {
      roomStore.fetchRoom().catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [roomStore]);

  const handleSubmitGuess = useCallback(async (text: string) => {
    await roomStore.submitGuess(text);
  }, [roomStore]);

  const handleRestart = useCallback(async () => {
    try {
      const response = await roomStore.restartGame();
      if (response) {
        navigate("/lobby");
      }
    } catch {}
  }, [roomStore, navigate]);

  const handleSaveDraw = useCallback(async (strokes: string) => {
    if (!room || !participantId) return;
    try {
      await roomStore.saveDraw?.(strokes);
    } catch {}
  }, [room, participantId]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;

  if (isRoundEnd) {
    return (
      <section className="panel game-page">
        <div className="game-page__header">
          <div className="game-page__header-left">
            <span className="section-kicker">Round Over</span>
            <h1 className="game-page__title">The word was: {room.currentWord ?? "???"}</h1>
          </div>
          <RoomCodeBadge code={room.code} />
        </div>
        <div className="game-page__layout">
          <aside className="game-page__sidebar game-page__sidebar--left">
            <Scoreboard participants={room.participants} scores={room.scores} />
            <ResultPanel guessedWord={room.currentWord} guesses={room.guesses} participants={room.participants} />
          </aside>
          <div className="game-page__main">
            <Card title="Canvas">
              <GameCanvas
                isDrawer={false}
                canvasData={room.canvasData}
                roomCode={room.code}
                participantId={participantId ?? ""}
                onSave={handleSaveDraw}
              />
            </Card>
          </div>
        </div>
        <div className="button-row">
          {isHost && (
            <button className="button button--primary" onClick={handleRestart}>
              Restart Game
            </button>
          )}
          <button className="button button--secondary" onClick={() => navigate("/lobby")}>
            Exit to Lobby
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">{isDrawer ? "Draw the Word!" : "Guess the Word!"}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} scores={room.scores} />
          <ResultPanel guesses={room.guesses} participants={room.participants} />
        </aside>

        <div className="game-page__main">
          {isDrawer && room.currentWord && (
            <Card title="Your Word">
              <p style={{ fontSize: "1.5rem", textAlign: "center", fontWeight: 700 }}>{room.currentWord}</p>
            </Card>
          )}
          <Card title="Canvas">
            <GameCanvas
              isDrawer={isDrawer}
              canvasData={room.canvasData}
              roomCode={room.code}
              participantId={participantId ?? ""}
              onSave={handleSaveDraw}
            />
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
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer && (
            <Card title="Your Guess">
              <GuessForm disabled={isRoundEnd} onSubmitGuess={handleSubmitGuess} />
            </Card>
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
