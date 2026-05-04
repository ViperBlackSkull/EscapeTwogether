import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.js';
import WaitingRoomPage from './pages/WaitingRoomPage.js';
import GamePage from './pages/GamePage.js';
import VictoryPage from './pages/VictoryPage.js';
import GameNotification from './components/GameNotification.js';

export default function App() {
  return (
    <BrowserRouter>
      <GameNotification />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/room/:roomId" element={<WaitingRoomPage />} />
        <Route path="/game/:roomId" element={<GamePage />} />
        <Route path="/victory/:roomId" element={<VictoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}
