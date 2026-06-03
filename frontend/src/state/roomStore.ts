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
    const response = await this.withLoading(() => api.createRoom(playerName));
    this.setRoomSession(response);
    return response;
  }

  async joinRoom(code: string, playerName: string) {
    const response = await this.withLoading(() => api.joinRoom(code, playerName));
    this.setRoomSession(response);
    return response;
  }

  // Silent poll — does not set isLoading to avoid UI flash during background polling
  async fetchRoom() {
    if (!this.state.room) {
      return null;
    }

    try {
      const response = await api.fetchRoom(
        this.state.room.code,
        this.state.participantId ?? undefined
      );
      this.setRoomSnapshot(response.room);
      return response.room;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to refresh room";
      this.setState({ error: message });
      return null;
    }
  }

  async startGame() {
    const { room, participantId } = this.state;

    if (!room || !participantId) {
      return;
    }

    const response = await this.withLoading(() => api.startGame(room.code, participantId));
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  // T023: updateCanvas — sends canvas data URL to backend then refreshes room
  async updateCanvas(canvasDataUrl: string) {
    const { room, participantId } = this.state;
    if (!room || !participantId) return;
    try {
      await api.updateCanvas(room.code, participantId, canvasDataUrl);
      await this.fetchRoom();
    } catch {
      // Silent — canvas updates are fire-and-forget; next poll will resync
    }
  }

  // T023: clearCanvas — clears canvas state on backend then refreshes room
  async clearCanvas() {
    const { room, participantId } = this.state;
    if (!room || !participantId) return;
    try {
      await api.clearCanvas(room.code, participantId);
      await this.fetchRoom();
    } catch {
      // Silent — next poll will resync
    }
  }

  // T037: submitGuess — submits guess then refreshes room for updated scores/history
  async submitGuess(text: string) {
    const { room, participantId } = this.state;
    if (!room || !participantId) return;
    await this.withLoading(async () => {
      await api.submitGuess(room.code, participantId, text);
      await this.fetchRoom();
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
