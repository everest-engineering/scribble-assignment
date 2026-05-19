import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren
} from "react";
import {
  api,
  type GuessEntry,
  type ParticipantRole,
  type RoomStatus,
  type RoomSessionResponse,
  type RoomSnapshot,
  type ScoreEntry
} from "../services/api";

const ROOM_SESSION_STORAGE_KEY = "scribble-room-session";
const ROOM_SESSION_ID_STORAGE_KEY = "scribble-room-session-id";

interface StoredRoomSession {
  participantId: string;
  roomCode: string;
  sessionId: string;
}

export interface GuessHistoryRow extends GuessEntry {
  playerName: string;
}

export interface ScoreRow extends ScoreEntry {
  name: string;
  isDrawer: boolean;
  isWinner: boolean;
  isViewer: boolean;
}

export interface RoomState {
  room: RoomSnapshot | null;
  participantId: string | null;
  error: string | null;
  isLoading: boolean;
  isHydrating: boolean;
  isPolling: boolean;
  isHost: boolean;
  canStart: boolean;
  disabledReason: string | null;
  canRestart: boolean;
  restartDisabledReason: string | null;
  isDrawer: boolean;
  isResult: boolean;
  viewerRoundRole: ParticipantRole | null;
  drawerName: string | null;
  visibleSecretWord: string | null;
  canSubmitGuess: boolean;
  guessHistoryRows: GuessHistoryRow[];
  scoreRows: ScoreRow[];
  winnerName: string | null;
}

type Listener = () => void;

function isActiveGameStatus(status: RoomStatus) {
  return status === "playing" || status === "result";
}

function deriveRoomState(room: RoomSnapshot | null, participantId: string | null) {
  const participantById = new Map(room?.participants.map((participant) => [participant.id, participant]) ?? []);
  const isHost = Boolean(room && participantId && room.hostId === participantId);
  const drawerName =
    room?.drawerId
      ? participantById.get(room.drawerId)?.name ?? null
      : null;
  const viewerRoundRole =
    room && isActiveGameStatus(room.status)
      ? (room.viewerRole ?? (room.drawerId === participantId ? "drawer" : "guesser"))
      : null;
  const isDrawer = viewerRoundRole === "drawer";
  const isResult = room?.status === "result";
  const guessHistoryRows: GuessHistoryRow[] =
    room?.guessHistory?.map((guessEntry) => ({
      ...guessEntry,
      playerName: participantById.get(guessEntry.participantId)?.name ?? "Unknown player"
    })) ?? [];
  const scoreRows: ScoreRow[] =
    room?.scores?.map((scoreEntry) => ({
      ...scoreEntry,
      name: participantById.get(scoreEntry.participantId)?.name ?? "Unknown player",
      isDrawer: room.drawerId === scoreEntry.participantId,
      isWinner: room.winnerId === scoreEntry.participantId,
      isViewer: participantId === scoreEntry.participantId
    })) ?? [];
  const winnerName = room?.winnerId ? participantById.get(room.winnerId)?.name ?? null : null;
  const canSubmitGuess = room?.status === "playing" && viewerRoundRole === "guesser";
  const canRestart = room?.status === "result" && isHost;
  const restartDisabledReason =
    room?.status === "result" && !isHost ? "Only the host can restart the room." : null;

  if (!room || !participantId || room.status !== "lobby") {
    return {
      isHost,
      canStart: false,
      disabledReason: null,
      canRestart,
      restartDisabledReason,
      isDrawer,
      isResult,
      viewerRoundRole,
      drawerName,
      visibleSecretWord:
        room?.status === "result"
          ? room.secretWord ?? null
          : isDrawer
            ? room?.secretWord ?? null
            : null,
      canSubmitGuess,
      guessHistoryRows,
      scoreRows,
      winnerName
    };
  }

  const hasEnoughPlayers = room.participants.length >= 2;
  let disabledReason: string | null = null;

  if (!isHost) {
    disabledReason = "Only the host can start the game.";
  } else if (!hasEnoughPlayers) {
    disabledReason = "At least 2 players are required.";
  }

  return {
    isHost,
    canStart: isHost && hasEnoughPlayers,
    disabledReason,
    canRestart: false,
    restartDisabledReason: null,
    isDrawer: false,
    isResult: false,
    viewerRoundRole: null,
    drawerName: null,
    visibleSecretWord: null,
    canSubmitGuess: false,
    guessHistoryRows: [],
    scoreRows: [],
    winnerName: null
  };
}

class RoomStore {
  private state: RoomState = {
    room: null,
    participantId: null,
    error: null,
    isLoading: false,
    isHydrating: true,
    isPolling: false,
    isHost: false,
    canStart: false,
    disabledReason: null,
    canRestart: false,
    restartDisabledReason: null,
    isDrawer: false,
    isResult: false,
    viewerRoundRole: null,
    drawerName: null,
    visibleSecretWord: null,
    canSubmitGuess: false,
    guessHistoryRows: [],
    scoreRows: [],
    winnerName: null
  };

  private listeners = new Set<Listener>();
  private pollingIntervalId: number | null = null;
  private pollingMode: "lobby" | "game" | null = null;

  constructor() {
    void this.restoreSession();
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;

  private setState(nextState: Partial<RoomState>) {
    const mergedState = {
      ...this.state,
      ...nextState
    };
    this.state = {
      ...mergedState,
      ...deriveRoomState(mergedState.room, mergedState.participantId)
    };
    this.listeners.forEach((listener) => listener());
  }

  private persistSession(session: StoredRoomSession) {
    sessionStorage.setItem(ROOM_SESSION_STORAGE_KEY, JSON.stringify(session));
    sessionStorage.setItem(ROOM_SESSION_ID_STORAGE_KEY, session.sessionId);
  }

  private readStoredSession() {
    const rawSession = sessionStorage.getItem(ROOM_SESSION_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawSession) as Partial<StoredRoomSession>;

      if (
        typeof parsed.participantId !== "string" ||
        !parsed.participantId ||
        typeof parsed.roomCode !== "string" ||
        !parsed.roomCode ||
        typeof parsed.sessionId !== "string" ||
        !parsed.sessionId
      ) {
        sessionStorage.removeItem(ROOM_SESSION_STORAGE_KEY);
        sessionStorage.removeItem(ROOM_SESSION_ID_STORAGE_KEY);
        return null;
      }

      return parsed as StoredRoomSession;
    } catch {
      sessionStorage.removeItem(ROOM_SESSION_STORAGE_KEY);
      sessionStorage.removeItem(ROOM_SESSION_ID_STORAGE_KEY);
      return null;
    }
  }

  clearSession() {
    this.stopPolling();
    sessionStorage.removeItem(ROOM_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(ROOM_SESSION_ID_STORAGE_KEY);
    this.setState({
      room: null,
      participantId: null,
      error: null,
      isLoading: false,
      isHydrating: false,
      isPolling: false
    });
  }

  private async restoreSession() {
    const storedSession = this.readStoredSession();

    if (!storedSession) {
      this.setState({ isHydrating: false });
      return;
    }

    this.setState({
      participantId: storedSession.participantId,
      isHydrating: true,
      error: null
    });

    try {
      const response = await api.fetchRoom(storedSession.roomCode, storedSession.participantId);
      this.setState({
        room: response.room,
        participantId: storedSession.participantId,
        error: null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to restore room";
      sessionStorage.removeItem(ROOM_SESSION_STORAGE_KEY);
      sessionStorage.removeItem(ROOM_SESSION_ID_STORAGE_KEY);
      this.setState({
        room: null,
        participantId: null,
        error: message
      });
    } finally {
      this.setState({ isHydrating: false });
    }
  }

  private async withLoading<T>(operation: () => Promise<T>) {
    this.setState({
      isLoading: true,
      error: null
    });

    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected request failure";
      this.setState({ error: message });
      throw error;
    } finally {
      this.setState({ isLoading: false });
    }
  }

  setRoomSession(response: RoomSessionResponse) {
    this.stopPolling();
    this.persistSession({
      participantId: response.participantId,
      roomCode: response.room.code,
      sessionId: response.sessionId
    });
    this.setState({
      participantId: response.participantId,
      room: response.room,
      error: null
    });
  }

  setRoomSnapshot(room: RoomSnapshot) {
    if (this.pollingMode === "lobby" && room.status !== "lobby") {
      this.stopPolling();
    }

    if (this.pollingMode === "game" && !isActiveGameStatus(room.status)) {
      this.stopPolling();
    }

    if (this.state.participantId) {
      this.persistSession({
        participantId: this.state.participantId,
        roomCode: room.code,
        sessionId:
          this.readStoredSession()?.sessionId ??
          sessionStorage.getItem(ROOM_SESSION_ID_STORAGE_KEY) ??
          ""
      });
    }

    this.setState({
      room,
      error: null
    });
  }

  async createRoom(playerName: string) {
    const response = await this.withLoading(() => api.createRoom(playerName));
    this.setRoomSession(response);
    return response;
  }

  async joinRoom(code: string, playerName: string) {
    const response = await this.withLoading(() => api.joinRoom(code, playerName));
    this.setRoomSession(response);
    return response;
  }

  async fetchRoom(options: { background?: boolean; suppressThrow?: boolean } = {}) {
    const roomCode = this.state.room?.code ?? this.readStoredSession()?.roomCode;

    if (!roomCode) {
      return null;
    }

    if (options.background) {
      this.setState({ isPolling: true });
    } else {
      this.setState({
        isLoading: true,
        error: null
      });
    }

    try {
      const response = await api.fetchRoom(roomCode, this.state.participantId ?? undefined);
      this.setRoomSnapshot(response.room);
      return response.room;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to refresh room";
      this.setState({ error: message });

      if (options.suppressThrow) {
        return null;
      }

      throw error;
    } finally {
      if (options.background) {
        this.setState({ isPolling: false });
      } else {
        this.setState({ isLoading: false });
      }
    }
  }

  async startRoom() {
    if (!this.state.room || !this.state.participantId) {
      throw new Error("Unable to start room");
    }

    const response = await this.withLoading(() =>
      api.startRoom(this.state.room!.code, this.state.participantId!)
    );
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async submitGuess(guessText: string) {
    if (!this.state.room || !this.state.participantId) {
      throw new Error("Unable to submit guess");
    }

    const response = await this.withLoading(() =>
      api.submitGuess(this.state.room!.code, this.state.participantId!, guessText)
    );
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async restartRoom() {
    if (!this.state.room || !this.state.participantId) {
      throw new Error("Unable to restart room");
    }

    const response = await this.withLoading(() =>
      api.restartRoom(this.state.room!.code, this.state.participantId!)
    );
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  private startPolling(validStatuses: RoomStatus[], mode: "lobby" | "game") {
    if (this.pollingIntervalId !== null || !this.state.room || !validStatuses.includes(this.state.room.status)) {
      return;
    }

    this.pollingMode = mode;
    this.pollingIntervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void this.fetchRoom({
        background: true,
        suppressThrow: true
      });
    }, 2000);
  }

  startLobbyPolling() {
    this.startPolling(["lobby"], "lobby");
  }

  startGamePolling() {
    this.startPolling(["playing", "result"], "game");
  }

  private stopPolling() {
    if (this.pollingIntervalId !== null) {
      window.clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }

    this.pollingMode = null;

    if (this.state.isPolling) {
      this.setState({ isPolling: false });
    }
  }

  stopLobbyPolling() {
    this.stopPolling();
  }

  stopGamePolling() {
    this.stopPolling();
  }
}

const RoomStoreContext = createContext<RoomStore | null>(null);

export function RoomStoreProvider({ children }: PropsWithChildren) {
  const storeRef = useRef<RoomStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = new RoomStore();
  }

  useEffect(() => undefined, []);

  return createElement(RoomStoreContext.Provider, { value: storeRef.current }, children);
}

export function useRoomStore() {
  const store = useContext(RoomStoreContext);

  if (!store) {
    throw new Error("RoomStoreProvider is missing");
  }

  return store;
}

export function useRoomState() {
  const store = useRoomStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
