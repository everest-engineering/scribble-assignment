import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren
} from "react";
import { api, type RoomSessionResponse, type RoomSnapshot } from "../services/api";

export interface RoomState {
  room: RoomSnapshot | null;
  participantId: string | null;
  error: string | null;
  pollingError: string | null;
  isLoading: boolean;
}

type Listener = () => void;

class RoomStore {
  private state: RoomState = {
    room: null,
    participantId: null,
    error: null,
    pollingError: null,
    isLoading: false
  };

  private listeners = new Set<Listener>();

  private pollTimerId: ReturnType<typeof setTimeout> | null = null;
  private isPolling = false;
  private consecutiveFailures = 0;
  private pollInterval = 2000;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;

  private setState(nextState: Partial<RoomState>) {
    this.state = {
      ...this.state,
      ...nextState
    };
    this.listeners.forEach((listener) => listener());
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
    this.setState({
      participantId: response.participantId,
      room: response.room,
      error: null
    });
  }

  setRoomSnapshot(room: RoomSnapshot) {
    this.setState({
      room,
      error: null
    });
  }

  clearSession() {
    sessionStorage.removeItem("scribble_roomCode");
    sessionStorage.removeItem("scribble_participantId");
  }

  getSavedSession(): { code: string; participantId: string } | null {
    const code = sessionStorage.getItem("scribble_roomCode");
    const participantId = sessionStorage.getItem("scribble_participantId");
    if (code && participantId) {
      return { code, participantId };
    }
    return null;
  }

  async restoreSession() {
    const session = this.getSavedSession();
    if (!session) return null;

    this.setState({ participantId: session.participantId });

    try {
      const response = await api.fetchRoom(session.code, session.participantId);
      this.setRoomSnapshot(response.room);
      return response.room;
    } catch {
      this.setState({ error: "Failed to restore session" });
      return null;
    }
  }

  async createRoom(playerName: string) {
    const response = await this.withLoading(() => api.createRoom(playerName));
    this.setRoomSession(response);
    sessionStorage.setItem("scribble_roomCode", response.room.code);
    sessionStorage.setItem("scribble_participantId", response.participantId);
    return response;
  }

  async joinRoom(code: string, playerName: string) {
    const response = await this.withLoading(() => api.joinRoom(code, playerName));
    this.setRoomSession(response);
    sessionStorage.setItem("scribble_roomCode", response.room.code);
    sessionStorage.setItem("scribble_participantId", response.participantId);
    return response;
  }

  async startGame() {
    if (!this.state.room || !this.state.participantId) {
      throw new Error("No room to start");
    }

    const response = await api.startRoom(this.state.room.code, this.state.participantId);
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async fetchRoom() {
    if (!this.state.room) {
      return null;
    }

    const response = await api.fetchRoom(this.state.room.code, this.state.participantId ?? undefined);
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  startPolling() {
    this.stopPolling();
    this.isPolling = true;
    this.scheduleNextPoll();
  }

  stopPolling() {
    this.isPolling = false;
    if (this.pollTimerId !== null) {
      clearTimeout(this.pollTimerId);
      this.pollTimerId = null;
    }
    this.consecutiveFailures = 0;
    this.pollInterval = 2000;
    this.setState({ pollingError: null });
  }

  private scheduleNextPoll() {
    if (!this.isPolling) return;

    this.pollTimerId = setTimeout(async () => {
      if (!this.isPolling) return;

      try {
        await this.fetchRoom();
        this.consecutiveFailures = 0;
        this.pollInterval = 2000;
        this.setState({ pollingError: null });
      } catch {
        this.consecutiveFailures++;
        this.pollInterval = Math.min(this.pollInterval * 2, 8000);

        if (this.consecutiveFailures >= 3) {
          this.setState({ pollingError: "Unable to reach server. Retrying..." });
        }
      }

      this.scheduleNextPoll();
    }, this.pollInterval);
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
