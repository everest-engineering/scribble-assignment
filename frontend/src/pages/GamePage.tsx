import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "../components/Canvas";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const drawer = room.participants.find((p) => p.id === room.drawerId) ?? null;
  const isDrawer = viewer?.id === room.drawerId;
  const isHost = viewer?.id === room.hostId;

  const isPlaying = room.status === "playing";
  const isRoundEnd = room.status === "round_end";
  const isGameOver = room.status === "game_over";
  const showCanvas = isPlaying || isRoundEnd;
  const showGuessForm = isPlaying && !isDrawer;

  const correctGuess = room.guesses.find((g) => g.isCorrect) ?? null;
  const correctGuesser = correctGuess
    ? room.participants.find((p) => p.id === correctGuess.participantId) ?? null
    : null;

  const handleGuess = useCallback(async (text: string) => {
    await roomStore.submitGuess(text);
  }, [roomStore]);

  const handleDrawingChange = useCallback(async (drawing: number[][][]) => {
    await roomStore.saveDrawing(drawing);
  }, [roomStore]);

  const handleNextRound = useCallback(async () => {
    await roomStore.nextRound();
  }, [roomStore]);

  const handleRestart = useCallback(async () => {
    await roomStore.restartGame();
    navigate("/lobby", { replace: true });
  }, [roomStore, navigate]);

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.currentRound || 1}</span>
          <h1 className="game-page__title">
            {isGameOver ? "Game Over!" : isRoundEnd ? "Round Over!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} />
          <ResultPanel guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          {showCanvas ? (
            <Card title="Canvas">
              <Canvas
                drawing={room.drawing}
                onDrawingChange={isDrawer && isPlaying ? handleDrawingChange : undefined}
                readOnly={!isDrawer || !isPlaying}
              />
            </Card>
          ) : null}

          {(isRoundEnd || isGameOver) && room.secretWord ? (
            <Card title="Secret Word Revealed">
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", textAlign: "center", color: "#059669" }}>
                {room.secretWord}
              </p>
            </Card>
          ) : null}

          {isRoundEnd && correctGuess ? (
            <Card title="Correct Guess">
              <p style={{ textAlign: "center", fontSize: "1.1rem" }}>
                <strong>{correctGuesser?.name ?? "Someone"}</strong> guessed the word correctly!
              </p>
            </Card>
          ) : null}
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
              <div>
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
            </dl>
          </Card>

          {isDrawer && room.secretWord && isPlaying ? (
            <Card title="Secret Word">
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", textAlign: "center", color: "#059669" }}>
                {room.secretWord}
              </p>
            </Card>
          ) : null}

          {showGuessForm ? (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuess} />
            </Card>
          ) : null}
        </aside>
      </div>

      <div className="button-row">
        {isRoundEnd && isHost ? (
          <button className="button button--primary" onClick={handleNextRound}>
            Next Round
          </button>
        ) : null}

        {isGameOver && isHost ? (
          <button className="button button--primary" onClick={handleRestart}>
            Restart Game
          </button>
        ) : null}

        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
