import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RoomSnapshot } from "../services/api";
import { ResultPanelView } from "./ResultPanel";

const room: RoomSnapshot = {
  code: "ABCD",
  status: "active",
  hostParticipantId: "p1",
  viewerParticipantId: "p2",
  viewerRole: "guesser",
  drawerParticipantId: "p1",
  participants: [
    { id: "p1", name: "Alice", joinedAt: "now", isHost: true, role: "drawer", score: 0 },
    { id: "p2", name: "Bob", joinedAt: "now", isHost: false, role: "guesser", score: 0 }
  ],
  drawing: { strokes: [] },
  guesses: [{ id: "g1", participantId: "p2", participantName: "Bob", text: "comet", isCorrect: false, scoreDelta: 0, createdAt: "now" }],
  scores: { p1: 0, p2: 0 },
  canStart: false,
  canRestart: false,
  availableWords: ["rocket"],
  roles: ["drawer", "guesser"]
};

describe("ResultPanelView", () => {
  it("renders shared guess history", () => {
    const html = renderToStaticMarkup(<ResultPanelView room={room} />);

    expect(html).toContain("Bob");
    expect(html).toContain("comet");
    expect(html).toContain("0");
  });
});
