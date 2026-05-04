import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { Star, MessageCircle, Users, Trophy } from 'lucide-react';
import type { RelationshipTier } from '../types/index.js';

const TIER_COLORS: Record<RelationshipTier, string> = {
  'New Acquaintances': '#6b7280',
  'Good Partners': '#3b82f6',
  'Trusted Allies': '#8b5cf6',
  'Soulmates': '#f59e0b',
};

const TIER_ICONS: Record<RelationshipTier, string> = {
  'New Acquaintances': '\u{1F91D}',
  'Good Partners': '\u{1F4AA}',
  'Trusted Allies': '\u{2B50}',
  'Soulmates': '\u{2764}\u{FE0F}',
};

interface ScoreDisplayProps {
  variant?: 'hud' | 'inline';
}

export default function ScoreDisplay({ variant = 'hud' }: ScoreDisplayProps) {
  const { cumulativeScore, relationshipTier, lastScoreUpdate } = useGameStore();
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showPulse, setShowPulse] = useState(false);

  // Animate score changes
  useEffect(() => {
    if (cumulativeScore === animatedScore) return;
    const diff = cumulativeScore - animatedScore;
    const step = Math.max(1, Math.ceil(Math.abs(diff) / 15));
    const dir = diff > 0 ? 1 : -1;
    const timer = setInterval(() => {
      setAnimatedScore((prev) => {
        const next = prev + dir * step;
        if ((dir > 0 && next >= cumulativeScore) || (dir < 0 && next <= cumulativeScore)) {
          clearInterval(timer);
          return cumulativeScore;
        }
        return next;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [cumulativeScore]);

  // Pulse effect on new score
  useEffect(() => {
    if (lastScoreUpdate) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 600);
      return () => clearTimeout(timer);
    }
  }, [lastScoreUpdate]);

  const tier = relationshipTier as RelationshipTier;
  const tierColor = TIER_COLORS[tier] ?? '#6b7280';
  const tierIcon = TIER_ICONS[tier] ?? '';

  if (variant === 'hud') {
    return (
      <div
        className={`score-display-hud ${showPulse ? 'score-pulse' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px',
          borderRadius: 8,
          background: 'var(--card)',
          border: `1px solid ${tierColor}33`,
          transition: 'border-color 0.3s',
        }}
      >
        <Star size={14} style={{ color: '#e9c46a' }} />
        <span
          style={{
            fontFamily: 'ui-monospace, Consolas, monospace',
            fontWeight: 700,
            fontSize: 14,
            color: '#e9c46a',
            minWidth: 32,
          }}
        >
          {animatedScore}
        </span>
        <span style={{ fontSize: 12, color: tierColor }}>
          {tierIcon}
        </span>
      </div>
    );
  }

  // Inline variant — used in victory / end-of-room card
  const puzzleScore = lastScoreUpdate?.puzzleScore;

  return (
    <div
      className="score-display-inline"
      style={{
        background: 'var(--card)',
        borderRadius: 12,
        padding: 20,
        border: `1px solid ${tierColor}44`,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 4 }}>
          Total Score
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: '#e9c46a', fontFamily: 'ui-monospace, Consolas, monospace' }}>
          {animatedScore}
        </div>
        <div style={{ fontSize: 14, color: tierColor, fontWeight: 600, marginTop: 4 }}>
          {tierIcon} {tier}
        </div>
      </div>

      {puzzleScore && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Last Puzzle
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Base</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>+{puzzleScore.basePoints}</span>
          </div>
          {puzzleScore.deductions > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Deductions</span>
              <span style={{ color: 'var(--accent-red)', fontWeight: 600, fontSize: 13 }}>-{puzzleScore.deductions}</span>
            </div>
          )}
          {puzzleScore.bonusPoints > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Speed Bonus</span>
              <span style={{ color: 'var(--accent-teal)', fontWeight: 600, fontSize: 13 }}>+{puzzleScore.bonusPoints}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 6 }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>Score</span>
            <span style={{ color: '#e9c46a', fontWeight: 700, fontSize: 14 }}>{puzzleScore.finalScore}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Full game score card for the victory page
export function GameScoreCard() {
  const { finalScore } = useGameStore();
  const gameScore = finalScore?.gameScore;

  if (!gameScore) return null;

  const tier = gameScore.relationshipTier;
  const tierColor = TIER_COLORS[tier] ?? '#6b7280';
  const tierIcon = TIER_ICONS[tier] ?? '';

  const totalMinutes = Math.floor(gameScore.totalTimeMs / 60_000);
  const totalSeconds = Math.floor((gameScore.totalTimeMs % 60_000) / 1000);

  return (
    <div
      className="game-score-card"
      style={{
        background: 'var(--card)',
        borderRadius: 16,
        padding: 24,
        border: `2px solid ${tierColor}55`,
        textAlign: 'center',
      }}
    >
      {/* Relationship Tier */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{tierIcon}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: tierColor }}>{tier}</div>
      </div>

      {/* Total Score */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>
          Final Score
        </div>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#e9c46a', fontFamily: 'ui-monospace, Consolas, monospace' }}>
          {gameScore.totalScore}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trophy size={16} style={{ color: '#e9c46a' }} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Time
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {totalMinutes}m {totalSeconds}s
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageCircle size={16} style={{ color: 'var(--accent-teal)' }} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Messages
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {gameScore.communicationStats.totalMessages}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={16} style={{ color: '#f59e0b' }} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Communication
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {gameScore.communicationStats.rating}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} style={{ color: '#8b5cf6' }} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Cooperation
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {gameScore.cooperationScore}%
            </div>
          </div>
        </div>
      </div>

      {/* Room breakdown */}
      {gameScore.roomScores.length > 0 && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8 }}>
            Room Breakdown
          </div>
          {gameScore.roomScores.map((rs) => (
            <div
              key={rs.roomIndex}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 0',
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{rs.roomName}</span>
              <span style={{ color: '#e9c46a', fontWeight: 600 }}>{rs.totalScore}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
