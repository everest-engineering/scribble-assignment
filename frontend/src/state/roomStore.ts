import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren
} from "react";
import { api, type RoomSessionResponse, type RoomSnapshot, type StrokeData } from "../services/api";

export interface RoomState {
  room: RoomSnapshot | null;
  participantId: string | null;
  error: string | null;
  isLoading: boolean;
  canvasStrokes: StrokeData[];
  localStrokes: StrokeData[];
  guessFeedback: { type: "correct" | "incorrect" | "error" | "already-guessed"; message: string } | null;
  guessError: string | null;
}

type Listener = () => void;

const POLL_INTERVAL = 2000;

class RoomStore {
  private state: RoomState = {
    room: null,
    participantId: null,
    error: null,
    isLoading: false,
    canvasStrokes: [],
    localStrokes: [],
    guessFeedback: null,
    guessError: null
  };

  private listeners = new Set<Listener>();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private canvasPollTimer: ReturnType<typeof setInterval> | null = null;

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

  startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      this.fetchRoom().catch(() => {});
    }, POLL_INTERVAL);
  }

  stopPolling() {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  startCanvasPolling() {
    this.stopCanvasPolling();
    this.canvasPollTimer = setInterval(() => {
      this.fetchCanvas().catch(() => {});
    }, POLL_INTERVAL);
  }

  stopCanvasPolling() {
    if (this.canvasPollTimer !== null) {
      clearInterval(this.canvasPollTimer);
      this.canvasPollTimer = null;
    }
  }

  async fetchCanvas() {
    if (!this.state.room || !this.state.participantId) {
      return;
    }

    try {
      const response = await api.fetchCanvas(this.state.room.code, this.state.participantId);
      this.setState({ canvasStrokes: response.strokes });
    } catch {
      // silent — polling errors are expected on network blips
    }
  }

  addLocalStroke(stroke: StrokeData) {
    this.setState({ localStrokes: [...this.state.localStrokes, stroke] });
  }

  clearLocalStrokes() {
    this.setState({ localStrokes: [] });
  }

  reset() {
    this.stopPolling();
    this.stopCanvasPolling();
    this.setState({
      room: null,
      participantId: null,
      error: null,
      isLoading: false,
      canvasStrokes: [],
      localStrokes: [],
      guessFeedback: null,
      guessError: null
    });
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

  async leaveRoom() {
    if (!this.state.room || !this.state.participantId) {
      return;
    }

    await api.leaveRoom(this.state.room.code, this.state.participantId);
    this.reset();
  }

  setGuessFeedback(feedback: RoomState["guessFeedback"]) {
    this.setState({ guessFeedback: feedback });
  }

  async submitGuess(text: string) {
    if (!this.state.room || !this.state.participantId) {
      return null;
    }

    try {
      this.setState({ guessError: null });
      const result = await api.submitGuess(this.state.room.code, this.state.participantId, text);

      if (result.alreadyGuessed) {
        this.setGuessFeedback({ type: "already-guessed", message: "Already guessed correctly!" });
      } else if (result.correct) {
        this.setGuessFeedback({ type: "correct", message: "Correct!" });
      } else {
        this.setGuessFeedback({ type: "incorrect", message: "Incorrect guess" });
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit guess";
      this.setState({ guessError: message });
      return null;
    }
  }

  async endRound() {
    if (!this.state.room || !this.state.participantId) {
      return;
    }

    await api.endRound(this.state.room.code, this.state.participantId);
    await this.fetchRoom();
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
