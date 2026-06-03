import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren
} from "react";
import { api, type RoomSessionResponse, type RoomSnapshot, type Stroke } from "../services/api";

export interface RoomState {
  room: RoomSnapshot | null;
  participantId: string | null;
  error: string | null;
  isLoading: boolean;
}

type Listener = () => void;

const SESSION_KEY = "scribble_session";

export class RoomStore {
  private state: RoomState = {
    room: null,
    participantId: null,
    error: null,
    isLoading: false
  };

  private listeners = new Set<Listener>();

  constructor() {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { participantId: string; roomCode: string };
        if (parsed.participantId) {
          this.state = { ...this.state, participantId: parsed.participantId };
        }
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

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
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ participantId: response.participantId, roomCode: response.room.code })
      );
    } catch {
      // sessionStorage unavailable — continue without persistence
    }
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

  async submitStroke(stroke: Stroke) {
    if (!this.state.room || !this.state.participantId) throw new Error("No active room");
    const response = await api.submitStroke(this.state.room.code, this.state.participantId, stroke);
    this.setRoomSnapshot(response.room);
    return response;
  }

  async clearCanvas() {
    if (!this.state.room || !this.state.participantId) throw new Error("No active room");
    const response = await api.clearCanvas(this.state.room.code, this.state.participantId);
    this.setRoomSnapshot(response.room);
    return response;
  }

  async submitGuess(text: string) {
    if (!this.state.room || !this.state.participantId) throw new Error("No active room");
    const response = await api.submitGuess(this.state.room.code, this.state.participantId, text.trim());
    this.setRoomSnapshot(response.room);
    return response.guess;
  }

  async endRoom() {
    if (!this.state.room || !this.state.participantId) throw new Error("No active room");
    const response = await api.endRoom(this.state.room.code, this.state.participantId);
    this.setRoomSnapshot(response.room);
    return response;
  }

  async restartRoom() {
    if (!this.state.room || !this.state.participantId) throw new Error("No active room");
    const response = await api.restartRoom(this.state.room.code, this.state.participantId);
    this.setRoomSnapshot(response.room);
    return response;
  }

  async restoreSession(): Promise<boolean> {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (!saved) return false;

      const { participantId, roomCode } = JSON.parse(saved) as { participantId: string; roomCode: string };
      const response = await api.fetchRoom(roomCode, participantId);
      this.setState({ participantId, room: response.room, error: null });
      return true;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
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
