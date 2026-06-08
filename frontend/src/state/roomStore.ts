import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren
} from "react";
import { api, ApiError, type RoomSessionResponse, type RoomSnapshot } from "../services/api";

export interface RoomState {
  room: RoomSnapshot | null;
  participantId: string | null;
  error: string | null;
  isLoading: boolean;
  closed: boolean;
}

type Listener = () => void;

class RoomStore {
  private state: RoomState = {
    room: null,
    participantId: null,
    error: null,
    isLoading: false,
    closed: false
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
      error: null,
      closed: false
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

    try {
      const response = await api.fetchRoom(
        this.state.room.code,
        this.state.participantId ?? undefined
      );
      this.setRoomSnapshot(response.room);
      return response.room;
    } catch (error) {
      // A 404 while polling a room we were in means the room was closed
      // (the host left, or everyone departed). Eject the player. (FR-015)
      if (error instanceof ApiError && error.status === 404) {
        this.setState({
          room: null,
          closed: true,
          error: "The host left and the room was closed."
        });
        return null;
      }

      throw error;
    }
  }

  async startGame() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const code = this.state.room.code;
    const participantId = this.state.participantId;
    const response = await this.withLoading(() => api.startRoom(code, participantId));
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  // Submit a guess during the active round. The response carries the updated
  // snapshot (appended guess + any score change); other players converge on
  // their next poll. Errors (e.g. the 400 empty-guess message) propagate to the
  // caller via the rejected promise and the store's `error` state.
  async submitGuess(text: string) {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const code = this.state.room.code;
    const participantId = this.state.participantId;
    const response = await this.withLoading(() => api.submitGuess(code, participantId, text));
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  // Host ends the active round → the room moves to "ended" and the snapshot
  // reveals the word, final scores, and full history. Other players converge on
  // their next poll. (FR-001, FR-002)
  async endRound() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const code = this.state.room.code;
    const participantId = this.state.participantId;
    const response = await this.withLoading(() => api.endRound(code, participantId));
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  // Host restarts → the room returns to a fresh "lobby" (round cleared, scores
  // reset to 0, players preserved). Other players return to the lobby on their
  // next poll. (FR-008–FR-013)
  async restartGame() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const code = this.state.room.code;
    const participantId = this.state.participantId;
    const response = await this.withLoading(() => api.restartGame(code, participantId));
    this.setRoomSnapshot(response.room);
    return response.room;
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
