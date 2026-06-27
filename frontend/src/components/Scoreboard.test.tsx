import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import type { RoomSnapshot } from "../services/api";
import { RoomStoreProvider, useRoomStore } from "../state/roomStore";
import { Scoreboard } from "./Scoreboard";

function StoreInitializer({ room, participantId }: { room: RoomSnapshot; participantId: string }) {
  const store = useRoomStore();
  useEffect(() => {
    store.setRoomSession({ participantId, room });
  }, [store, room, participantId]);
  return null;
}

describe("Scoreboard", () => {
  it("shows waiting state when no room", () => {
    render(
      <RoomStoreProvider>
        <Scoreboard />
      </RoomStoreProvider>
    );

    expect(screen.getByText(/waiting for players/i)).toBeInTheDocument();
  });

  it("displays player names and scores", () => {
    const room: RoomSnapshot = {
      code: "ABCD",
      status: "playing",
      hostId: "p1",
      participants: [
        { id: "p1", name: "Alice", joinedAt: "2024-01-01", lastSeenAt: "2024-01-01T00:00:00Z" },
        { id: "p2", name: "Bob", joinedAt: "2024-01-01", lastSeenAt: "2024-01-01T00:00:00Z" }
      ],
      availableWords: [],
      roles: ["drawer", "guesser"],
      currentRound: 1,
      drawerId: "p1",
      strokes: [],
      guessHistory: [],
      scores: { p1: { roundScore: 0, cumulativeScore: 0 }, p2: { roundScore: 100, cumulativeScore: 200 } }
    };

    render(
      <RoomStoreProvider>
        <StoreInitializer room={room} participantId="p1" />
        <Scoreboard />
      </RoomStoreProvider>
    );

    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });
});
