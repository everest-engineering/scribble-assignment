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

const STORAGE_ROOM_CODE = "scribble_roomCode";
const STORAGE_PARTICIPANT_ID = "scribble_participantId";
const STORAGE_PLAYER_NAME = "scribble_playerName";

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
    participantId: sessionStorage.getItem(STORAGE_PARTICIPANT_ID),
    error: null,
    isLoading: false
  };

  private listeners = new Set<Listener>();
  private pollingTimer: ReturnType<typeof setInterval> | null = null;

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
    sessionStorage.setItem(STORAGE_ROOM_CODE, response.room.code);
    sessionStorage.setItem(STORAGE_PARTICIPANT_ID, response.participantId);
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
    sessionStorage.setItem(STORAGE_PLAYER_NAME, playerName);
    this.setRoomSession(response);
    return response;
  }

  async joinRoom(code: string, playerName: string) {
    const response = await this.withLoading(() => api.joinRoom(code, playerName));
    sessionStorage.setItem(STORAGE_PLAYER_NAME, playerName);
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

    const response = await this.withLoading(() =>
      api.startGame(this.state.room!.code, this.state.participantId!)
    );
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async updateDrawing(strokes: DrawingStroke[]) {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const response = await api.updateDrawing(this.state.room.code, this.state.participantId, strokes);
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

  async submitGuess(value: string) {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const response = await this.withLoading(() =>
      api.submitGuess(this.state.room!.code, this.state.participantId!, value)
    );
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

  startPolling() {
    if (this.pollingTimer) return;
    this.pollingTimer = setInterval(() => {
      this.fetchRoom().catch(() => {});
    }, 2000);
  }

  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  getStoredPlayerName() {
    return sessionStorage.getItem(STORAGE_PLAYER_NAME) ?? "";
  }

  getStoredRoomCode() {
    return sessionStorage.getItem(STORAGE_ROOM_CODE) ?? "";
  }

  clearSession() {
    sessionStorage.removeItem(STORAGE_ROOM_CODE);
    sessionStorage.removeItem(STORAGE_PARTICIPANT_ID);
    sessionStorage.removeItem(STORAGE_PLAYER_NAME);
    this.setState({
      room: null,
      participantId: null,
      error: null
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
