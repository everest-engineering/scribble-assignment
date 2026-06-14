import { describe, expect, it } from "vitest";
import { getStartButtonState } from "./LobbyPage";

describe("getStartButtonState", () => {
  it("hides the button for non-hosts", () => {
    expect(
      getStartButtonState({ viewerIsHost: false, canStart: false, participants: [] })
    ).toEqual({ visible: false, disabled: true });
  });

  it("shows the button as disabled for the host with fewer than 2 players", () => {
    expect(
      getStartButtonState({
        viewerIsHost: true,
        canStart: false,
        participants: [{ id: "p1", name: "A", joinedAt: "", isHost: true, isDrawer: false }]
      })
    ).toEqual({ visible: true, disabled: true });
  });

  it("shows the button as enabled for the host once canStart is true", () => {
    expect(
      getStartButtonState({
        viewerIsHost: true,
        canStart: true,
        participants: [
          { id: "p1", name: "A", joinedAt: "", isHost: true, isDrawer: false },
          { id: "p2", name: "B", joinedAt: "", isHost: false, isDrawer: false }
        ]
      })
    ).toEqual({ visible: true, disabled: false });
  });
});
