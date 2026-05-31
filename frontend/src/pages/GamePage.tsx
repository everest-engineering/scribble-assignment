import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room || !participantId) {
      navigate("/");
      return;
    }

    if (room.status !== "playing") {
      navigate("/lobby");
      return;
    }

    let cancelled = false;

    async function pollRoom() {
      try {
        await roomStore.fetchRoom();
        if (!cancelled) {
          setError(null);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
        }
      }
    }

    void pollRoom();
    const intervalId = window.setInterval(() => {
      void pollRoom();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [navigate, participantId, room, room?.code, room?.status, roomStore]);

  if (!room || !participantId || room.status !== "playing") {
    return null;
  }

  const drawer = room.participants.find((participant) => participant.id === room.drawerId);
  const isDrawer = participantId === room.drawerId;

  return (
    <section className="panel game-page">
      <PageHeader
        kicker="Round in progress"
        title="Game"
        description="The host draws first. Guessers watch the canvas and scoreboard."
      />

      <div className="game-page__meta">
        <p>
          <strong>Drawer:</strong> {drawer?.name ?? "Unknown"}
          {isDrawer ? " (you)" : ""}
        </p>
        {isDrawer && room.secretWord ? (
          <p className="game-page__secret-word">
            <strong>Your word:</strong> {room.secretWord}
          </p>
        ) : null}
      </div>

      <div className="game-page__layout">
        <div className="game-page__canvas">
          {isDrawer ? (
            <p>Canvas placeholder — you are drawing this round.</p>
          ) : (
            <p>Canvas placeholder — watch the drawer&apos;s sketch.</p>
          )}
        </div>
        <Scoreboard room={room} />
      </div>

      {error ? <p className="form__error">{error}</p> : null}
    </section>
  );
}
