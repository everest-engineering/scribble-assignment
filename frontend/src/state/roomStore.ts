import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import {
  api,
  type RoomSessionResponse,
  type RoomSnapshot,
} from "../services/api";

const ROOM_STORAGE_KEY = "scribble:lastRoomCode";

function participantStorageKey(code: string) {
  return `scribble:participant:${code}`;
}

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
    isLoading: false,
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
      ...nextState,
    };
    this.listeners.forEach((listener) => listener());
  }

  private async withLoading<T>(operation: () => Promise<T>) {
    this.setState({
      isLoading: true,
      error: null,
    });

    try {
      return await operation();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected request failure";
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
      error: null,
    });

    try {
      if (response.room && response.room.code && response.participantId) {
        localStorage.setItem(ROOM_STORAGE_KEY, response.room.code);
        localStorage.setItem(
          participantStorageKey(response.room.code),
          response.participantId,
        );
      }
    } catch {
      // ignore storage errors
    }
  }

  setRoomSnapshot(room: RoomSnapshot) {
    this.setState({
      room,
      error: null,
    });
  }

  async createRoom(playerName: string) {
    const response = await this.withLoading(() => api.createRoom(playerName));
    this.setRoomSession(response);
    return response;
  }

  async joinRoom(code: string, playerName: string) {
    const response = await this.withLoading(() =>
      api.joinRoom(code, playerName),
    );
    this.setRoomSession(response);
    return response;
  }

  async restoreRoomSession() {
    const code = this.getStoredRoomCode();
    const participantId = code ? this.getStoredParticipantId(code) : null;

    if (!code || !participantId) {
      return null;
    }

    try {
      const response = await api.fetchRoom(code, participantId);
      this.setState({
        participantId,
        room: response.room,
        error: null,
      });
      return response;
    } catch (error) {
      this.clearStoredParticipantForRoom(code);
      const message =
        error instanceof Error ? error.message : "Unable to restore room";
      this.setState({ error: message });
      return null;
    }
  }

  async fetchRoom() {
    if (!this.state.room) {
      return null;
    }

    // Attempt to hydrate participantId from localStorage if missing
    if (!this.state.participantId && this.state.room.code) {
      try {
        const stored = localStorage.getItem(
          participantStorageKey(this.state.room.code),
        );
        if (stored) {
          this.setState({ participantId: stored });
        }
      } catch {
        // ignore storage errors
      }
    }

    if (!this.state.participantId) {
      return null;
    }

    const response = await api.fetchRoom(
      this.state.room.code,
      this.state.participantId,
    );
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  clearStoredParticipantForRoom(code?: string) {
    try {
      const roomCode = code ?? this.getStoredRoomCode();

      if (roomCode) {
        localStorage.removeItem(participantStorageKey(roomCode));
      }

      if (!code) {
        localStorage.removeItem(ROOM_STORAGE_KEY);
      } else {
        const currentKey = this.getStoredRoomCode();
        if (!currentKey || currentKey === roomCode) {
          localStorage.removeItem(ROOM_STORAGE_KEY);
        }
      }
    } catch {}

    this.setState({ participantId: null });
  }

  private getStoredRoomCode() {
    try {
      return localStorage.getItem(ROOM_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private getStoredParticipantId(code: string) {
    try {
      return localStorage.getItem(participantStorageKey(code));
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

  return createElement(
    RoomStoreContext.Provider,
    { value: storeRef.current },
    children,
  );
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
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
}
