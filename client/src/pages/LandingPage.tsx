import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LogIn, HelpCircle } from 'lucide-react';
import { useGameStore } from '../stores/gameStore.js';
import { useRoom } from '../hooks/useRoom.js';
import { socket } from '../lib/socket.js';
import ParticleField from '../components/effects/ParticleField.js';
import HowToPlay, { hasSeenHowToPlay, markHowToPlaySeen } from '../components/HowToPlay.js';

const VERSION = 'v1.0.0';

export default function LandingPage() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const { createRoom, joinRoom } = useRoom();
  const { setPlayerName: storeName, error } = useGameStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  useEffect(() => {
    if (!hasSeenHowToPlay()) {
      const timer = setTimeout(() => setShowHowToPlay(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseHowToPlay = () => {
    setShowHowToPlay(false);
    markHowToPlaySeen();
  };

  const handleCreateRoom = () => {
    if (!playerName.trim()) return;
    storeName(playerName.trim());
    socket.once('room-joined', (room) => {
      navigate(`/room/${room.id}`);
    });
    createRoom(playerName.trim());
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    storeName(playerName.trim());
    socket.once('room-joined', (room) => {
      navigate(`/room/${room.id}`);
    });
    joinRoom(roomCode.trim(), playerName.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') action();
  };

  return (
    <div className="landing page-enter">
      <div className="landing-bg" />
      <ParticleField style="dust" count={30} />

      <div className="landing-content">
        <header className="landing-header">
          <h1 className="landing-title">
            <span className="landing-title-escape">Escape</span>
            <span className="landing-title-together">Twogether</span>
          </h1>
          <p className="landing-tagline">
            A two-player escape room built for two
          </p>
        </header>

        <div className="landing-card">
          <div className="landing-form-group">
            <label htmlFor="player-name" className="landing-label">
              Your Name
            </label>
            <input
              id="player-name"
              className="input"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleCreateRoom)}
              maxLength={20}
              autoFocus
            />
          </div>

          <button
            className="btn btn-primary landing-btn"
            onClick={handleCreateRoom}
            disabled={!playerName.trim()}
          >
            <Users size={18} />
            Create Room
          </button>

          <div className="landing-divider">
            <span>or join an existing room</span>
          </div>

          <div className="landing-join-row">
            <input
              id="room-code"
              className="input landing-code-input"
              placeholder="CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => handleKeyDown(e, handleJoinRoom)}
              maxLength={4}
            />
            <button
              className="btn btn-teal"
              onClick={handleJoinRoom}
              disabled={!playerName.trim() || !roomCode.trim()}
            >
              <LogIn size={18} />
              Join
            </button>
          </div>

          {error && (
            <div className="landing-error">
              {error}
            </div>
          )}
        </div>

        <button
          className="landing-how-to-play-btn"
          onClick={() => setShowHowToPlay(true)}
        >
          <HelpCircle size={16} />
          How to Play
        </button>

        <footer className="landing-footer">
          <span>EscapeTwogether {VERSION}</span>
        </footer>
      </div>

      <HowToPlay open={showHowToPlay} onClose={handleCloseHowToPlay} />
    </div>
  );
}
