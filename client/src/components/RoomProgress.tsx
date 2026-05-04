import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { ROOMS } from '../types/index.js';
import { MapPin, CheckCircle, Circle, Clock } from 'lucide-react';

export default function RoomProgress() {
  const { room } = useGameStore();
  const [elapsed, setElapsed] = useState(0);

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

  if (!room || room.state === 'waiting') return null;

  const currentIdx = room.currentRoomIndex;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="room-progress">
      <div className="room-progress-header">
        <div className="room-progress-rooms">
          {ROOMS.map((r, i) => {
            const roomPuzzles = r.puzzles;
            const allSolved = roomPuzzles.every((pt) => room.puzzles[pt]?.solved);
            const isCurrent = i === currentIdx;
            const isPast = i < currentIdx;

            return (
              <div
                key={i}
                className={`room-progress-step ${isCurrent ? 'room-progress-step-current' : ''} ${isPast || allSolved ? 'room-progress-step-done' : ''}`}
              >
                <div className="room-progress-icon">
                  {isPast || allSolved ? (
                    <CheckCircle size={16} />
                  ) : isCurrent ? (
                    <MapPin size={16} />
                  ) : (
                    <Circle size={16} />
                  )}
                </div>
                <span className="room-progress-label">{r.name}</span>
                {i < ROOMS.length - 1 && <div className="room-progress-connector" />}
              </div>
            );
          })}
        </div>
        <div className="room-progress-timer">
          <Clock size={14} />
          <span>{timeStr}</span>
        </div>
      </div>

      <div className="room-progress-puzzles">
        {ROOMS[currentIdx]?.puzzles.map((puzzleType) => {
          const puzzle = room.puzzles[puzzleType];
          return (
            <div
              key={puzzleType}
              className={`room-progress-puzzle ${puzzle?.solved ? 'room-progress-puzzle-solved' : ''}`}
            >
              {puzzle?.solved ? <CheckCircle size={12} /> : <Circle size={12} />}
              <span>{ROOMS[currentIdx].hotspots.find((h) => h.id === puzzleType)?.label ?? puzzleType}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
