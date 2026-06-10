import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useRoomStore, useRoomState } from "../state/roomStore";

export function JoinRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const roomStore = useRoomStore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!roomCode.trim()) {
      setError("Room code is required");
      return;
    }

    if (roomCode.length !== 4 || !/^[A-Z0-9]+$/.test(roomCode)) {
      setError("Room code must be 4 characters");
      return;
    }

    try {
      setError(null);
      await roomStore.joinRoom(roomCode.toUpperCase(), playerName);
      navigate("/lobby");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to join room";
      if (message.includes("already taken")) {
        setError("That name is taken, please choose another");
      } else if (message.includes("Room not found")) {
        setError("Room not found — check the code and try again");
      } else {
        setError(message);
      }
    }
  }

  const { isLoading } = useRoomState();

  return (
    <section className="panel panel--narrow placeholder-page">
      <PageHeader
        kicker="Existing lobby"
        title="Join Room"
        description="Enter your player name and the room code to join an existing lobby."
      />
      <form className="form" onSubmit={handleSubmit}>
        <label className="form__field">
          <span>Player name</span>
          <input
            className="form__input"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Second pencil"
          />
        </label>

        <label className="form__field">
          <span>Room code</span>
          <input
            className="form__input form__input--code"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            placeholder="ABCD"
          />
        </label>
        {error ? <p className="form__error">{error}</p> : null}
        <div className="button-row">
          <button className="button button--primary" type="submit" disabled={isLoading}>
            {isLoading ? "Joining..." : "Join Lobby"}
          </button>
          <button className="button button--secondary" type="button" onClick={() => navigate("/")}>
            Back
          </button>
        </div>
      </form>
    </section>
  );
}
