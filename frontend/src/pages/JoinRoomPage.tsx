import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useRoomStore } from "../state/roomStore";

export function JoinRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();
  const roomStore = useRoomStore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = playerName.trim();
    const trimmedCode = roomCode.trim().toUpperCase();

    setNameError(null);
    setCodeError(null);
    setApiError(null);

    let hasError = false;
    if (!trimmedName) {
      setNameError("Player name is required");
      hasError = true;
    }
    if (!trimmedCode) {
      setCodeError("Room code is required");
      hasError = true;
    } else if (!/^[A-Za-z0-9]+$/.test(trimmedCode)) {
      setCodeError("Room code must contain only letters and numbers");
      hasError = true;
    }
    if (hasError) return;

    try {
      await roomStore.joinRoom(trimmedCode, trimmedName);
      navigate("/lobby");
    } catch (caughtError) {
      setApiError(caughtError instanceof Error ? caughtError.message : "Unable to join room");
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
          />
        </label>
        {nameError ? <p className="form__error">{nameError}</p> : null}

        <label className="form__field">
          <span>Room code</span>
          <input
            className="form__input form__input--code"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            placeholder="ABCD"
          />
        </label>
        {codeError ? <p className="form__error">{codeError}</p> : null}

        {apiError ? <p className="form__error">{apiError}</p> : null}

        <div className="button-row">
          <button className="button button--primary" type="submit">
            Join Lobby
          </button>
          <button className="button button--secondary" type="button" onClick={() => navigate("/")}>
            Back
          </button>
        </div>
      </form>
    </section>
  );
}
