import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren
} from "react";
import { api, type CanvasStroke, type GuessSnapshot, type RoomSessionResponse, type RoomSnapshot } from "../services/api";

const POLL_INTERVAL = 2000;

export interface RoomState {
  room: RoomSnapshot | null;
  participantId: string | null;
  error: string | null;
  isLoading: boolean;
}

type Listener = () => void;

class RoomStore {
  private state: RoomState = RoomStore.initState();

  private static initState(): RoomState {
    const savedCode = sessionStorage.getItem("roomCode");
    const savedPid = sessionStorage.getItem("participantId");
    return {
      room: null,
      participantId: savedPid ?? null,
      error: null,
      isLoading: !!(savedCode && savedPid)
    };
  }

  private listeners = new Set<Listener>();
  private pollTimer: ReturnType<typeof setInterval> | null = null;

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
    sessionStorage.setItem("roomCode", response.room.code);
    sessionStorage.setItem("participantId", response.participantId);
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

  async restoreSession() {
    const savedCode = sessionStorage.getItem("roomCode");
    const savedPid = sessionStorage.getItem("participantId");

    if (!savedCode || !savedPid) {
      this.setState({ isLoading: false });
      return;
    }

    try {
      const response = await api.fetchRoom(savedCode, savedPid);
      this.setState({
        room: response.room,
        isLoading: false,
        error: null
      });
      this.startPolling();
    } catch {
      sessionStorage.removeItem("roomCode");
      sessionStorage.removeItem("participantId");
      this.setState({ participantId: null, isLoading: false });
    }
  }

  clearSession() {
    sessionStorage.removeItem("roomCode");
    sessionStorage.removeItem("participantId");
    this.stopPolling();
    this.setState({
      room: null,
      participantId: null,
      error: null,
      isLoading: false
    });
  }

  startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      this.fetchRoom().catch(() => undefined);
    }, POLL_INTERVAL);
  }

  stopPolling() {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
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

  async startGame(participantId: string) {
    if (!this.state.room) {
      throw new Error("No active room");
    }

    const response = await this.withLoading(() => api.startGame(this.state.room!.code, participantId));
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async drawStroke(strokes: CanvasStroke[]) {
    if (!this.state.room || !this.state.participantId) {
      throw new Error("No active room");
    }

    const response = await this.withLoading(() =>
      api.draw(this.state.room!.code, this.state.participantId!, strokes)
    );
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async clearCanvas() {
    if (!this.state.room || !this.state.participantId) {
      throw new Error("No active room");
    }

    const response = await this.withLoading(() =>
      api.clearCanvas(this.state.room!.code, this.state.participantId!)
    );
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async submitGuess(text: string) {
    if (!this.state.room || !this.state.participantId) {
      throw new Error("No active room");
    }

    const response = await this.withLoading(() =>
      api.submitGuess(this.state.room!.code, this.state.participantId!, text)
    );
    this.setRoomSnapshot(response.room);
    return response.guess;
  }

  async restartGame() {
    if (!this.state.room || !this.state.participantId) {
      throw new Error("No active room");
    }

    const response = await this.withLoading(() =>
      api.restartGame(this.state.room!.code, this.state.participantId!)
    );
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
}

const RoomStoreContext = createContext<RoomStore | null>(null);

export function RoomStoreProvider({ children }: PropsWithChildren) {
  const storeRef = useRef<RoomStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = new RoomStore();
  }

  useEffect(() => {
    storeRef.current!.restoreSession();
  }, []);

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
