import type { Participant, RoomSnapshot } from "../services/api";
import { DrawerCanvas } from "./DrawerCanvas";
import { GuessPanel } from "./GuessPanel";

export type RoundViewState =
  | { mode: "lobby" }
  | {
      mode: "drawer";
      roundNumber: number;
      drawerName: string;
      word: string;
      maskedWord: string;
    }
  | {
      mode: "guesser";
      roundNumber: number;
      drawerName: string;
      maskedWord: string;
    };

export function getRoundViewState(
  room: Pick<RoomSnapshot, "round" | "participants">,
  viewerParticipantId: string | null
): RoundViewState {
  if (room.round === null) {
    return { mode: "lobby" };
  }

  const drawer = room.participants.find(
    (p) => p.id === room.round!.drawerParticipantId
  ) as Participant | undefined;
  const drawerName = drawer?.name ?? "the drawer";

  if (
    viewerParticipantId !== null &&
    viewerParticipantId === room.round.drawerParticipantId &&
    typeof room.round.secretWord === "string"
  ) {
    return {
      mode: "drawer",
      roundNumber: room.round.roundNumber,
      drawerName,
      word: room.round.secretWord,
      maskedWord: room.round.maskedWord
    };
  }

  return {
    mode: "guesser",
    roundNumber: room.round.roundNumber,
    drawerName,
    maskedWord: room.round.maskedWord
  };
}

interface RoundViewProps {
  room: RoomSnapshot;
  viewerParticipantId: string | null;
  onGuessSubmit?: (text: string) => Promise<unknown> | unknown;
  guessError?: string | null;
}

function renderMaskTiles(maskedWord: string) {
  return (
    <span className="round-view__mask" aria-label={`Word length ${maskedWord.length}`}>
      {Array.from(maskedWord).map((ch, index) => (
        <span key={index} className="round-view__mask-tile">
          {ch === " " ? "\u00A0\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

export function RoundView({
  room,
  viewerParticipantId,
  onGuessSubmit,
  guessError
}: RoundViewProps) {
  const state = getRoundViewState(room, viewerParticipantId);

  if (state.mode === "lobby") {
    return null;
  }

  const viewerIsDrawer = state.mode === "drawer";

  return (
    <section className="round-view">
      <header className="round-view__header">
        <span className="round-view__round">Round {state.roundNumber}</span>
        <h2 className="round-view__title">
          {state.drawerName} is drawing
        </h2>
      </header>

      {viewerIsDrawer ? (
        <div className="round-view__panel round-view__panel--drawer">
          <p className="round-view__label">Your word</p>
          <p className="round-view__word" data-testid="drawer-word">
            {state.word.toUpperCase()}
          </p>
          <p className="round-view__hint">
            Other players see: {renderMaskTiles(state.maskedWord)}
          </p>
        </div>
      ) : (
        <div className="round-view__panel round-view__panel--guesser">
          <p className="round-view__label">Guess the word</p>
          <p className="round-view__mask-row" data-testid="guesser-mask">
            {renderMaskTiles(state.maskedWord)}
          </p>
        </div>
      )}

      <DrawerCanvas viewerIsDrawer={viewerIsDrawer} />

      <GuessPanel
        room={room}
        viewerParticipantId={viewerParticipantId}
        onSubmit={onGuessSubmit}
        errorMessage={guessError ?? null}
      />
    </section>
  );
}
