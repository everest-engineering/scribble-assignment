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

  private pollHandle: ReturnType<typeof setInterval> | null = null;

  private isPolling = false;

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

  async startRoom(participantId: string) {
    if (!this.state.room) {
      return null;
    }

    const response = await this.withLoading(() =>
      api.startRoom(this.state.room!.code, participantId)
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

  // Drawer pushes its canvas image. Fire-and-forget: a failed push must not
  // disrupt drawing, so transient errors are swallowed (the next push retries).
  async updateDrawing(drawing: string | null) {
    const { room, participantId } = this.state;
    if (!room || !participantId) {
      return;
    }

    try {
      await api.updateDrawing(room.code, participantId, drawing);
    } catch {
      // Ignore; polling and the next push will reconcile.
    }
  }

  async fetchRoom() {
    if (!this.state.room) {
      return null;
    }

    const response = await api.fetchRoom(this.state.room.code, this.state.participantId ?? undefined);
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  // Automatic lobby refresh. On failure the last known snapshot is kept and a
  // non-fatal error is surfaced; the next tick retries. An in-flight guard
  // prevents overlapping requests when a poll is slower than the interval.
  private async pollOnce() {
    if (this.isPolling || !this.state.room) {
      return;
    }

    this.isPolling = true;

    try {
      const response = await api.fetchRoom(
        this.state.room.code,
        this.state.participantId ?? undefined
      );
      this.setRoomSnapshot(response.room);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to refresh room";
      this.setState({ error: message });
    } finally {
      this.isPolling = false;
    }
  }

  startPolling(intervalMs = 2000) {
    this.stopPolling();
    void this.pollOnce();
    this.pollHandle = setInterval(() => {
      void this.pollOnce();
    }, intervalMs);
  }

  stopPolling() {
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
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
