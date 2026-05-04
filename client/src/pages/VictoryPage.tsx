import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore.js';
import { useRoom } from '../hooks/useRoom.js';
import Layout from '../components/Layout.js';
import GameTimeline from '../components/GameTimeline.js';
import ParticleField from '../components/effects/ParticleField.js';
import {
  Trophy, RotateCcw, Users, Clock, Lightbulb, MessageCircle,
  Star, Share2, ChevronRight, Eye,
} from 'lucide-react';

type Phase = 'reveal' | 'scores' | 'relationship';
type View = 'main' | 'timeline';

const TIER_DESCRIPTIONS: Record<string, string> = {
  'New Acquaintances': "You've taken your first steps together. There's room to grow closer — try communicating more!",
  'Good Partners': "You work well as a team! Your coordination is solid and you're building trust.",
  'Trusted Allies': "Impressive partnership! You communicate effectively and rely on each other naturally.",
  'Soulmates': "An extraordinary bond! You moved as one through every challenge — true kindred spirits.",
};

export default function VictoryPage() {
  const navigate = useNavigate();
  const { room, playerId, playerName, completionNarrative, finalScore } = useGameStore();
  const { leaveRoom } = useRoom();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>('reveal');
  const [view, setView] = useState<View>('main');
  const [animScore, setAnimScore] = useState(0);
  const [showShareHint, setShowShareHint] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const gameScore = finalScore?.gameScore;

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }
    if (room.state !== 'completed') {
      navigate(`/game/${room.id}`);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, [room, navigate]);

  // Phase progression
  useEffect(() => {
    if (!visible) return;
    const timers = [
      setTimeout(() => setPhase('scores'), 3000),
      setTimeout(() => setPhase('relationship'), 7000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  // Animated score counter
  useEffect(() => {
    if (!gameScore || phase !== 'scores') return;
    const target = gameScore.totalScore;
    const step = Math.max(1, Math.ceil(target / 40));
    const timer = setInterval(() => {
      setAnimScore((prev) => {
        if (prev + step >= target) {
          clearInterval(timer);
          return target;
        }
        return prev + step;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [gameScore, phase]);

  const totalTime = room?.completedAt && room?.startedAt
    ? ((room.completedAt - room.startedAt) / 1000).toFixed(1)
    : '?';

  const partner = room?.players.find((p) => p.id !== playerId);
  const totalPuzzles = gameScore
    ? gameScore.roomScores.reduce((s, rs) => s + rs.puzzleScores.length, 0)
    : 0;
  const totalHints = gameScore
    ? gameScore.roomScores.reduce((s, rs) => s + rs.puzzleScores.reduce((ps, p) => ps + p.metrics.hintsUsed, 0), 0)
    : completionNarrative?.hintsUsed ?? 0;

  const handlePlayAgain = () => {
    leaveRoom();
    navigate('/');
  };

  const handleShare = useCallback(() => {
    if (!shareRef.current) return;
    setShowShareHint(true);
    setTimeout(() => setShowShareHint(false), 3000);
    if (navigator.share) {
      navigator.share({
        title: 'EscapeTwogether - Results',
        text: `We escaped in ${totalTime}s with a score of ${gameScore?.totalScore ?? 0}! Our relationship tier: ${gameScore?.relationshipTier ?? 'Unknown'}`,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Escaped in ${totalTime}s | Score: ${gameScore?.totalScore ?? 0} | ${gameScore?.relationshipTier ?? 'Unknown'} | ${totalPuzzles} puzzles solved`
      );
    }
  }, [totalTime, gameScore, totalPuzzles]);

  if (!room) return null;

  return (
    <Layout>
      <div className="victory-page page-enter" style={{ position: 'relative', overflow: 'hidden' }}>
        <ParticleField style="golden" count={25} />

        {/* Confetti */}
        <div className="confetti-container">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                backgroundColor: ['#f4a261', '#2a9d8f', '#e9c46a', '#e76f51', '#8b5cf6', '#3b82f6'][i % 6],
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
              }}
            />
          ))}
        </div>

        {view === 'timeline' ? (
          <div
            className={`victory-content ${visible ? 'victory-visible' : ''}`}
            style={{
              maxWidth: 600,
              width: '100%',
              padding: '0 24px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div style={{ marginTop: '5vh', marginBottom: 24 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setView('main')}
                style={{ marginBottom: 20, gap: 6, display: 'inline-flex', alignItems: 'center' }}
              >
                <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                Back to Results
              </button>
              <h2 style={{
                fontSize: 28, fontWeight: 800, margin: '0 0 8px',
                background: 'linear-gradient(135deg, #e9c46a, #f4a261)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Game Timeline
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                A room-by-room replay of your session
              </p>
            </div>
            <GameTimeline />
          </div>
        ) : (
          <div
            className={`victory-content ${visible ? 'victory-visible' : ''}`}
            style={{
              maxWidth: 520,
              width: '100%',
              padding: '0 24px',
              textAlign: 'center',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div style={{ marginTop: '6vh' }}>

              {/* Phase 1: Dramatic Reveal */}
              <div className={`victory-phase ${phase === 'reveal' ? 'victory-phase-active' : ''}`}
                   style={{ display: phase === 'reveal' ? 'block' : 'none' }}>
                <div className="victory-trophy-glow">
                  <Trophy size={64} color="#e9c46a" />
                </div>
                <h1 className="victory-title" style={{
                  fontSize: 42, fontWeight: 800, margin: '24px 0 8px',
                  background: 'linear-gradient(135deg, #e9c46a, #f4a261)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Congratulations!
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 8 }}>
                  You escaped together!
                </p>
                <div className="victory-team-line" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  color: 'var(--text-dim)', fontSize: 14,
                }}>
                  <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{playerName}</span>
                  <span>&</span>
                  <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>{partner?.name ?? 'Partner'}</span>
                </div>
              </div>

              {/* Phase 2: Score Breakdown */}
              <div className={`victory-phase ${phase === 'scores' ? 'victory-phase-active' : ''}`}
                   style={{ display: phase === 'reveal' ? 'none' : 'block' }}>

                {/* Relationship Tier Reveal (Phase 3) */}
                {phase === 'relationship' && gameScore && (
                  <div className="victory-tier-reveal">
                    <div style={{
                      fontSize: 48, fontWeight: 800, marginBottom: 4,
                      color: gameScore.relationshipTier === 'Soulmates' ? '#f59e0b'
                        : gameScore.relationshipTier === 'Trusted Allies' ? '#8b5cf6'
                        : gameScore.relationshipTier === 'Good Partners' ? '#3b82f6'
                        : '#6b7280',
                    }}>
                      {gameScore.relationshipTier === 'Soulmates' && '❤️'}
                      {gameScore.relationshipTier === 'Trusted Allies' && '⭐'}
                      {gameScore.relationshipTier === 'Good Partners' && '💪'}
                      {gameScore.relationshipTier === 'New Acquaintances' && '🤝'}
                    </div>
                    <div style={{
                      fontSize: 14, color: 'var(--text-dim)', textTransform: 'uppercase',
                      letterSpacing: 2, fontWeight: 600, marginBottom: 4,
                    }}>
                      You are
                    </div>
                    <div style={{
                      fontSize: 28, fontWeight: 800, marginBottom: 12,
                      color: gameScore.relationshipTier === 'Soulmates' ? '#f59e0b'
                        : gameScore.relationshipTier === 'Trusted Allies' ? '#8b5cf6'
                        : gameScore.relationshipTier === 'Good Partners' ? '#3b82f6'
                        : '#6b7280',
                    }}>
                      {gameScore.relationshipTier}!
                    </div>
                    <p style={{
                      color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5,
                      margin: '0 0 24px', fontStyle: 'italic', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto',
                    }}>
                      {TIER_DESCRIPTIONS[gameScore.relationshipTier] ?? ''}
                    </p>
                  </div>
                )}

                {/* Animated Score Counter */}
                {gameScore && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{
                      fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase',
                      letterSpacing: 1.5, fontWeight: 600, marginBottom: 4,
                    }}>
                      Final Score
                    </div>
                    <div style={{
                      fontSize: 56, fontWeight: 800, color: '#e9c46a',
                      fontFamily: 'ui-monospace, Consolas, monospace',
                    }}>
                      {phase === 'scores' ? animScore : gameScore.totalScore}
                    </div>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="card victory-stats" style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'left',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Clock size={18} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                        Time
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'ui-monospace, Consolas, monospace', color: 'var(--accent-gold)' }}>
                        {totalTime}s
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Trophy size={18} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                        Puzzles
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {completionNarrative?.puzzlesSolved ?? totalPuzzles}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Lightbulb size={18} style={{ color: '#00bfff', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                        Hints
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {totalHints}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MessageCircle size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                        Messages
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {gameScore?.communicationStats.totalMessages ?? 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cooperation + Communication */}
                {gameScore && (
                  <div className="card" style={{
                    marginTop: 12, display: 'flex', gap: 16,
                  }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                        Communication
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-teal)', marginTop: 4 }}>
                        {gameScore.communicationStats.rating}
                      </div>
                    </div>
                    <div style={{ width: 1, background: 'var(--border)' }} />
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                        Cooperation
                      </div>
                      <div style={{
                        fontSize: 18, fontWeight: 700, color: gameScore.cooperationScore >= 70
                          ? 'var(--accent-teal)' : gameScore.cooperationScore >= 40
                          ? 'var(--accent-amber)' : 'var(--accent-red)', marginTop: 4,
                      }}>
                        {gameScore.cooperationScore}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Shareable Results Card */}
                <div ref={shareRef} className="victory-share-card card" style={{ marginTop: 16, position: 'relative' }}>
                  <div style={{
                    fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase',
                    letterSpacing: 1.5, fontWeight: 600, marginBottom: 8, textAlign: 'center',
                  }}>
                    Results Card
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12,
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600, color: 'var(--accent-amber)',
                      }}>{playerName}</div>
                    </div>
                    <span style={{ color: 'var(--text-dim)', fontSize: 16 }}>&</span>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600, color: 'var(--accent-teal)',
                      }}>{partner?.name ?? 'Partner'}</div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'center', gap: 16,
                    fontSize: 12, color: 'var(--text-secondary)',
                  }}>
                    <span><Star size={12} style={{ color: '#e9c46a' }} /> {gameScore?.totalScore ?? 0}</span>
                    <span><Clock size={12} style={{ color: 'var(--accent-gold)' }} /> {totalTime}s</span>
                    <span><Users size={12} style={{ color: 'var(--accent-teal)' }} /> {gameScore?.relationshipTier ?? 'Unknown'}</span>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={handleShare}
                    style={{
                      marginTop: 12, width: '100%', gap: 6, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Share2 size={14} />
                    Share Results
                  </button>
                  {showShareHint && (
                    <div style={{
                      position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)',
                      fontSize: 11, color: 'var(--accent-teal)', whiteSpace: 'nowrap',
                    }}>
                      {'share' in navigator ? 'Sharing...' : 'Copied to clipboard!'}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    className="btn btn-primary"
                    onClick={handlePlayAgain}
                    style={{ width: '100%', padding: '16px 24px', fontSize: 16 }}
                  >
                    <RotateCcw size={20} />
                    Play Again
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setView('timeline')}
                    style={{ width: '100%', padding: '12px 24px', gap: 8 }}
                  >
                    <Eye size={18} />
                    View Timeline
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
