import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { RoomStoreProvider, useRoomStore } from "../../state/roomStore";
import { GamePage } from "../GamePage";
import type { RoomSnapshot } from "../../services/api";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

function makeParticipant(id: string, name: string) {
  return { id, name, joinedAt: new Date().toISOString() };
}

function makeGuess(participantId: string, text: string, isCorrect: boolean) {
  return { participantId, text, isCorrect, timestamp: new Date().toISOString() };
}

function makeRoomSnapshot(overrides: Partial<RoomSnapshot> & { status: RoomSnapshot["status"] }): RoomSnapshot {
  return {
    code: "ABCD",
    status: overrides.status,
    participants: overrides.participants ?? [makeParticipant("p1", "Alice")],
    availableWords: ["rocket", "pizza", "castle", "guitar", "sunflower"],
    roles: ["drawer", "guesser"],
    hostParticipantId: overrides.hostParticipantId ?? "p1",
    viewerIsHost: overrides.viewerIsHost,
    currentRound: overrides.currentRound,
    canvasState: { strokes: [] },
  };
}

function TestInit({
  participantId,
  room,
}: {
  participantId: string;
  room: RoomSnapshot;
}) {
  const store = useRoomStore();

  React.useEffect(() => {
    store.setRoomSession({ participantId, room });
  }, [store, participantId, room]);

  return null;
}

function renderGamePage(participantId: string, room: RoomSnapshot) {
  return render(
    <MemoryRouter initialEntries={["/game"]}>
      <RoomStoreProvider>
        <TestInit participantId={participantId} room={room} />
        <GamePage />
      </RoomStoreProvider>
    </MemoryRouter>,
  );
}

function stubFetch(room: RoomSnapshot) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ room }),
  }));
}

describe("GamePage - Playing state", () => {
  beforeEach(() => {
    vi.stubGlobal("setInterval", () => 123);
    vi.stubGlobal("clearInterval", vi.fn());
  });

  it("shows canvas and guess form for guesser in playing state", async () => {
    const room = makeRoomSnapshot({
      status: "playing",
      participants: [makeParticipant("p1", "Alice"), makeParticipant("p2", "Bob")],
      currentRound: {
        roundNumber: 1,
        drawerParticipantId: "p1",
        secretWord: null,
        scores: { p1: 0, p2: 0 },
        guesses: [],
        isComplete: false,
      },
      hostParticipantId: "p1",
    });
    stubFetch(room);

    await act(async () => {
      renderGamePage("p2", room);
    });

    expect(document.querySelector("canvas")).toBeTruthy();
    expect(screen.getByPlaceholderText("Type your guess here...")).toBeDefined();
    expect(screen.getByText("Submit Guess")).toBeDefined();
  });

  it("shows secret word and editable canvas for drawer in playing state", async () => {
    const room = makeRoomSnapshot({
      status: "playing",
      participants: [makeParticipant("p1", "Alice"), makeParticipant("p2", "Bob")],
      currentRound: {
        roundNumber: 1,
        drawerParticipantId: "p1",
        secretWord: "pizza",
        scores: { p1: 0, p2: 0 },
        guesses: [],
        isComplete: false,
      },
      hostParticipantId: "p1",
    });
    stubFetch(room);

    await act(async () => {
      renderGamePage("p1", room);
    });

    expect(document.querySelector("canvas")).toBeTruthy();
    expect(screen.getByText("pizza")).toBeDefined();
    expect(screen.getByText("Your word:")).toBeDefined();
    expect(screen.getByText("Drawer")).toBeDefined();
  });

  it("shows disabled guess form for guesser who already guessed correctly", async () => {
    const guess = makeGuess("p2", "pizza", true);

    const room = makeRoomSnapshot({
      status: "playing",
      participants: [makeParticipant("p1", "Alice"), makeParticipant("p2", "Bob")],
      currentRound: {
        roundNumber: 1,
        drawerParticipantId: "p1",
        secretWord: null,
        scores: { p1: 0, p2: 100 },
        guesses: [guess],
        isComplete: false,
      },
      hostParticipantId: "p1",
    });
    stubFetch(room);

    await act(async () => {
      renderGamePage("p2", room);
    });

    expect(screen.getByText("You already guessed correctly!")).toBeDefined();
    expect(screen.getByPlaceholderText("Type your guess here...")).toBeDisabled();
  });

  it("shows guesser label for guesser", async () => {
    const room = makeRoomSnapshot({
      status: "playing",
      participants: [makeParticipant("p1", "Alice"), makeParticipant("p2", "Bob")],
      currentRound: {
        roundNumber: 1,
        drawerParticipantId: "p1",
        secretWord: null,
        scores: { p1: 0, p2: 0 },
        guesses: [],
        isComplete: false,
      },
      hostParticipantId: "p1",
    });
    stubFetch(room);

    await act(async () => {
      renderGamePage("p2", room);
    });

    expect(screen.getByText("Guesser")).toBeDefined();
  });

  it("shows scoreboard with drawer badge", async () => {
    const room = makeRoomSnapshot({
      status: "playing",
      participants: [makeParticipant("p1", "Alice"), makeParticipant("p2", "Bob")],
      currentRound: {
        roundNumber: 1,
        drawerParticipantId: "p1",
        secretWord: null,
        scores: { p1: 0, p2: 0 },
        guesses: [],
        isComplete: false,
      },
      hostParticipantId: "p1",
    });
    stubFetch(room);

    await act(async () => {
      renderGamePage("p2", room);
    });

    expect(screen.getByText("(drawer)")).toBeDefined();
  });

  it("displays round number", async () => {
    const room = makeRoomSnapshot({
      status: "playing",
      participants: [makeParticipant("p1", "Alice"), makeParticipant("p2", "Bob")],
      currentRound: {
        roundNumber: 1,
        drawerParticipantId: "p1",
        secretWord: null,
        scores: { p1: 0, p2: 0 },
        guesses: [],
        isComplete: false,
      },
      hostParticipantId: "p1",
    });
    stubFetch(room);

    await act(async () => {
      renderGamePage("p2", room);
    });

    expect(screen.getByText("Round 1")).toBeDefined();
  });

  it("shows exit button for drawer", async () => {
    const room = makeRoomSnapshot({
      status: "playing",
      participants: [makeParticipant("p1", "Alice"), makeParticipant("p2", "Bob")],
      currentRound: {
        roundNumber: 1,
        drawerParticipantId: "p1",
        secretWord: "pizza",
        scores: { p1: 0, p2: 0 },
        guesses: [],
        isComplete: false,
      },
      hostParticipantId: "p1",
    });
    stubFetch(room);

    await act(async () => {
      renderGamePage("p1", room);
    });

    expect(screen.getByText("Exit Game")).toBeDefined();
  });
});

describe("GamePage - Result state", () => {
  beforeEach(() => {
    vi.stubGlobal("setInterval", () => 123);
    vi.stubGlobal("clearInterval", vi.fn());
  });

  it("shows result panel and restart button for host in result state", async () => {
    const guess = makeGuess("p2", "pizza", true);

    const room = makeRoomSnapshot({
      status: "result",
      participants: [makeParticipant("p1", "Alice"), makeParticipant("p2", "Bob")],
      currentRound: {
        roundNumber: 1,
        drawerParticipantId: "p1",
        secretWord: "pizza",
        scores: { p1: 0, p2: 100 },
        guesses: [guess],
        isComplete: true,
      },
      hostParticipantId: "p1",
    });
    stubFetch(room);

    await act(async () => {
      renderGamePage("p1", room);
    });

    expect(screen.getByText("Round Over!")).toBeDefined();
    expect(screen.getByText("Restart Game")).toBeDefined();
    expect(screen.getByText("The word was:")).toBeDefined();
    expect(screen.getAllByText("pizza").length).toBeGreaterThanOrEqual(1);
  });

  it("shows result panel and waiting message for non-host in result state", async () => {
    const guess = makeGuess("p2", "pizza", true);

    const room = makeRoomSnapshot({
      status: "result",
      participants: [makeParticipant("p1", "Alice"), makeParticipant("p2", "Bob")],
      currentRound: {
        roundNumber: 1,
        drawerParticipantId: "p1",
        secretWord: "pizza",
        scores: { p1: 0, p2: 100 },
        guesses: [guess],
        isComplete: true,
      },
      hostParticipantId: "p1",
    });
    stubFetch(room);

    await act(async () => {
      renderGamePage("p2", room);
    });

    expect(screen.getByText("Round Over!")).toBeDefined();
    expect(screen.queryByText("Restart Game")).toBeNull();
    expect(screen.getByText("Waiting for the host to restart...")).toBeDefined();
  });
});
