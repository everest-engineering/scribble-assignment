import { useCallback, useEffect, useRef } from "react";
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
  const hasNavigatedLobby = useRef(false);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    roomStore.startPolling();
    return () => {
      roomStore.stopPolling();
    };
  }, [navigate, room, roomStore]);

  useEffect(() => {
    if (room?.status === "lobby" && !hasNavigatedLobby.current) {
      hasNavigatedLobby.current = true;
      navigate("/lobby");
    }
  }, [navigate, room?.status]);

  const handleDrawingChange = useCallback(
    async (strokes: Parameters<typeof roomStore.updateDrawing>[0]) => {
      await roomStore.updateDrawing(strokes);
    },
    [roomStore]
  );

  const handleClear = useCallback(async () => {
    await roomStore.clearDrawing();
  }, [roomStore]);

  const handleGuessSubmit = useCallback(
    async (value: string) => {
      await roomStore.submitGuess(value);
    },
    [roomStore]
  );

  const handleRestart = useCallback(async () => {
    await roomStore.restartGame();
    hasNavigatedLobby.current = true;
    navigate("/lobby");
  }, [navigate, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const viewerIsHost = viewer?.isHost ?? false;
  const isDrawer = room.round?.drawerPlayerId === participantId;
  const drawerName = room.participants.find((p) => p.id === room.round?.drawerPlayerId)?.name ?? "Unknown";
  const winnerName = room.participants.find((p) => p.id === room.round?.winnerPlayerId)?.name ?? null;
  const isResult = room.status === "result";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">
            {isResult ? "Round Over!" : isDrawer ? "Draw the Word!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} />
          <ResultPanel guesses={room.round?.guesses ?? []} />
        </aside>

        <div className="game-page__main">
          {isResult ? (
            <Card title="Round Result">
              <div className="result-details">
                <p>
                  The word was: <strong className="secret-word">{room.round?.secretWord ?? "???"}</strong>
                </p>
                {winnerName ? <p>Winner: <strong>{winnerName}</strong></p> : null}
              </div>
            </Card>
          ) : isDrawer && room.round?.secretWord ? (
            <Card title="Your Word">
              <div className="secret-word-display">
                <p className="secret-word">{room.round.secretWord}</p>
              </div>
            </Card>
          ) : null}
          <Card title="Canvas">
            <Canvas
              strokes={room.round?.drawing ?? []}
              isDrawer={isDrawer && !isResult}
              onStrokesChange={handleDrawingChange}
            />
          </Card>
          {isDrawer && !isResult ? (
            <div className="button-row">
              <button className="button button--secondary" onClick={handleClear}>
                Clear Canvas
              </button>
            </div>
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
                <dd>{drawerName}</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer && !isResult ? (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuessSubmit} />
            </Card>
          ) : null}
        </aside>
      </div>

      <div className="button-row">
        {isResult && viewerIsHost ? (
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
