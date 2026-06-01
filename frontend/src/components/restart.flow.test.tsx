import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";

describe("Restart flow (frontend)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("verifies fetchRoom is called and navigates to lobby when returning", async () => {
    const mockRoom = { code: "ABCD", status: "lobby", participants: [] };

    const fetchRoom = vi.fn(async () => Promise.resolve());
    vi.doMock("../state/roomStore", () => ({
      useRoomState: () => ({ room: mockRoom, participantId: "p1" }),
      useRoomStore: () => ({ fetchRoom })
    }));

    const mockSummary = {
      lastRoundSummary: { word: "apple", finalScores: [] }
    };
    vi.doMock("../services/api", () => ({
      api: { getLastRoundSummary: async () => mockSummary }
    }));

    const navigate = vi.fn();
    vi.doMock("react-router-dom", () => ({ useNavigate: () => navigate }));

    const { default: ResultsPage } = await import("./ResultsPage");

    await act(async () => {
      render(React.createElement(ResultsPage));
    });

    const btn = await screen.findByText("Return to Lobby");
    await act(async () => {
      btn.click();
    });

    expect(fetchRoom).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/lobby");
  });
});
