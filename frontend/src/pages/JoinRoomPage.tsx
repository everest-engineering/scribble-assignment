import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function JoinRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { isLoading } = useRoomState();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setValidationError("Display name is required");
      return;
    }

    const trimmedCode = roomCode.trim();
    if (!trimmedCode) {
      setValidationError("Room code is required");
      return;
    }

    setValidationError(null);

    try {
      await roomStore.joinRoom(trimmedCode.toUpperCase(), trimmedName);
      navigate("/lobby");
    } catch (caughtError) {
      setValidationError(caughtError instanceof Error ? caughtError.message : "Unable to join room");
    }
  }

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
            disabled={isLoading}
          />
        </label>

        <label className="form__field">
          <span>Room code</span>
          <input
            className="form__input form__input--code"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            placeholder="ABCD"
            disabled={isLoading}
          />
        </label>
        {validationError ? <p className="form__error">{validationError}</p> : null}
        <div className="button-row">
          <button className="button button--primary" type="submit" disabled={isLoading}>
            {isLoading ? "Joining..." : "Join Lobby"}
          </button>
          <button className="button button--secondary" type="button" onClick={() => navigate("/")} disabled={isLoading}>
            Back
          </button>
        </div>
      </form>
    </section>
  );
}
