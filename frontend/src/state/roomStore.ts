import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren
} from "react";
import { useNavigate } from "react-router-dom";
import { api, type RoomSessionResponse, type RoomSnapshot } from "../services/api";

export interface RoomState {
  room: RoomSnapshot | null;
  participantId: string | null;
  isHost: boolean;
  error: string | null;
  isLoading: boolean;
}

type Listener = () => void;

class RoomStore {
  private state: RoomState = {
    room: null,
    participantId: null,
    isHost: false,
    error: null,
    isLoading: false
  };

  private listeners = new Set<Listener>();

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;

  private setState(nextState: Partial<RoomState>) {
    const updatedState = { ...this.state, ...nextState };
    updatedState.isHost = !!(updatedState.room && updatedState.participantId && updatedState.room.hostId === updatedState.participantId);
    
    this.state = updatedState;
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

  async fetchRoom() {
    if (!this.state.room) {
      return null;
    }

    const response = await api.fetchRoom(this.state.room.code, this.state.participantId ?? undefined);
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async startGame() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const response = await this.withLoading(() => api.startGame(this.state.room!.code, this.state.participantId!));
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async submitStrokes(strokes: any[]) {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const response = await api.submitStrokes(this.state.room.code, this.state.participantId, strokes);
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async submitGuess(text: string) {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const response = await this.withLoading(() => api.submitGuess(this.state.room!.code, this.state.participantId!, text));
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

export function useRoomPolling(intervalMs: number = 2000) {
  const store = useRoomStore();
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId: number;
    let isActive = true;
    let consecutiveFailures = 0;

    async function poll() {
      if (!isActive) return;
      
      try {
        const room = await store.fetchRoom();
        consecutiveFailures = 0;
        
        if (room && room.status === "playing") {
          navigate("/game");
        }
      } catch (err) {
        consecutiveFailures++;
        if (consecutiveFailures >= 3) {
          console.warn("Connection unstable...", err);
        }
      }
      
      if (isActive) {
        timeoutId = window.setTimeout(poll, intervalMs);
      }
    }

    poll();

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [store, intervalMs, navigate]);
}
