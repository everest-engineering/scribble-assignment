import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { bindRoomNavigation } from "../state/roomStore";
import { CreateRoomPage } from "../pages/CreateRoomPage";
import { GamePage } from "../pages/GamePage";
import { JoinRoomPage } from "../pages/JoinRoomPage";
import { LobbyPage } from "../pages/LobbyPage";
import { ResultPage } from "../pages/ResultPage";
import { StartPage } from "../pages/StartPage";

function RoomNavigationBinder() {
  const navigate = useNavigate();

  useEffect(() => {
    bindRoomNavigation(navigate);
    return () => bindRoomNavigation(null);
  }, [navigate]);

  return null;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <RoomNavigationBinder />
      <AppShell>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/create-room" element={<CreateRoomPage />} />
          <Route path="/join-room" element={<JoinRoomPage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
