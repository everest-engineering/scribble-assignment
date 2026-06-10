import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Scoreboard } from "./Scoreboard";

afterEach(cleanup);

function makeParticipant(id: string, name: string) {
  return { id, name, joinedAt: new Date().toISOString() };
}

describe("Scoreboard", () => {
  it("shows waiting message when no participants", () => {
    render(<Scoreboard participants={[]} />);
    expect(screen.getByText("Waiting for players...")).toBeDefined();
  });

  it("renders participant names and scores", () => {
    const participants = [makeParticipant("p1", "Alice"), makeParticipant("p2", "Bob")];
    const scores = { p1: 100, p2: 0 };

    render(<Scoreboard participants={participants} scores={scores} />);
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("100")).toBeDefined();
  });

  it("marks the drawer with a badge", () => {
    const participants = [makeParticipant("p1", "Alice"), makeParticipant("p2", "Bob")];
    render(<Scoreboard participants={participants} drawerParticipantId="p1" />);
    expect(screen.getByText("(drawer)")).toBeDefined();
  });

  it("shows 0 for participants without scores", () => {
    const participants = [makeParticipant("p1", "Alice")];
    render(<Scoreboard participants={participants} scores={{}} />);
    const scores = screen.getAllByText("0");
    expect(scores).toHaveLength(1);
  });
});
