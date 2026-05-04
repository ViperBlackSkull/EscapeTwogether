import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore.js';
import { useRoom } from '../hooks/useRoom.js';
import { socket } from '../lib/socket.js';
import Layout from '../components/Layout.js';

export default function LobbyPage() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const { createRoom, joinRoom } = useRoom();
  const { setPlayerName: storeName, error } = useGameStore();
  const navigate = useNavigate();

  if (!socket.connected) {
    socket.connect();
  }

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
    <Layout>
      <div className="lobby page-enter" style={{ maxWidth: 480, width: '100%', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48, marginTop: '20vh' }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent-amber)', margin: 0 }}>
            EscapeTwogether
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Cooperative escape rooms for two players
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label
              htmlFor="player-name"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}
            >
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
            className="btn btn-primary"
            onClick={handleCreateRoom}
            disabled={!playerName.trim()}
            style={{ width: '100%', padding: '14px 24px' }}
          >
            Create Room
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-dim)', fontSize: 13 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            OR
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <div>
            <label
              htmlFor="room-code"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}
            >
              Room Code
            </label>
            <input
              id="room-code"
              className="input"
              placeholder="Enter 4-character code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => handleKeyDown(e, handleJoinRoom)}
              maxLength={4}
              style={{ textTransform: 'uppercase', letterSpacing: 4, textAlign: 'center', fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 20 }}
            />
          </div>

          <button
            className="btn btn-teal"
            onClick={handleJoinRoom}
            disabled={!playerName.trim() || !roomCode.trim()}
            style={{ width: '100%', padding: '14px 24px' }}
          >
            Join Room
          </button>

          {error && (
            <div style={{ color: 'var(--accent-red)', fontSize: 14, textAlign: 'center', padding: '8px 12px', background: 'rgba(231, 111, 81, 0.1)', borderRadius: 'var(--radius)' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
