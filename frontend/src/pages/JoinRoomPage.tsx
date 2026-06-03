import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function JoinRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { isLoading, error } = useRoomState();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let hasError = false;

    if (playerName.trim().length === 0) {
      setNameError("Name cannot be empty.");
      hasError = true;
    }

    if (roomCode.trim().length === 0) {
      setCodeError("Room code is required");
      hasError = true;
    }

    if (hasError) return;

    setNameError(null);
    setCodeError(null);

    try {
      await roomStore.joinRoom(roomCode.toUpperCase(), playerName.trim());
      navigate("/lobby");
    } catch {
      // error displayed from store state
    }
  }

  return (
    <section className="panel panel--narrow">
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
            onChange={(event) => {
              setPlayerName(event.target.value);
              setNameError(null);
            }}
            placeholder="Second pencil"
            disabled={isLoading}
          />
        </label>
        {nameError ? <p className="form__error">{nameError}</p> : null}

        <label className="form__field">
          <span>Room code</span>
          <input
            className="form__input form__input--code"
            value={roomCode}
            onChange={(event) => {
              setRoomCode(event.target.value.toUpperCase());
              setCodeError(null);
            }}
            placeholder="ABCD"
            disabled={isLoading}
          />
        </label>
        {codeError ? <p className="form__error">{codeError}</p> : null}

        {error ? <p className="form__error">{error}</p> : null}

        <div className="button-row">
          <button className="button button--primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner" aria-label="Joining room…" />
                Joining…
              </>
            ) : (
              "Join Lobby"
            )}
          </button>
          <button
            className="button button--secondary"
            type="button"
            disabled={isLoading}
            onClick={() => navigate("/")}
          >
            Back
          </button>
        </div>
      </form>
    </section>
  );
}
