import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore.js';
import { useRoom } from '../hooks/useRoom.js';
import GameHUD from '../components/GameHUD.js';
import ChatPanel from '../components/ChatPanel.js';
import RoomScene from '../components/RoomScene.js';
import RoomTransition from '../components/RoomTransition.js';
import TypewriterText from '../components/TypewriterText.js';
import CipherLock from '../puzzles/CipherLock.js';
import SplitScreen from '../puzzles/SplitScreen.js';
import WireConnection from '../puzzles/WireConnection.js';
import SequenceMemory from '../puzzles/SequenceMemory.js';
import MapNavigator from '../puzzles/MapNavigator.js';
import ConnectionOverlay from '../components/ConnectionOverlay.js';
import ReconnectOverlay from '../components/ReconnectOverlay.js';
import HintButton from '../components/HintButton.js';
import ParticleField, { type ParticleStyle } from '../components/effects/ParticleField.js';
import PuzzleEffects, { type PuzzleEffectType } from '../components/effects/PuzzleEffects.js';
import { ROOMS } from '../types/index.js';
import { getRoomTheme } from '../themes/rooms.js';
import { ambientAudio } from '../services/ambientAudio.js';
import type { AmbientRoomId } from '../services/ambientAudio.js';
import type { Hotspot } from '../components/RoomScene.js';

const ROOM_AMBIENT_MAP: Record<number, AmbientRoomId | null> = {
  0: null, // The Invitation — no ambient (tutorial)
  1: 'workshop',
  2: 'laboratory',
  3: 'labyrinth',
  4: 'vault',
};

const ROOM_PARTICLE_MAP: Record<number, ParticleStyle> = {
  0: 'dust',
  1: 'sparks',
  2: 'fog',
  3: 'dust',
  4: 'golden',
};

export default function GamePage() {
  const navigate = useNavigate();
  const { room, roomTransition, setRoomTransition, roomNarrative, puzzleNarratives, gameEvents } = useGameStore();
  const { leaveRoom, advanceRoom } = useRoom();
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [showNarrative, setShowNarrative] = useState(false);
  const [narrativeKey, setNarrativeKey] = useState(0);
  const [activeEffect, setActiveEffect] = useState<PuzzleEffectType | null>(null);

  useEffect(() => {
    if (!room) {
      navigate('/');
    }
  }, [room, navigate]);

  useEffect(() => {
    if (room?.state === 'completed') {
      navigate(`/victory/${room.id}`);
    }
  }, [room?.state, room?.id, navigate]);

  useEffect(() => {
    const handleUnload = () => {
      leaveRoom();
      ambientAudio.stop();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      ambientAudio.stop();
    };
  }, [leaveRoom]);

  // Reset active hotspot when room changes
  useEffect(() => {
    setActiveHotspot(null);
  }, [room?.currentRoomIndex]);

  // Play ambient audio for current room
  useEffect(() => {
    if (room?.state === 'playing') {
      const ambientId = ROOM_AMBIENT_MAP[room.currentRoomIndex];
      if (ambientId) {
        ambientAudio.play(ambientId);
      } else {
        ambientAudio.stop();
      }
    }
    return () => {
      if (room?.state !== 'playing') {
        ambientAudio.stop();
      }
    };
  }, [room?.currentRoomIndex, room?.state]);

  // Show narrative overlay when room narrative arrives
  useEffect(() => {
    if (roomNarrative && room?.state === 'playing') {
      setShowNarrative(true);
      setNarrativeKey((k) => k + 1);
    }
  }, [roomNarrative, room?.state]);

  // Trigger visual effects on game events
  useEffect(() => {
    const lastEvent = gameEvents[gameEvents.length - 1];
    if (!lastEvent) return;
    if (lastEvent.type === 'puzzle-solved') {
      setActiveEffect('success');
    } else if (lastEvent.type === 'hint') {
      setActiveEffect('hint');
    }
  }, [gameEvents.length]);

  if (!room) return null;

  const currentRoomIndex = room.currentRoomIndex;
  const currentRoomConfig = ROOMS[currentRoomIndex];
  const theme = getRoomTheme(currentRoomIndex);

  const hotspots: Hotspot[] = (currentRoomConfig?.hotspots ?? []).map((hs) => {
    const puzzle = room.puzzles[hs.id];
    return { ...hs, solved: puzzle?.solved ?? false };
  });

  const handleHotspotClick = (hotspotId: string) => {
    const puzzle = room.puzzles[hotspotId];
    if (puzzle?.solved) return;
    console.log('[SFX] hotspot-click');
    setActiveHotspot(hotspotId);
  };

  const handleTransitionComplete = useCallback(() => {
    setRoomTransition(null);
    advanceRoom();
  }, [advanceRoom, setRoomTransition]);

  const isTransitioning = room.state === 'transitioning' && roomTransition !== null;

  const activePuzzle = activeHotspot ? room.puzzles[activeHotspot] : null;
  const activePuzzleNarrative = activeHotspot ? puzzleNarratives[activeHotspot] : null;

  return (
    <div className="game-page">
      <ConnectionOverlay />
      <ReconnectOverlay />
      <GameHUD onPuzzleClick={(puzzleId) => setActiveHotspot(puzzleId)} />
      <div className="game-body">
        <div className="game-main">
          <ParticleField style={ROOM_PARTICLE_MAP[currentRoomIndex] ?? 'dust'} />
          {!isTransitioning && (
            <RoomScene
              hotspots={hotspots}
              onHotspotClick={handleHotspotClick}
              theme={theme}
            />
          )}

          {/* Narrative overlay */}
          {showNarrative && roomNarrative && (
            <div className="narrative-overlay" onClick={() => setShowNarrative(false)}>
              <div className="narrative-overlay-content" onClick={(e) => e.stopPropagation()}>
                <div className="narrative-entrance-text">
                  <TypewriterText
                    key={narrativeKey}
                    text={roomNarrative.roomNarrative.entranceText}
                    speed={25}
                    onComplete={() => {
                      setTimeout(() => setShowNarrative(false), 3000);
                    }}
                  />
                </div>
                {roomNarrative.roomNarrative.characterDialogue.length > 0 && (
                  <div className="narrative-dialogue">
                    {roomNarrative.roomNarrative.characterDialogue.map((line: string, i: number) => (
                      <p key={i} className="narrative-dialogue-line">&ldquo;{line}&rdquo;</p>
                    ))}
                  </div>
                )}
                <button className="narrative-skip-btn" onClick={() => setShowNarrative(false)}>
                  Skip
                </button>
              </div>
            </div>
          )}

          {activeHotspot && !room.puzzles[activeHotspot]?.solved && !isTransitioning && (
            <div className="puzzle-overlay" onClick={() => setActiveHotspot(null)}>
              <div className="puzzle-overlay-content" onClick={(e) => e.stopPropagation()}>
                <div className="puzzle-overlay-header">
                  <h3>{activeHotspot.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</h3>
                  <button className="puzzle-close-btn" onClick={() => setActiveHotspot(null)}>
                    &times;
                  </button>
                </div>
                {activePuzzleNarrative && (
                  <div className="puzzle-backstory">
                    <p className="puzzle-backstory-text">{activePuzzleNarrative.backstory}</p>
                    {activePuzzleNarrative.clueText && (
                      <p className="puzzle-clue-text">&ldquo;{activePuzzleNarrative.clueText}&rdquo;</p>
                    )}
                  </div>
                )}
                <div className="puzzle-overlay-body">
                  {activePuzzle && activePuzzle.type === 'cipher-lock' ? (
                    <CipherLock puzzleId={activePuzzle.id} data={activePuzzle.data} />
                  ) : activePuzzle && activePuzzle.type === 'split-screen' ? (
                    <SplitScreen puzzleId={activePuzzle.id} data={activePuzzle.data} />
                  ) : activePuzzle && activePuzzle.type === 'wire-connection' ? (
                    <WireConnection puzzleId={activePuzzle.id} data={activePuzzle.data} />
                  ) : activePuzzle && activePuzzle.type === 'sequence-memory' ? (
                    <SequenceMemory puzzleId={activePuzzle.id} data={activePuzzle.data} />
                  ) : activePuzzle && activePuzzle.type === 'map-navigator' ? (
                    <MapNavigator puzzleId={activePuzzle.id} data={activePuzzle.data} />
                  ) : activePuzzle ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 32 }}>
                      Investigating... Nothing to interact with yet.
                    </p>
                  ) : (
                    <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 32 }}>
                      Investigating... Nothing to interact with yet.
                    </p>
                  )}
                  {activePuzzle && !activePuzzle.solved && (
                    <HintButton
                      puzzleId={activePuzzle.id}
                      hintLevel={activePuzzle.data.hintLevel || 0}
                      solved={false}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <ChatPanel activePuzzleType={activeHotspot ? activePuzzle?.type : null} />
      </div>

      {isTransitioning && roomTransition && (
        <RoomTransition transition={roomTransition} onComplete={handleTransitionComplete} />
      )}

      {activeEffect && (
        <PuzzleEffects activeEffect={activeEffect} onEffectEnd={() => setActiveEffect(null)} />
      )}
    </div>
  );
}
