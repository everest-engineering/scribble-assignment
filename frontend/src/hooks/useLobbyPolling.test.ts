import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/api", async () => {
  const actual = await vi.importActual<typeof import("../services/api")>("../services/api");
  return {
    ...actual,
    api: {
      createRoom: vi.fn(),
      joinRoom: vi.fn(),
      fetchRoom: vi.fn(),
      startRoom: vi.fn()
    }
  };
});

import { api } from "../services/api";
import { RoomStoreProvider } from "../state/roomStore";
import { useLobbyPolling } from "./useLobbyPolling";

const mockedFetchRoom = vi.mocked(api.fetchRoom);

interface HarnessProps {
  code: string | null;
  participantId: string | null;
  intervalMs?: number;
}

function HookHarness({ code, participantId, intervalMs }: HarnessProps) {
  useLobbyPolling(code, participantId, intervalMs);
  return null;
}

let container: HTMLDivElement;
let root: Root;

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

function freshShellSnapshot(code: string) {
  return {
    room: {
      code,
      status: "lobby" as const,
      participants: [],
      hostParticipantId: "",
      viewerIsHost: false,
      canStart: false,
      availableWords: [],
      roles: [],
      round: null
    }
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  window.sessionStorage.clear();
  // Seed the room store so its `fetchRoom` has a code to query.
  window.sessionStorage.setItem("scribble.roomCode", "ABCD");
  window.sessionStorage.setItem("scribble.participantId", "p1");

  mockedFetchRoom.mockReset();
  mockedFetchRoom.mockResolvedValue(freshShellSnapshot("ABCD"));

  setVisibility("visible");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  if (container.parentNode) container.parentNode.removeChild(container);
  vi.useRealTimers();
  window.sessionStorage.clear();
});

function mount(props: HarnessProps) {
  act(() => {
    root.render(
      createElement(
        RoomStoreProvider,
        null,
        createElement(HookHarness, props)
      )
    );
  });
}

describe("useLobbyPolling", () => {
  it("fetches immediately on mount and then on every interval tick while visible", async () => {
    mount({ code: "ABCD", participantId: "p1", intervalMs: 2000 });
    expect(mockedFetchRoom).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(mockedFetchRoom).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(mockedFetchRoom).toHaveBeenCalledTimes(3);
  });

  it("pauses while hidden and resumes with an immediate fetch when visible again", async () => {
    mount({ code: "ABCD", participantId: "p1", intervalMs: 2000 });
    expect(mockedFetchRoom).toHaveBeenCalledTimes(1);

    act(() => setVisibility("hidden"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(mockedFetchRoom).toHaveBeenCalledTimes(1);

    act(() => setVisibility("visible"));
    expect(mockedFetchRoom).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(mockedFetchRoom).toHaveBeenCalledTimes(3);
  });

  it("does not fetch when code or participantId is missing", () => {
    mount({ code: null, participantId: "p1" });
    expect(mockedFetchRoom).not.toHaveBeenCalled();
  });

  it("clears the interval on unmount", async () => {
    mount({ code: "ABCD", participantId: "p1", intervalMs: 2000 });
    expect(mockedFetchRoom).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(mockedFetchRoom).toHaveBeenCalledTimes(1);
  });
});
