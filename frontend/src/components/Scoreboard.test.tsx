import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Scoreboard } from "./Scoreboard";
import type { ParticipantSnapshot } from "shared/schemas/index.js";

afterEach(cleanup);

const participants: ParticipantSnapshot[] = [
  { id: "p1", name: "Alice", joinedAt: "2026-01-01T00:00:00Z" },
  { id: "p2", name: "Bob", joinedAt: "2026-01-01T00:00:01Z" }
];

// T033: Scoreboard renders participant names with their scores
describe("Scoreboard", () => {
  it("renders each participant's name", () => {
    render(
      <Scoreboard
        participants={participants}
        scores={{ p1: 100, p2: 0 }}
      />
    );
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  it("renders each participant's score", () => {
    render(
      <Scoreboard
        participants={participants}
        scores={{ p1: 100, p2: 0 }}
      />
    );
    expect(screen.getByText("100")).toBeTruthy();
    // Both 0 scores render — just check at least one exists
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(1);
  });

  it("renders 0 for a participant with no entry in scores", () => {
    render(
      <Scoreboard
        participants={participants}
        scores={{}}
      />
    );
    expect(screen.getAllByText("0").length).toBe(2);
  });
});
