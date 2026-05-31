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
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      const error = new Error("Player name cannot be empty");
      this.setState({ error: error.message });
      throw error;
    }
    const response = await this.withLoading(() => api.createRoom(trimmedName));
    this.setRoomSession(response);
    return response;
  }

  async joinRoom(code: string, playerName: string) {
    const trimmedCode = code.trim();
    const trimmedName = playerName.trim();
    if (!trimmedCode) {
      const error = new Error("Room code cannot be empty");
      this.setState({ error: error.message });
      throw error;
    }
    if (!trimmedName) {
      const error = new Error("Player name cannot be empty");
      this.setState({ error: error.message });
      throw error;
    }
    const response = await this.withLoading(() => api.joinRoom(trimmedCode, trimmedName));
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

  async initializeFromUrl(code: string, participantId: string) {
    return this.withLoading(async () => {
      const response = await api.fetchRoom(code, participantId);
      this.setState({
        room: response.room,
        participantId,
        error: null
      });
      return response.room;
    });
  }

  async startGame() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }
    return this.withLoading(async () => {
      const response = await api.startGame(this.state.room!.code, this.state.participantId!);
      this.setRoomSnapshot(response.room);
      return response.room;
    });
  }

  async updateDrawing(drawingData: string) {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }
    try {
      const response = await api.updateDrawing(
        this.state.room.code,
        this.state.participantId,
        drawingData
      );
      this.setRoomSnapshot(response.room);
      return response.room;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update drawing";
      this.setState({ error: message });
      throw error;
    }
  }

  async clearDrawing() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }
    try {
      const response = await api.clearDrawing(
        this.state.room.code,
        this.state.participantId
      );
      this.setRoomSnapshot(response.room);
      return response.room;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to clear drawing";
      this.setState({ error: message });
      throw error;
    }
  }

  async submitGuess(guessText: string) {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }
    return this.withLoading(async () => {
      const response = await api.submitGuess(
        this.state.room!.code,
        this.state.participantId!,
        guessText
      );
      this.setRoomSnapshot(response.room);
      return response.room;
    });
  }

  async leaveRoom() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }
    return this.withLoading(async () => {
      const response = await api.leaveRoom(
        this.state.room!.code,
        this.state.participantId!
      );
      this.setState({
        room: null,
        participantId: null,
        error: null
      });
      return response;
    });
  }

  async restartGame() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }
    return this.withLoading(async () => {
      const response = await api.restartGame(
        this.state.room!.code,
        this.state.participantId!
      );
      this.setRoomSnapshot(response.room);
      return response.room;
    });
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
