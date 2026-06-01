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
import { loadRoomSession, saveRoomSession } from "./session";

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
    saveRoomSession({
      roomCode: response.room.code,
      participantId: response.participantId
    });
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
    const trimmed = playerName.trim();

    if (!trimmed) {
      const message = "Name is required";
      this.setState({ error: message });
      throw new Error(message);
    }

    const response = await this.withLoading(() => api.createRoom(trimmed));
    this.setRoomSession(response);
    return response;
  }

  async joinRoom(code: string, playerName: string) {
    const trimmedCode = code.trim();
    const trimmedName = playerName.trim();

    if (!trimmedCode) {
      const message = "Room code is required";
      this.setState({ error: message });
      throw new Error(message);
    }

    if (!trimmedName) {
      const message = "Name is required";
      this.setState({ error: message });
      throw new Error(message);
    }

    const response = await this.withLoading(() =>
      api.joinRoom(trimmedCode, trimmedName)
    );
    this.setRoomSession(response);
    return response;
  }

  async fetchRoom() {
    const code = this.state.room?.code;
    const participantId = this.state.participantId;

    if (!code || !participantId) {
      return null;
    }

    const response = await api.fetchRoom(code, participantId);
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async startGame() {
    const code = this.state.room?.code;
    const participantId = this.state.participantId;

    if (!code || !participantId) {
      throw new Error("Missing room session");
    }

    const response = await this.withLoading(() => api.startGame(code, participantId));
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async submitGuess(text: string) {
    const code = this.state.room?.code;
    const participantId = this.state.participantId;

    if (!code || !participantId) {
      throw new Error("Missing room session");
    }

    const response = await api.submitGuess(code, participantId, text);
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async restartGame() {
    const code = this.state.room?.code;
    const participantId = this.state.participantId;

    if (!code || !participantId) {
      throw new Error("Missing room session");
    }

    const response = await this.withLoading(() => api.restartGame(code, participantId));
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async hydrateFromSession() {
    const session = loadRoomSession();

    if (!session) {
      return null;
    }

    try {
      const response = await api.fetchRoom(session.roomCode, session.participantId);
      this.setState({
        participantId: session.participantId,
        room: response.room,
        error: null
      });
      return response.room;
    } catch {
      return null;
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
