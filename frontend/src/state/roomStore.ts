import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren
} from "react";
import {
  api,
  ApiError,
  type DrawingPoint,
  type RoomSessionResponse,
  type RoomSnapshot,
  type RoomStatus
} from "../services/api";

export interface RoomState {
  room: RoomSnapshot | null;
  participantId: string | null;
  hostParticipantId: string | null;
  roomStatus: RoomStatus | null;
  error: string | null;
  isLoading: boolean;
}

type Listener = () => void;

const POLLING_INTERVAL_MS = 2000;
const STORAGE_KEY = "scribble.room-session";

interface StoredRoomSession {
  participantId: string;
  room: RoomSnapshot;
}

function isRoomStatus(value: unknown): value is RoomStatus {
  return value === "lobby" || value === "game" || value === "result";
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export class RoomStore {
  private state: RoomState;

  private listeners = new Set<Listener>();
  private pollingIntervalId: number | null = null;
  private beforeUnloadHandler: (() => void) | null = null;

  constructor() {
    this.state = this.loadStoredSession() ?? {
      room: null,
      participantId: null,
      hostParticipantId: null,
      roomStatus: null,
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

  private loadStoredSession(): RoomState | null {
    if (typeof window === "undefined") {
      return null;
    }

    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    try {
      const parsed = JSON.parse(storedValue) as unknown;

      if (
        !isObjectRecord(parsed) ||
        typeof parsed.participantId !== "string" ||
        !isObjectRecord(parsed.room) ||
        typeof parsed.room.code !== "string" ||
        !isRoomStatus(parsed.room.status) ||
        typeof parsed.room.hostParticipantId !== "string"
      ) {
        throw new Error("Invalid stored room session");
      }

      const room = parsed.room as unknown as RoomSnapshot;
      const participantId = parsed.participantId as string;

      return {
        room,
        participantId,
        hostParticipantId: room.hostParticipantId,
        roomStatus: room.status,
        error: null,
        isLoading: false
      };
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  private persistRoomSession() {
    if (typeof window === "undefined") {
      return;
    }

    if (!this.state.room || !this.state.participantId) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const payload: StoredRoomSession = {
      participantId: this.state.participantId,
      room: this.state.room
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  private clearRoomSession() {
    this.setState({
      room: null,
      participantId: null,
      hostParticipantId: null,
      roomStatus: null,
      error: null
    });
    this.persistRoomSession();
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

  private async withMutation<T>(operation: () => Promise<T>) {
    this.setState({ error: null });

    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected request failure";
      this.setState({ error: message });
      throw error;
    }
  }

  private async pollRoom() {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    const room = await this.fetchRoom();

    if (!room) {
      this.stopLobbyPolling();
      return null;
    }

    return room;
  }

  private handleBeforeUnload = () => {
    if (this.state.room?.status !== "lobby" || !this.state.room || !this.state.participantId) {
      return;
    }

    const payload = JSON.stringify({
      participantId: this.state.participantId
    });

    try {
      const body = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}/rooms/${encodeURIComponent(this.state.room.code)}/leave`,
        body
      );
    } catch {
      void api.leaveRoom(this.state.room.code, this.state.participantId);
    }
  };

  setRoomSession(response: RoomSessionResponse) {
    this.setState({
      participantId: response.participantId,
      hostParticipantId: response.room.hostParticipantId,
      roomStatus: response.room.status,
      room: response.room,
      error: null
    });
    this.persistRoomSession();
  }

  setRoomSnapshot(room: RoomSnapshot) {
    this.setState({
      room,
      hostParticipantId: room.hostParticipantId,
      roomStatus: room.status,
      error: null
    });
    this.persistRoomSession();
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

  async startRoom(code: string) {
    if (!this.state.participantId) {
      throw new Error("Missing participant session");
    }

    const response = await this.withLoading(() => api.startRoom(code, this.state.participantId!));
    this.setRoomSnapshot(response.room);
    return response;
  }

  async restartRoom(code: string) {
    if (!this.state.participantId) {
      throw new Error("Missing participant session");
    }

    const response = await this.withLoading(() => api.restartRoom(code, this.state.participantId!));
    this.setRoomSnapshot(response.room);
    return response;
  }

  async submitStroke(points: DrawingPoint[]) {
    if (!this.state.room || !this.state.participantId) {
      throw new Error("Missing participant session");
    }

    if (points.length === 0) {
      throw new Error("Drawing stroke requires at least one point");
    }

    const response = await this.withMutation(() =>
      api.submitStroke(this.state.room!.code, this.state.participantId!, points)
    );
    this.setRoomSnapshot(response.room);
    return response;
  }

  async clearCanvas() {
    if (!this.state.room || !this.state.participantId) {
      throw new Error("Missing participant session");
    }

    const response = await this.withMutation(() =>
      api.clearCanvas(this.state.room!.code, this.state.participantId!)
    );
    this.setRoomSnapshot(response.room);
    return response;
  }

  async submitGuess(guess: string) {
    if (!this.state.room || !this.state.participantId) {
      throw new Error("Missing participant session");
    }

    const normalizedGuess = guess.trim();

    if (!normalizedGuess) {
      const error = new Error("Guess cannot be empty");
      this.setState({ error: error.message });
      throw error;
    }

    const response = await this.withMutation(() =>
      api.submitGuess(this.state.room!.code, this.state.participantId!, normalizedGuess)
    );
    this.setRoomSnapshot(response.room);
    return response;
  }

  async fetchRoom() {
    if (!this.state.room) {
      return null;
    }

    try {
      const response = await api.fetchRoom(this.state.room.code, this.state.participantId ?? undefined);
      this.setRoomSnapshot(response.room);
      return response.room;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        this.clearRoomSession();
        return null;
      }

      throw error;
    }
  }

  async leaveRoom() {
    const roomCode = this.state.room?.code;
    const participantId = this.state.participantId;

    if (!roomCode || !participantId) {
      return;
    }

    try {
      await api.leaveRoom(roomCode, participantId);
    } catch {
      // best-effort cleanup during navigation or tab close
    } finally {
      this.stopLobbyPolling();
      this.clearRoomSession();
    }
  }

  startLobbyPolling() {
    if (typeof window === "undefined" || this.pollingIntervalId !== null) {
      return;
    }

    this.beforeUnloadHandler ??= () => {
      void this.leaveRoom();
    };

    window.addEventListener("beforeunload", this.beforeUnloadHandler);
    window.addEventListener("pagehide", this.beforeUnloadHandler);

    const tick = () => {
      void this.pollRoom().catch((error) => {
        const message = error instanceof Error ? error.message : "Unable to refresh room";
        this.setState({ error: message });
      });
    };

    this.pollingIntervalId = window.setInterval(tick, POLLING_INTERVAL_MS);
    tick();
  }

  stopLobbyPolling() {
    if (typeof window !== "undefined" && this.beforeUnloadHandler) {
      window.removeEventListener("beforeunload", this.beforeUnloadHandler);
      window.removeEventListener("pagehide", this.beforeUnloadHandler);
    }

    if (this.pollingIntervalId !== null) {
      window.clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
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
