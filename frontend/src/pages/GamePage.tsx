import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "../components/Canvas";
import { Card } from "../components/Card";
import { DrawerDisconnectedBanner } from "../components/DrawerDisconnectedBanner";
import { GuessForm } from "../components/GuessForm";
import { GuessHistory } from "../components/GuessHistory";
import { HostDisconnectedBanner } from "../components/HostDisconnectedBanner";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { RoundResultCard } from "../components/RoundResultCard";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, lastRoundResult } = useRoomState();

  useEffect(() => {
    if (room) return;
    roomStore.restoreSession().then((restoredRoom) => {
      if (!restoredRoom) {
        roomStore.clearSession();
        navigate("/", { replace: true });
      }
    });
  }, [navigate, room, roomStore]);

  useEffect(() => {
    if (!room) return;
    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
      return;
    }
    if (room.status === "finished") {
      roomStore.startPolling();
      return () => roomStore.stopPolling();
    }
    roomStore.startPolling();
    return () => roomStore.stopPolling();
  }, [navigate, room, roomStore]);

  const handleExit = useCallback(() => {
    roomStore.leaveRoom().finally(() => {
      navigate("/lobby");
    });
  }, [navigate, roomStore]);

  if (!room || !participantId) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isHost = room.hostId === participantId;
  const isDrawer = room.drawerId === participantId;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;

  return (
    <section className="panel game-page">
      {lastRoundResult && room.status === "finished" ? (
        <RoundResultCard
          result={lastRoundResult}
          participants={room.participants}
          onExit={handleExit}
        />
      ) : lastRoundResult ? (
        <RoundResultCard
          result={lastRoundResult}
          participants={room.participants}
          onContinue={() => roomStore.dismissLastRoundResult()}
          onRestart={isHost ? () => roomStore.restartGame() : undefined}
          onExit={handleExit}
        />
      ) : null}

      {room.status !== "finished" && room.hostDisconnected && participantId !== room.hostId ? (
        <HostDisconnectedBanner onClaimHost={() => roomStore.claimHost()} />
      ) : room.status !== "finished" && room.drawerDisconnected && participantId !== room.hostId ? (
        <DrawerDisconnectedBanner onNotifyHost={() => roomStore.suggestSkip()} />
      ) : null}

      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.currentRound ?? 1}</span>
          <h1 className="game-page__title">
            {isDrawer ? "Draw the Word!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <GuessHistory guesses={room.guessHistory} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <Canvas
              isDrawer={isDrawer}
              strokes={room.strokes}
              secretWord={room.secretWord}
              onAddStrokes={(strokes) => roomStore.addStrokes(strokes)}
              onClearCanvas={() => roomStore.clearCanvas()}
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
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Playing</dd>
              </div>
            </dl>
          </Card>

          {isDrawer ? null : (
            <Card title="Your Guess">
              <GuessForm onSubmitGuess={(guess) => roomStore.submitGuess(guess)} />
            </Card>
          )}
        </aside>
      </div>

      <div className="button-row">
        {isHost && room.status === "playing" && (
          <button
            className={`button button--secondary${room.skipSuggested ? " button--pulse" : ""}`}
            onClick={() => roomStore.skipRound()}
          >
            Skip Round{room.skipSuggested ? " (!)" : ""}
          </button>
        )}
        <button className="button button--secondary" onClick={handleExit}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
