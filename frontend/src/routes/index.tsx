import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { PageErrorBoundary } from "../components/PageErrorBoundary";
import { CreateRoomPage } from "../pages/CreateRoomPage";
import { GamePage } from "../pages/GamePage";
import { JoinRoomPage } from "../pages/JoinRoomPage";
import { LobbyPage } from "../pages/LobbyPage";
import { StartPage } from "../pages/StartPage";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route
            path="/create-room"
            element={
              <PageErrorBoundary>
                <CreateRoomPage />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/join-room"
            element={
              <PageErrorBoundary>
                <JoinRoomPage />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/lobby"
            element={
              <PageErrorBoundary>
                <LobbyPage />
              </PageErrorBoundary>
            }
          />
          <Route path="/game" element={<GamePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
