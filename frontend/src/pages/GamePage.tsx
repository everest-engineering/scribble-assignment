import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
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
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby");
    }
  }, [navigate, room?.status]);

  useEffect(() => {
    if (!room) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      roomStore.fetchRoom().catch(() => undefined);
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [room, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;
  const isHost = participantId === room.hostId;
  const isDrawer = participantId === room.drawerId;
  const canGuess = room.status === "playing" && !isDrawer;

  async function handleGuess(guess: string) {
    await roomStore.submitGuess(guess);
  }

  async function handleRestart() {
    const restartedRoom = await roomStore.restartGame();
    if (restartedRoom?.status === "lobby") {
      navigate("/lobby");
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">{room.status === "results" ? "Round Results" : "Guess the Word!"}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard scores={room.scores} />
          <ResultPanel guesses={room.guesses} result={room.result} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <div className="word-banner">
              <span>{drawer ? `${drawer.name} is drawing` : "Waiting for drawer"}</span>
              <strong>{room.secretWord ? room.secretWord : isDrawer ? "Loading word..." : "Secret word hidden"}</strong>
            </div>
            <DrawingCanvas
              drawing={room.drawing}
              canDraw={room.status === "playing" && isDrawer}
              onChange={async (drawing) => {
                await roomStore.updateDrawing(drawing);
              }}
              onClear={async () => {
                await roomStore.clearDrawing();
              }}
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
                <dt>Status</dt>
                <dd>{room.status}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={!canGuess} onSubmit={handleGuess} />
          </Card>
          {room.status === "results" ? (
            <Card title="Restart">
              <p>{isHost ? "Restart returns everyone to the lobby." : "Waiting for the host to restart."}</p>
              <button className="button button--primary" type="button" disabled={!isHost} onClick={handleRestart}>
                Restart Game
              </button>
            </Card>
          ) : null}
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
