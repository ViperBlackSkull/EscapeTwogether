import { useState } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import type { RoomScore, PuzzleScore } from '../types/index.js';
import { Clock, Puzzle, Lightbulb, ChevronDown, ChevronRight, MessageCircle, Zap } from 'lucide-react';

const ROOM_ICONS = ['📩', '⚙️', '🧪', '🏛️', '🏛️'];

function formatTime(ms: number): string {
  const mins = Math.floor(ms / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);
  return `${mins}m ${secs}s`;
}

function PuzzleDetail({ score }: { score: PuzzleScore }) {
  return (
    <div className="timeline-puzzle-detail">
      <div className="timeline-puzzle-name">
        <Puzzle size={14} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
        <span style={{ textTransform: 'capitalize' }}>{score.puzzleType.replace(/-/g, ' ')}</span>
        <span className="timeline-puzzle-score">+{score.finalScore}</span>
      </div>
      <div className="timeline-puzzle-metrics">
        <div className="timeline-metric">
          <Clock size={12} />
          <span>{formatTime(score.metrics.timeElapsed)}</span>
        </div>
        {score.metrics.hintsUsed > 0 && (
          <div className="timeline-metric timeline-metric-hint">
            <Lightbulb size={12} />
            <span>{score.metrics.hintsUsed} hint{score.metrics.hintsUsed > 1 ? 's' : ''}</span>
          </div>
        )}
        {score.metrics.wrongAttempts > 0 && (
          <div className="timeline-metric timeline-metric-wrong">
            <Zap size={12} />
            <span>{score.metrics.wrongAttempts} miss{score.metrics.wrongAttempts > 1 ? 'es' : ''}</span>
          </div>
        )}
        {score.metrics.messagesExchanged > 0 && (
          <div className="timeline-metric">
            <MessageCircle size={12} />
            <span>{score.metrics.messagesExchanged} msgs</span>
          </div>
        )}
      </div>
      <div className="timeline-puzzle-breakdown">
        <span className="timeline-breakdown-base">+{score.basePoints} base</span>
        {score.deductions > 0 && <span className="timeline-breakdown-deduction">-{score.deductions}</span>}
        {score.bonusPoints > 0 && <span className="timeline-breakdown-bonus">+{score.bonusPoints} speed</span>}
      </div>
    </div>
  );
}

function TimelineRoomNode({
  roomScore,
  index,
  isLast,
}: {
  roomScore: RoomScore;
  index: number;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const icon = ROOM_ICONS[index] ?? '🏛️';

  return (
    <div className="timeline-room">
      <div className="timeline-room-left">
        <div className="timeline-room-icon">{icon}</div>
        {!isLast && <div className="timeline-connector" />}
      </div>
      <div className="timeline-room-content">
        <button
          className="timeline-room-header"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="timeline-room-title-row">
            <span className="timeline-room-name">{roomScore.roomName}</span>
            <span className="timeline-room-score">+{roomScore.totalScore}</span>
          </div>
          <div className="timeline-room-meta">
            <span className="timeline-room-duration">
              <Clock size={12} />
              {formatTime(roomScore.actualDurationMs)}
            </span>
            <span className="timeline-room-puzzles">
              {roomScore.puzzleScores.length} puzzle{roomScore.puzzleScores.length > 1 ? 's' : ''}
            </span>
          </div>
          {expanded ? (
            <ChevronDown size={16} className="timeline-expand-icon" />
          ) : (
            <ChevronRight size={16} className="timeline-expand-icon" />
          )}
        </button>
        {expanded && (
          <div className="timeline-room-details">
            {roomScore.puzzleScores.map((ps) => (
              <PuzzleDetail key={`${ps.puzzleType}-${ps.roomIndex}`} score={ps} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GameTimeline() {
  const { finalScore, completionNarrative } = useGameStore();
  const gameScore = finalScore?.gameScore;

  if (!gameScore) {
    return (
      <div className="timeline-empty">
        <p>Timeline data not available.</p>
      </div>
    );
  }

  const totalPuzzles = gameScore.roomScores.reduce(
    (sum, rs) => sum + rs.puzzleScores.length,
    0
  );

  return (
    <div className="game-timeline">
      <div className="timeline-summary">
        <div className="timeline-summary-item">
          <Clock size={16} style={{ color: 'var(--accent-gold)' }} />
          <span className="timeline-summary-value">{formatTime(gameScore.totalTimeMs)}</span>
          <span className="timeline-summary-label">Total Time</span>
        </div>
        <div className="timeline-summary-item">
          <Puzzle size={16} style={{ color: 'var(--accent-teal)' }} />
          <span className="timeline-summary-value">{totalPuzzles}</span>
          <span className="timeline-summary-label">Puzzles</span>
        </div>
        <div className="timeline-summary-item">
          <Lightbulb size={16} style={{ color: '#00bfff' }} />
          <span className="timeline-summary-value">
            {completionNarrative?.hintsUsed ?? gameScore.roomScores.reduce(
              (s, rs) => s + rs.puzzleScores.reduce((ps, p) => ps + p.metrics.hintsUsed, 0), 0
            )}
          </span>
          <span className="timeline-summary-label">Hints</span>
        </div>
        <div className="timeline-summary-item">
          <MessageCircle size={16} style={{ color: 'var(--accent-amber)' }} />
          <span className="timeline-summary-value">{gameScore.communicationStats.totalMessages}</span>
          <span className="timeline-summary-label">Messages</span>
        </div>
      </div>

      <div className="timeline-rooms">
        {gameScore.roomScores.map((rs, i) => (
          <TimelineRoomNode
            key={rs.roomIndex}
            roomScore={rs}
            index={i}
            isLast={i === gameScore.roomScores.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
