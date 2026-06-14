import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { ResultView } from "../components/ResultView";
import { RoundView } from "../components/RoundView";
import { useLobbyPolling } from "../hooks/useLobbyPolling";
import type { RoomSnapshot } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

export interface StartButtonState {
  visible: boolean;
  disabled: boolean;
}

export function getStartButtonState(
  room: Pick<RoomSnapshot, "viewerIsHost" | "canStart" | "participants"> & {
    round?: RoomSnapshot["round"];
  }
): StartButtonState {
  if (!room.viewerIsHost) return { visible: false, disabled: true };
  // Hide the Start button once a round is active — there's nothing else to start.
  if (room.round) return { visible: false, disabled: true };
  return { visible: true, disabled: !room.canStart };
}

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading, roomMissing } = useRoomState();
  const [startError, setStartError] = useState<string | null>(null);

  useLobbyPolling(room?.code ?? null, participantId);

  if (roomMissing) {
    return (
      <section className="panel placeholder-page">
        <PageHeader
          kicker="Lobby"
          title="Room no longer available"
          description="The room you were in is no longer active."
        />
        <div className="button-row">
          <button className="button button--primary" onClick={() => navigate("/")}>
            Back to start
          </button>
        </div>
      </section>
    );
  }

  if (!room) {
    return (
      <section className="panel placeholder-page">
        <PageHeader kicker="Lobby" title="No room yet" description="Create or join a room first." />
        <div className="button-row">
          <button className="button button--primary" onClick={() => navigate("/")}>
            Back to start
          </button>
        </div>
      </section>
    );
  }

  // Shell room (rehydrated from sessionStorage but no participants yet) — wait for first poll.
  const isShell = room.participants.length === 0 && room.hostParticipantId === "";

  const startButton = getStartButtonState(room);

  async function handleStart() {
    try {
      setStartError(null);
      await roomStore.startRoom();
      // Gameplay route is out of scope for this feature; remain in the lobby.
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start the game");
    }
  }

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Waiting for players"
          title="Lobby"
          description="Share the room code with friends so they can join your game."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="Participants">
          {isShell ? (
            <p>Loading lobby…</p>
          ) : room.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>
                    {participant.name}
                    {participant.isHost ? (
                      <span className="player-list__badge" style={{ marginLeft: 8, fontSize: "0.75em", padding: "2px 6px", borderRadius: 4, background: "#3730a3", color: "#fff" }}>
                        HOST
                      </span>
                    ) : null}
                    {participant.isDrawer ? (
                      <span className="player-list__badge" style={{ marginLeft: 8, fontSize: "0.75em", padding: "2px 6px", borderRadius: 4, background: "#15803d", color: "#fff" }}>
                        DRAWER
                      </span>
                    ) : null}
                  </span>
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title={
            room.status === "result" ? "Result" : room.round ? "Round" : "Status"
          }
        >
          {room.status === "result" ? (
            <ResultView
              room={room}
              viewerParticipantId={participantId}
              onRestart={() => roomStore.restartRoom()}
            />
          ) : room.round ? (
            <RoundView
              room={room}
              viewerParticipantId={participantId}
              onGuessSubmit={(text) => roomStore.submitGuess(text)}
              guessError={error}
              onEndRound={
                room.viewerIsHost ? () => roomStore.endRound() : undefined
              }
            />
          ) : (
            <>
              <p
                className="status-line"
                style={{
                  backgroundColor: isLoading ? "#fef3c7" : "#e0e7ff",
                  color: isLoading ? "#b45309" : "#3730a3"
                }}
              >
                {isLoading ? "Working…" : "Polling lobby every ~2s"}
              </p>
              <p style={{ marginTop: 8 }}>
                {startError ?? error ?? "Waiting for the host to start the game."}
              </p>
            </>
          )}
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" type="button" onClick={() => navigate("/")}>
          Leave lobby
        </button>
        {startButton.visible ? (
          <button
            className="button button--primary"
            type="button"
            disabled={startButton.disabled || isLoading}
            onClick={handleStart}
          >
            Start Game
          </button>
        ) : null}
      </div>
    </section>
  );
}
