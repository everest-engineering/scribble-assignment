import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren
} from "react";
import { ApiError, api, type RoomSessionResponse, type RoomSnapshot } from "../services/api";

export interface RoomState {
  room: RoomSnapshot | null;
  participantId: string | null;
  error: string | null;
  isLoading: boolean;
  roomMissing: boolean;
}

const SESSION_KEY_PARTICIPANT = "scribble.participantId";
const SESSION_KEY_CODE = "scribble.roomCode";

type Listener = () => void;

function readSession(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function buildShellRoom(code: string): RoomSnapshot {
  return {
    code,
    status: "lobby",
    participants: [],
    hostParticipantId: "",
    viewerIsHost: false,
    canStart: false,
    availableWords: [],
    roles: [],
    round: null
  };
}

class RoomStore {
  private state: RoomState;
  private listeners = new Set<Listener>();

  constructor() {
    const storedId = readSession(SESSION_KEY_PARTICIPANT);
    const storedCode = readSession(SESSION_KEY_CODE);

    this.state = {
      room: storedCode ? buildShellRoom(storedCode) : null,
      participantId: storedId,
      error: null,
      isLoading: false,
      roomMissing: false
    };
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;

  private setState(nextState: Partial<RoomState>) {
    this.state = { ...this.state, ...nextState };
    this.listeners.forEach((listener) => listener());
  }

  private async withLoading<T>(operation: () => Promise<T>) {
    this.setState({ isLoading: true, error: null });

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
    writeSession(SESSION_KEY_PARTICIPANT, response.participantId);
    writeSession(SESSION_KEY_CODE, response.room.code);
    this.setState({
      participantId: response.participantId,
      room: response.room,
      error: null,
      roomMissing: false
    });
  }

  setRoomSnapshot(room: RoomSnapshot) {
    writeSession(SESSION_KEY_CODE, room.code);
    this.setState({ room, error: null, roomMissing: false });
  }

  clearSession() {
    writeSession(SESSION_KEY_PARTICIPANT, null);
    writeSession(SESSION_KEY_CODE, null);
    this.setState({ room: null, participantId: null, roomMissing: true });
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
    if (!code) return null;

    try {
      const response = await api.fetchRoom(code, this.state.participantId ?? undefined);
      this.setRoomSnapshot(response.room);
      return response.room;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        this.clearSession();
        return null;
      }
      // Transient error: keep the last known room visible (FR-012).
      const message = error instanceof Error ? error.message : "Refresh failed";
      this.setState({ error: message });
      return null;
    }
  }

  async startRoom() {
    const code = this.state.room?.code;
    const participantId = this.state.participantId;
    if (!code || !participantId) return null;
    const response = await this.withLoading(() => api.startRoom(code, participantId));
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  async submitGuess(text: string) {
    const code = this.state.room?.code;
    const participantId = this.state.participantId;
    if (!code || !participantId) return null;
    try {
      const response = await api.submitGuess(code, participantId, text);
      this.setRoomSnapshot(response.room);
      return response.room;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Guess submission failed";
      this.setState({ error: message });
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

// Exported for tests only.
export { RoomStore };
