import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../services/api";
import { RoomStoreProvider, useRoomStore } from "./roomStore";
import { LOBBY_POLL_INTERVAL_MS, useLobbyPolling } from "./useLobbyPolling";

// React's act() requires this flag to silence the "not configured" warning under Vitest.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function PollingProbe({ code }: { code: string | null }) {
  useLobbyPolling(code);
  return null;
}

function StoreSeed({ children }: { children?: ReactNode }) {
  const store = useRoomStore();
  store.setRoomSnapshot({
    code: "ABCD",
    status: "lobby",
    hostParticipantId: "p1",
    participants: [],
    currentRound: null,
    guesses: [],
    availableWords: [],
    roles: []
  });
  return createElement("div", null, children);
}

describe("useLobbyPolling", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    vi.spyOn(api, "fetchRoom").mockResolvedValue({
      room: {
        code: "ABCD",
        status: "lobby",
        hostParticipantId: "p1",
        participants: [],
        currentRound: null,
        guesses: [],
        availableWords: [],
        roles: []
      }
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("issues an immediate fetch on mount and then one per LOBBY_POLL_INTERVAL_MS", async () => {
    act(() => {
      root.render(
        createElement(
          RoomStoreProvider,
          null,
          createElement(StoreSeed, null, createElement(PollingProbe, { code: "ABCD" }))
        )
      );
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(api.fetchRoom).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(LOBBY_POLL_INTERVAL_MS);
      await Promise.resolve();
    });
    expect(api.fetchRoom).toHaveBeenCalledTimes(2);

    await act(async () => {
      vi.advanceTimersByTime(LOBBY_POLL_INTERVAL_MS);
      await Promise.resolve();
    });
    expect(api.fetchRoom).toHaveBeenCalledTimes(3);
  });

  it("stops issuing fetches after unmount", async () => {
    act(() => {
      root.render(
        createElement(
          RoomStoreProvider,
          null,
          createElement(StoreSeed, null, createElement(PollingProbe, { code: "ABCD" }))
        )
      );
    });

    await act(async () => {
      await Promise.resolve();
    });
    const initialCalls = vi.mocked(api.fetchRoom).mock.calls.length;

    act(() => {
      root.unmount();
    });

    await act(async () => {
      vi.advanceTimersByTime(LOBBY_POLL_INTERVAL_MS * 5);
      await Promise.resolve();
    });

    expect(vi.mocked(api.fetchRoom).mock.calls.length).toBe(initialCalls);
  });

  it("does not start polling when roomCode is null", async () => {
    act(() => {
      root.render(
        createElement(RoomStoreProvider, null, createElement(PollingProbe, { code: null }))
      );
    });

    await act(async () => {
      vi.advanceTimersByTime(LOBBY_POLL_INTERVAL_MS * 3);
      await Promise.resolve();
    });

    expect(api.fetchRoom).not.toHaveBeenCalled();
  });
});
