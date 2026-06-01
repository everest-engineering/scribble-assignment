import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren
} from "react";
import { api, type DrawingStroke, type RoomSessionResponse, type RoomSnapshot } from "../services/api";

export interface RoomState {
  room: RoomSnapshot | null;
  participantId: string | null;
  error: string | null;
  isLoading: boolean;
}

type Listener = () => void;

class RoomStore {
  private state: RoomState = {
    room: null,
    participantId: null,
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

  async createRoom(playerName: string) {
    const response = await this.withLoading(() => api.createRoom(playerName.trim()));
    this.setRoomSession(response);
    return response;
  }

  async joinRoom(code: string, playerName: string) {
    const response = await this.withLoading(() =>
      api.joinRoom(code.trim().toUpperCase(), playerName.trim())
    );
    this.setRoomSession(response);
    return response;
  }

  async fetchRoom() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const response = await api.fetchRoom(this.state.room.code, this.state.participantId);
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async fetchRoomForPoll() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    try {
      return await this.fetchRoom();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to refresh room state";
      this.setState({ error: message });
      return null;
    }
  }

  async startGame() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const response = await this.withLoading(() =>
      api.startGame(this.state.room!.code, this.state.participantId!)
    );
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async submitGuess(text: string) {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const response = await this.withLoading(() =>
      api.submitGuess(this.state.room!.code, this.state.participantId!, text)
    );
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async updateDrawing(strokes: DrawingStroke[]) {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const response = await api.updateDrawing(
      this.state.room.code,
      this.state.participantId,
      strokes
    );
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async clearDrawing() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const response = await api.clearDrawing(this.state.room.code, this.state.participantId);
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async restartGame() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const response = await this.withLoading(() =>
      api.restartGame(this.state.room!.code, this.state.participantId!)
    );
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

export const LOBBY_POLL_MS = 2000;
export const GAME_POLL_MS = 2000;

export function useRoomPolling(enabled: boolean, intervalMs: number) {
  const roomStore = useRoomStore();

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const poll = () => {
      void roomStore.fetchRoomForPoll();
    };

    poll();
    const timer = window.setInterval(poll, intervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, intervalMs, roomStore]);
}
