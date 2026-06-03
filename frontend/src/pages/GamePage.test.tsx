import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { RoomSnapshot } from "../services/api";
import { GamePageView } from "./GamePage";

const activeRoom: RoomSnapshot = {
  code: "ABCD",
  status: "active",
  hostParticipantId: "p1",
  viewerParticipantId: "p1",
  viewerRole: "drawer",
  drawerParticipantId: "p1",
  participants: [
    { id: "p1", name: "Alice", joinedAt: "now", isHost: true, role: "drawer", score: 0 },
    { id: "p2", name: "Bob", joinedAt: "now", isHost: false, role: "guesser", score: 0 }
  ],
  drawing: { strokes: [] },
  guesses: [],
  scores: { p1: 0, p2: 0 },
  secretWord: "rocket",
  canStart: false,
  canRestart: false,
  availableWords: ["rocket"],
  roles: ["drawer", "guesser"]
};

describe("GamePageView", () => {
  it("shows the drawer role and secret word to the drawer", () => {
    const html = renderToStaticMarkup(
      <GamePageView room={activeRoom} participantId="p1" onExit={vi.fn()} />
    );

    expect(html).toContain("Draw the Word");
    expect(html).toContain("Drawer");
    expect(html).toContain("Alice");
    expect(html).toContain("rocket");
  });

  it("hides the secret word from guessers while showing the drawer identity", () => {
    const guesserRoom: RoomSnapshot = {
      ...activeRoom,
      viewerParticipantId: "p2",
      viewerRole: "guesser",
      secretWord: undefined
    };
    const html = renderToStaticMarkup(
      <GamePageView room={guesserRoom} participantId="p2" onExit={vi.fn()} />
    );

    expect(html).toContain("Guess the Word!");
    expect(html).toContain("Guesser");
    expect(html).toContain("Alice");
    expect(html).toContain("Hidden from guessers");
    expect(html).not.toContain("rocket");
  });
});
