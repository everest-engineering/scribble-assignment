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
  type ParticipantRole,
  type RoomSessionResponse,
  type RoomSnapshot
} from "../services/api";

const ROOM_SESSION_STORAGE_KEY = "scribble-room-session";

interface StoredRoomSession {
  participantId: string;
  roomCode: string;
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
  isDrawer: boolean;
  viewerRoundRole: ParticipantRole | null;
  drawerName: string | null;
  visibleSecretWord: string | null;
}

type Listener = () => void;

function deriveLobbyState(room: RoomSnapshot | null, participantId: string | null) {
  const drawerName =
    room?.drawerId
      ? room.participants.find((participant) => participant.id === room.drawerId)?.name ?? null
      : null;
  const viewerRoundRole =
    room?.status === "playing" ? (room.viewerRole ?? (room.drawerId === participantId ? "drawer" : "guesser")) : null;
  const isDrawer = viewerRoundRole === "drawer";

  if (!room || !participantId || room.status !== "lobby") {
    return {
      isHost: false,
      canStart: false,
      disabledReason: null,
      isDrawer,
      viewerRoundRole,
      drawerName,
      visibleSecretWord: isDrawer ? room?.secretWord ?? null : null
    };
  }

  const isHost = room.hostId === participantId;
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
    isDrawer: false,
    viewerRoundRole: null,
    drawerName: null,
    visibleSecretWord: null
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
    isDrawer: false,
    viewerRoundRole: null,
    drawerName: null,
    visibleSecretWord: null
  };

  private listeners = new Set<Listener>();
  private pollingIntervalId: number | null = null;

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
      ...deriveLobbyState(mergedState.room, mergedState.participantId)
    };
    this.listeners.forEach((listener) => listener());
  }

  private persistSession(session: StoredRoomSession) {
    sessionStorage.setItem(ROOM_SESSION_STORAGE_KEY, JSON.stringify(session));
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
        !parsed.roomCode
      ) {
        sessionStorage.removeItem(ROOM_SESSION_STORAGE_KEY);
        return null;
      }

      return parsed as StoredRoomSession;
    } catch {
      sessionStorage.removeItem(ROOM_SESSION_STORAGE_KEY);
      return null;
    }
  }

  clearSession() {
    this.stopLobbyPolling();
    sessionStorage.removeItem(ROOM_SESSION_STORAGE_KEY);
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
    this.stopLobbyPolling();
    this.persistSession({
      participantId: response.participantId,
      roomCode: response.room.code
    });
    this.setState({
      participantId: response.participantId,
      room: response.room,
      error: null
    });
  }

  setRoomSnapshot(room: RoomSnapshot) {
    if (room.status !== "lobby") {
      this.stopLobbyPolling();
    }

    if (this.state.participantId) {
      this.persistSession({
        participantId: this.state.participantId,
        roomCode: room.code
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

  startLobbyPolling() {
    if (this.pollingIntervalId !== null || !this.state.room || this.state.room.status !== "lobby") {
      return;
    }

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

  stopLobbyPolling() {
    if (this.pollingIntervalId !== null) {
      window.clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }

    if (this.state.isPolling) {
      this.setState({ isPolling: false });
    }
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
