import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren
} from "react";
import { api, type Point, type RoomSessionResponse, type RoomSnapshot } from "../services/api";

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
    const response = await this.withLoading(() => api.createRoom(playerName));
    this.setRoomSession(response);
    return response;
  }

  async joinRoom(code: string, playerName: string) {
    const response = await this.withLoading(() => api.joinRoom(code, playerName));
    this.setRoomSession(response);
    return response;
  }

  async startRoom() {
    if (!this.state.room) {
      throw new Error("No active room");
    }

    await this.withLoading(() => api.startRoom(this.state.room!.code));
    // Fetch viewer-aware snapshot so the drawer receives secretWord immediately
    const snap = await this.withLoading(() =>
      api.fetchRoom(this.state.room!.code, this.state.participantId ?? undefined)
    );
    this.setRoomSnapshot(snap.room);
    return snap.room;
  }

  async fetchRoom() {
    if (!this.state.room) {
      return null;
    }

    const response = await this.withLoading(() =>
      api.fetchRoom(this.state.room!.code, this.state.participantId ?? undefined)
    );
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async pollRoom() {
    if (!this.state.room) {
      return null;
    }

    try {
      const response = await api.fetchRoom(this.state.room.code, this.state.participantId ?? undefined);
      this.setRoomSnapshot(response.room);
      return response.room;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Poll failed";
      this.setState({ error: message });
      return null;
    }
  }

  async submitGuess(playerName: string, guess: string) {
    if (!this.state.room) {
      throw new Error("No active room");
    }

    return this.withLoading(() => api.submitGuess(this.state.room!.code, playerName, guess));
  }

  async addStroke(points: Point[]) {
    if (!this.state.room) {
      throw new Error("No active room");
    }

    return api.addStroke(this.state.room.code, points);
  }

  async clearStrokes() {
    if (!this.state.room) {
      throw new Error("No active room");
    }

    return api.clearStrokes(this.state.room.code);
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
