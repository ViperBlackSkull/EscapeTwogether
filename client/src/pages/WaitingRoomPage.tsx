import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore.js';
import { useRoom } from '../hooks/useRoom.js';
import Layout from '../components/Layout.js';
import { useEffect } from 'react';
import { Copy, LogOut, Play } from 'lucide-react';

export default function WaitingRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { room, playerId, error } = useGameStore();
  const { leaveRoom, startGame } = useRoom();

  const isHost = room?.players[0]?.id === playerId;
  const canStart = room && room.players.length === 2 && isHost;
  const partner = room?.players.find((p) => p.id !== playerId);

  useEffect(() => {
    if (!room) {
      navigate('/');
    }
  }, [room, navigate]);

  useEffect(() => {
    if (room?.state === 'playing') {
      navigate(`/game/${room.id}`);
    }
  }, [room?.state, room?.id, navigate]);

  const handleCopyCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
    }
  };

  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };

  const handleStart = () => {
    startGame();
  };

  if (!room) return null;

  return (
    <Layout>
      <div className="page-enter" style={{ maxWidth: 480, width: '100%', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginTop: '15vh' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Room Code
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
            <span className="room-code">{roomId}</span>
            <button
              onClick={handleCopyCode}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 8 }}
              title="Copy room code"
            >
              <Copy size={20} />
            </button>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Share this code with your partner</p>
        </div>

        <div className="card" style={{ marginTop: 40 }}>
          <div style={{ marginBottom: 24 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Players ({room.players.length}/2)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {room.players.map((player, i) => (
                <div
                  key={player.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: i === 0 ? 'var(--accent-amber)' : 'var(--accent-teal)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                      color: 'var(--bg-deep)',
                    }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600 }}>{player.name}</span>
                    {i === 0 && (
                      <span style={{ color: 'var(--accent-gold)', fontSize: 12, marginLeft: 8 }}>Host</span>
                    )}
                  </div>
                  {player.id === playerId && (
                    <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>You</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {room.players.length < 2 && (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-dim)' }}>
              <span className="pulse">Waiting for Player 2...</span>
            </div>
          )}

          {partner && room.players.length === 2 && !isHost && (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--accent-teal)', fontSize: 14 }}>
              Waiting for the host to start the game...
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--accent-red)', fontSize: 14, textAlign: 'center', padding: '8px 12px', background: 'rgba(231,111,81,0.1)', borderRadius: 'var(--radius)', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {canStart && (
              <button
                className="btn btn-primary"
                onClick={handleStart}
                style={{ flex: 1, padding: '14px 24px' }}
              >
                <Play size={18} />
                Start Game
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={handleLeave}
              style={{ flex: isHost ? undefined : 1, padding: '14px 24px' }}
            >
              <LogOut size={18} />
              Leave
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
