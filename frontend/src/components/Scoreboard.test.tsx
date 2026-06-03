import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Participant } from "../services/api";
import { Scoreboard } from "./Scoreboard";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("Scoreboard", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  async function render(props: Parameters<typeof Scoreboard>[0]) {
    await act(async () => {
      root.render(createElement(Scoreboard, props));
      await Promise.resolve();
    });
  }

  it("renders each participant with their score and tags the drawer", async () => {
    const participants: Participant[] = [
      { id: "alice-id", name: "Alice", joinedAt: "t", score: 0 },
      { id: "bob-id", name: "Bob", joinedAt: "t", score: 100 },
      { id: "carol-id", name: "Carol", joinedAt: "t", score: 0 }
    ];

    await render({ participants, drawerParticipantId: "alice-id" });

    const items = Array.from(container.querySelectorAll(".player-list li"));
    expect(items).toHaveLength(3);

    expect(items[0].textContent).toContain("Alice");
    expect(items[0].textContent).toContain("Drawer");
    expect(items[0].textContent).toContain("0");

    expect(items[1].textContent).toContain("Bob");
    expect(items[1].textContent).not.toContain("Drawer");
    expect(items[1].textContent).toContain("100");

    expect(items[2].textContent).toContain("Carol");
    expect(items[2].textContent).not.toContain("Drawer");
    expect(items[2].textContent).toContain("0");
  });

  it("renders a placeholder when participants is empty", async () => {
    await render({ participants: [] });

    expect(container.textContent).toContain("Waiting for players");
    expect(container.querySelector(".player-list")).toBeNull();
  });
});
