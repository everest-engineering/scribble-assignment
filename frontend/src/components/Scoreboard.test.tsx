import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RoomSnapshot } from "../services/api";
import { ScoreboardView } from "./Scoreboard";

const room: RoomSnapshot = {
  code: "ABCD",
  status: "active",
  hostParticipantId: "p1",
  viewerParticipantId: "p2",
  viewerRole: "guesser",
  drawerParticipantId: "p1",
  participants: [
    { id: "p1", name: "Alice", joinedAt: "now", isHost: true, role: "drawer", score: 0 },
    { id: "p2", name: "Bob", joinedAt: "now", isHost: false, role: "guesser", score: 100 }
  ],
  drawing: { strokes: [] },
  guesses: [],
  scores: { p1: 0, p2: 100 },
  canStart: false,
  canRestart: false,
  availableWords: ["rocket"],
  roles: ["drawer", "guesser"]
};

describe("ScoreboardView", () => {
  it("renders participant scores", () => {
    const html = renderToStaticMarkup(<ScoreboardView room={room} />);

    expect(html).toContain("Bob");
    expect(html).toContain("100");
    expect(html).toContain("Alice");
  });
});
