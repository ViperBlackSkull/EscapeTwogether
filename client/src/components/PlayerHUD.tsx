import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { Clock, User, Wifi, WifiOff } from 'lucide-react';
import ScoreDisplay from './ScoreDisplay.js';
import AudioToggle from './AudioToggle.js';

export default function PlayerHUD() {
  const { room, playerId, playerName } = useGameStore();
  const [elapsed, setElapsed] = useState(0);

  const partner = room?.players.find((p) => p.id !== playerId);

  useEffect(() => {
    if (!room || room.state === 'waiting' || !room.startedAt) return;

    const getElapsed = () => {
      const startMs = room.startedAt!;
      if (room.state === 'completed' && room.completedAt) {
        return Math.floor((room.completedAt - startMs - room.totalPausedMs) / 1000);
      }
      if (room.roomPausedAt) {
        return Math.floor((room.roomPausedAt - startMs - room.totalPausedMs) / 1000);
      }
      return Math.floor((Date.now() - startMs - room.totalPausedMs) / 1000);
    };

    const tick = () => setElapsed(getElapsed());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [room]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="hud page-enter">
      <div className="hud-left">
        <div className="hud-player">
          <User size={16} />
          <span>{playerName ?? 'You'}</span>
        </div>
        <div className="hud-partner">
          {partner ? (
            <>
              <Wifi size={14} style={{ color: 'var(--accent-teal)' }} />
              <span>{partner.name}</span>
            </>
          ) : (
            <>
              <WifiOff size={14} style={{ color: 'var(--accent-red)' }} />
              <span style={{ color: 'var(--text-dim)' }}>No partner</span>
            </>
          )}
        </div>
      </div>
      <div className="hud-center">
        <div className="hud-room-code">{room?.id}</div>
      </div>
      <div className="hud-right">
        <ScoreDisplay variant="hud" />
        <AudioToggle />
        <div className="hud-timer">
          <Clock size={16} />
          <span className="hud-timer-value">{timeStr}</span>
        </div>
      </div>
    </div>
  );
}
