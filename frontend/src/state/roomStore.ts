import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren
} from "react";
import { api, type GameActionResponse, type RoomSessionResponse, type RoomSnapshot, type Stroke } from "../services/api";

export interface RoomState {
  room: RoomSnapshot | null;
  participantId: string | null;
  error: string | null;
  isLoading: boolean;
  pollError: string | null;
}

type Listener = () => void;

class RoomStore {
  private state: RoomState = {
    room: null,
    participantId: null,
    error: null,
    isLoading: false,
    pollError: null
  };

  private listeners = new Set<Listener>();
  private pollIntervalId: ReturnType<typeof setInterval> | null = null;

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

  startPolling() {
    if (this.pollIntervalId) return;
    this.pollIntervalId = setInterval(() => {
      this.silentFetchRoom();
    }, 2000);
  }

  stopPolling() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  private async silentFetchRoom() {
    const code = this.state.room?.code;
    if (!code) return;
    try {
      const participantId = this.state.participantId ?? undefined;
      const response = await api.fetchRoom(code, participantId);
      this.state = { ...this.state, room: response.room, pollError: null };
      this.listeners.forEach((listener) => listener());
    } catch {
      this.state = { ...this.state, pollError: "Failed to refresh room state" };
      this.listeners.forEach((listener) => listener());
    }
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

  getParticipantId() {
    return this.state.participantId;
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
    const code = this.state.room?.code;
    if (!code) {
      return null;
    }

    const participantId = this.state.participantId ?? undefined;
    const response = await this.withLoading(() => api.fetchRoom(code, participantId));
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async startGame() {
    const code = this.state.room?.code;
    const participantId = this.state.participantId;
    if (!code || !participantId) {
      throw new Error("No active room session");
    }

    const response = await this.withLoading(() => api.startGame(code, participantId));
    this.setRoomSnapshot(response.room);
    return response;
  }

  async renamePlayer(name: string) {
    const code = this.state.room?.code;
    const participantId = this.state.participantId;
    if (!code || !participantId) {
      throw new Error("No active room session");
    }

    const response = await this.withLoading(() => api.rename(code, participantId, name));
    this.setRoomSnapshot(response.room);
    return response;
  }

  async disbandRoom() {
    const code = this.state.room?.code;
    const participantId = this.state.participantId;
    if (!code || !participantId) {
      throw new Error("No active room session");
    }

    await this.withLoading(() => api.disband(code, participantId));
    this.setState({ room: null, participantId: null });
  }

  async submitGuess(text: string) {
    const code = this.state.room?.code;
    const participantId = this.state.participantId;
    if (!code || !participantId) {
      throw new Error("No active room session");
    }

    const response = await this.withLoading(() => api.submitGuess(code, participantId, text));
    this.setState({ room: response.room, error: null });
    return response;
  }

  async updateCanvas(strokes: Stroke[]) {
    const code = this.state.room?.code;
    const participantId = this.state.participantId;
    if (!code || !participantId) {
      throw new Error("No active room session");
    }

    const response = await this.withLoading(() => api.updateCanvas(code, participantId, strokes));
    this.setState({ room: response.room, error: null });
  }

  async clearCanvas() {
    const code = this.state.room?.code;
    const participantId = this.state.participantId;
    if (!code || !participantId) {
      throw new Error("No active room session");
    }

    const response = await this.withLoading(() => api.clearCanvas(code, participantId));
    this.setState({ room: response.room, error: null });
  }

  async endRound() {
    const code = this.state.room?.code;
    const participantId = this.state.participantId;
    if (!code || !participantId) {
      throw new Error("No active room session");
    }

    const response = await this.withLoading(() => api.endRound(code, participantId));
    this.setState({ room: response.room, error: null });
    return response;
  }

  async restartGame() {
    const code = this.state.room?.code;
    const participantId = this.state.participantId;
    if (!code || !participantId) {
      throw new Error("No active room session");
    }

    await this.withLoading(() => api.restartGame(code, participantId));
    await this.silentFetchRoom();
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
