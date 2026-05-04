import { useGameStore } from '../stores/gameStore.js';
import { ROOMS } from '../types/index.js';
import { CheckCircle, Circle, Lock, Eye } from 'lucide-react';

type PuzzleStatus = 'solved' | 'available' | 'locked';

export default function PuzzleList({ onPuzzleClick }: { onPuzzleClick?: (puzzleId: string) => void }) {
  const { room, puzzleNarratives } = useGameStore();

  if (!room) return null;

  const currentRoomIndex = room.currentRoomIndex;
  const currentRoom = ROOMS[currentRoomIndex];
  if (!currentRoom) return null;

  const totalPuzzles = currentRoom.puzzles.length;
  const solvedCount = currentRoom.puzzles.filter((pid) => room.puzzles[pid]?.solved).length;

  return (
    <div className="puzzle-list">
      <div className="puzzle-list-header">
        <span className="puzzle-list-title">Puzzles</span>
        <span className="puzzle-list-count">{solvedCount}/{totalPuzzles}</span>
      </div>
      <div className="puzzle-list-items">
        {currentRoom.puzzles.map((puzzleId, idx) => {
          const puzzle = room.puzzles[puzzleId];
          const narrative = puzzleNarratives[puzzleId];
          const hotspot = currentRoom.hotspots.find((h) => h.id === puzzleId);
          const solved = puzzle?.solved ?? false;

          let status: PuzzleStatus = 'available';
          if (solved) {
            status = 'solved';
          } else if (idx > 0 && !room.puzzles[currentRoom.puzzles[idx - 1]]?.solved) {
            status = 'locked';
          }

          return (
            <div
              key={puzzleId}
              className={`puzzle-list-item puzzle-list-${status}`}
              onClick={() => {
                if (status !== 'locked' && onPuzzleClick) {
                  onPuzzleClick(puzzleId);
                }
              }}
            >
              <div className="puzzle-list-item-icon">
                {status === 'solved' ? (
                  <CheckCircle size={16} style={{ color: 'var(--accent-teal)' }} />
                ) : status === 'locked' ? (
                  <Lock size={16} style={{ color: 'var(--text-dim)' }} />
                ) : (
                  <Circle size={16} style={{ color: 'var(--accent-amber)' }} />
                )}
              </div>
              <div className="puzzle-list-item-info">
                <span className="puzzle-list-item-label">
                  {hotspot?.label ?? puzzleId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                {narrative && !solved && (
                  <span className="puzzle-list-item-hint">
                    <Eye size={10} /> {narrative.backstory.slice(0, 50)}...
                  </span>
                )}
                {solved && narrative && (
                  <span className="puzzle-list-item-solved-text">
                    {narrative.successMessage?.slice(0, 60)}
                    {narrative.successMessage && narrative.successMessage.length > 60 ? '...' : ''}
                  </span>
                )}
              </div>
              {solved && (
                <div className="puzzle-list-item-check">
                  <CheckCircle size={12} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
