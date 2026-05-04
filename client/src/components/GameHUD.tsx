import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { useRoom } from '../hooks/useRoom.js';
import { ROOMS } from '../types/index.js';
import { Clock, User, Wifi, WifiOff, Settings, ChevronLeft, ChevronRight, MessageCircle, Briefcase } from 'lucide-react';
import ScoreDisplay from './ScoreDisplay.js';
import AudioToggle from './AudioToggle.js';
import ClueInventory from './ClueInventory.js';
import PuzzleList from './PuzzleList.js';
import GameSettings from './GameSettings.js';

export default function GameHUD({ onPuzzleClick }: { onPuzzleClick?: (puzzleId: string) => void }) {
  const { room, playerId, playerName } = useGameStore();
  const { leaveRoom } = useRoom();
  const [elapsed, setElapsed] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

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

  if (!room || room.state === 'waiting') return null;

  const currentRoomIndex = room.currentRoomIndex;
  const currentRoom = ROOMS[currentRoomIndex];
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <>
      {/* Top Bar */}
      <div className="game-hud page-enter">
        <div className="game-hud-left">
          <div className="game-hud-player-info">
            <div className="game-hud-player">
              <User size={14} />
              <span>{playerName ?? 'You'}</span>
            </div>
            <div className="game-hud-partner">
              {partner ? (
                <>
                  <Wifi size={12} style={{ color: 'var(--accent-teal)' }} />
                  <span>{partner.name}</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} style={{ color: 'var(--accent-red)' }} />
                  <span style={{ color: 'var(--text-dim)' }}>No partner</span>
                </>
              )}
            </div>
          </div>
          <button
            className={`game-hud-sidebar-toggle ${leftSidebarOpen ? 'active' : ''}`}
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            title="Chat"
          >
            <MessageCircle size={16} />
          </button>
        </div>

        <div className="game-hud-center">
          <div className="game-hud-room-info">
            <span className="game-hud-room-name">{currentRoom?.name ?? `Room ${currentRoomIndex + 1}`}</span>
            <span className="game-hud-room-progress">Room {currentRoomIndex + 1}/{ROOMS.length}</span>
          </div>
          <div className="game-hud-timer">
            <Clock size={14} />
            <span className="game-hud-timer-value">{timeStr}</span>
          </div>
        </div>

        <div className="game-hud-right">
          <ScoreDisplay variant="hud" />
          <AudioToggle />
          <button
            className={`game-hud-sidebar-toggle ${rightSidebarOpen ? 'active' : ''}`}
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            title="Inventory"
          >
            <Briefcase size={16} />
          </button>
          <button
            className="game-hud-settings-btn"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Left Sidebar - Chat toggle (minimal, just the toggle since ChatPanel is integrated into GamePage) */}
      {leftSidebarOpen && (
        <div className="game-hud-left-sidebar">
          <div className="game-hud-sidebar-header">
            <span>Chat</span>
            <button className="game-hud-sidebar-close" onClick={() => setLeftSidebarOpen(false)}>
              <ChevronLeft size={16} />
            </button>
          </div>
          <div className="game-hud-sidebar-body">
            <p className="game-hud-sidebar-note">
              Use the chat panel on the right side of the game area to communicate with your partner.
            </p>
          </div>
        </div>
      )}

      {/* Right Sidebar - Inventory & Puzzles */}
      {rightSidebarOpen && (
        <div className="game-hud-right-sidebar">
          <div className="game-hud-sidebar-header">
            <span>Inventory</span>
            <button className="game-hud-sidebar-close" onClick={() => setRightSidebarOpen(false)}>
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="game-hud-sidebar-body">
            <PuzzleList onPuzzleClick={onPuzzleClick} />
            <div className="game-hud-sidebar-divider" />
            <ClueInventory />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <GameSettings
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onLeaveGame={() => {
          leaveRoom();
          setShowSettings(false);
        }}
      />
    </>
  );
}
