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
  private state: RoomState;
  private listeners = new Set<Listener>();

  constructor() {
    let initialRoom: RoomSnapshot | null = null;
    let initialParticipantId: string | null = null;

    try {
      const saved = sessionStorage.getItem("scribble_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.room && parsed?.participantId) {
          initialRoom = parsed.room;
          initialParticipantId = parsed.participantId;
        }
      }
    } catch {
      // Ignore sessionStorage parsing errors
    }

    this.state = {
      room: initialRoom,
      participantId: initialParticipantId,
      error: null,
      isLoading: false
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
    try {
      sessionStorage.setItem(
        "scribble_session",
        JSON.stringify({
          participantId: response.participantId,
          room: response.room
        })
      );
    } catch {
      // Ignore sessionStorage write errors
    }
  }

  setRoomSnapshot(room: RoomSnapshot) {
    this.setState({
      room,
      error: null
    });
    try {
      const saved = sessionStorage.getItem("scribble_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.room = room;
        sessionStorage.setItem("scribble_session", JSON.stringify(parsed));
      }
    } catch {
      // Ignore
    }
  }

  clearSession() {
    this.setState({
      room: null,
      participantId: null,
      error: null
    });
    try {
      sessionStorage.removeItem("scribble_session");
    } catch {
      // Ignore
    }
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

    const response = await this.withLoading(() =>
      api.fetchRoom(this.state.room!.code, this.state.participantId ?? undefined)
    );
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
    await this.fetchRoom();
    return response;
  }

  async leaveRoom() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const response = await this.withLoading(() =>
      api.leaveRoom(this.state.room!.code, this.state.participantId!)
    );
    this.clearSession();
    return response;
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
