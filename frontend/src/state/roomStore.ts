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
  isLoading: boolean;
}

type Listener = () => void;

export class RoomStore {
  private state: RoomState = {
    room: null,
    participantId: null,
    error: null,
    isLoading: false
  };

  private listeners = new Set<Listener>();
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private isFetching = false;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;

  startPolling() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => this.fetchRoom(), 2000);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private setState(nextState: Partial<RoomState>) {
    this.state = {
      ...this.state,
      ...nextState
    };
    this.listeners.forEach((listener) => listener());
  }

  private async withLoading<T>(operation: () => Promise<T>, errorMessage?: string) {
    this.setState({
      isLoading: true,
      error: null
    });

    try {
      return await operation();
    } catch (error) {
      const message = errorMessage ?? (error instanceof Error ? error.message : "Unexpected request failure");
      this.setState({ error: message });
      // Here we would ideally trigger a toast, for now updating the state.error suffices
      // The UI should display this error.
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
    if (!this.state.room || this.isFetching) {
      return null;
    }

    try {
      this.isFetching = true;
      const response = await api.fetchRoom(this.state.room.code, this.state.participantId ?? undefined);
      this.setRoomSnapshot(response.room);
      return response.room;
    } catch (error) {
      // Don't set global error state for polling failures to avoid UI flicker,
      // but log it or handle 404 for room closure.
      if (error instanceof Error && error.message.includes("404")) {
         this.setState({ error: "Room closed or not found", room: null });
         this.stopPolling();
      }
      return null;
    } finally {
      this.isFetching = false;
    }
  }

  async startGame() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    return await this.withLoading(() =>
      api.startGame(this.state.room!.code, this.state.participantId!),
      "Failed to start game"
    );
  }

  async endGame() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    return await this.withLoading(() =>
      api.endGame(this.state.room!.code, this.state.participantId!),
      "Failed to end round"
    );
  }

  async restartGame() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    return await this.withLoading(() =>
      api.restartGame(this.state.room!.code, this.state.participantId!),
      "Failed to restart game"
    );
  }

  async updateCanvas(drawingEvents: any) {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    return await api.updateCanvas(
      this.state.room.code,
      this.state.participantId,
      drawingEvents
    );
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
