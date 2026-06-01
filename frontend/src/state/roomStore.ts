import {
  createContext,
  createElement,
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

const POLLING_INTERVAL_MS = 2000;

export class RoomStore {
  private state: RoomState = {
    room: null,
    participantId: null,
    error: null,
    isLoading: false
  };

  private listeners = new Set<Listener>();
  private pollHandle: ReturnType<typeof setInterval> | null = null;

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

  private setLoading(isLoading: boolean) {
    this.setState({ isLoading });
  }

  private setError(error: string | null) {
    this.setState({ error });
  }

  private async withLoading<T>(operation: () => Promise<T>) {
    this.setLoading(true);
    this.setError(null);

    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected request failure";
      this.setError(message);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  private startPolling() {
    if (this.pollHandle) {
      return;
    }

    this.pollHandle = setInterval(() => {
      void this.refreshRoom();
    }, POLLING_INTERVAL_MS);
  }

  private stopPolling() {
    if (!this.pollHandle) {
      return;
    }

    clearInterval(this.pollHandle);
    this.pollHandle = null;
  }

  private async refreshRoom() {
    const currentRoom = this.state.room;

    if (!currentRoom) {
      return null;
    }

    try {
      const response = await api.fetchRoom(currentRoom.code, this.state.participantId ?? undefined);
      this.setState({
        room: response.room,
        error: null
      });
      return response.room;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected request failure";
      this.setError(message);
      return null;
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
    return this.withLoading(() => this.refreshRoom());
  }

  async startRoom(secretWord: string) {
    const currentRoom = this.state.room;
    const participantId = this.state.participantId;

    if (!currentRoom || !participantId) {
      return null;
    }

    const response = await this.withLoading(() => api.startRoom(currentRoom.code, participantId, secretWord));
    const nextRoom = response.room;

    this.setState({
      room: nextRoom,
      error: null
    });

    return nextRoom;
  }

  async drawCanvas(stroke: { points: Array<{ x: number; y: number }>; color: string; lineWidth: number }) {
    const currentRoom = this.state.room;
    const participantId = this.state.participantId;

    if (!currentRoom || !participantId) {
      return null;
    }

    const response = await this.withLoading(() => api.drawCanvas(currentRoom.code, participantId, stroke));
    this.setState({
      room: response.room,
      error: null
    });

    return response.room;
  }

  async clearCanvas() {
    const currentRoom = this.state.room;
    const participantId = this.state.participantId;

    if (!currentRoom || !participantId) {
      return null;
    }

    const response = await this.withLoading(() => api.clearCanvas(currentRoom.code, participantId));
    this.setState({
      room: response.room,
      error: null
    });

    return response.room;
  }

  async submitGuess(guessText: string) {
    const currentRoom = this.state.room;
    const participantId = this.state.participantId;

    if (!currentRoom || !participantId) {
      return null;
    }

    const response = await this.withLoading(() => api.submitGuess(currentRoom.code, participantId, guessText));
    this.setState({
      room: response.room,
      error: null
    });

    return response.room;
  }

  async restartRoom() {
    const currentRoom = this.state.room;
    const participantId = this.state.participantId;

    if (!currentRoom || !participantId) {
      return null;
    }

    const response = await this.withLoading(() => api.restartRoom(currentRoom.code, participantId));
    this.setState({
      room: response.room,
      error: null
    });

    return response.room;
  }

  enablePolling() {
    this.startPolling();
  }

  disablePolling() {
    this.stopPolling();
  }

  dispose() {
    this.stopPolling();
  }
}

const RoomStoreContext = createContext<RoomStore | null>(null);

export function RoomStoreProvider({ children }: PropsWithChildren) {
  const storeRef = useRef<RoomStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = new RoomStore();
  }

  useEffect(() => {
    return () => {
      storeRef.current?.dispose();
    };
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
