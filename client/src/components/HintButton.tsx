import { useState, useEffect, useCallback } from 'react';
import { useRoom } from '../hooks/useRoom.js';
import { useGameStore } from '../stores/gameStore.js';
import { Lightbulb } from 'lucide-react';

interface HintButtonProps {
  puzzleId: string;
  hintLevel: number;
  solved: boolean;
}

const MAX_HINTS = 3;
const COOLDOWN_SECONDS = 30;

export default function HintButton({ puzzleId, hintLevel, solved }: HintButtonProps) {
  const [cooldown, setCooldown] = useState(0);
  const [lastHintTime, setLastHintTime] = useState(0);
  const { sendPuzzleAction } = useRoom();
  const room = useGameStore((s) => s.room);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastHintTime) / 1000);
      const remaining = Math.max(0, COOLDOWN_SECONDS - elapsed);
      setCooldown(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown, lastHintTime]);

  const handleRequestHint = useCallback(() => {
    if (!room || solved) return;
    if (hintLevel >= MAX_HINTS) return;
    if (cooldown > 0) return;

    sendPuzzleAction(puzzleId, 'request-hint', {});
    setLastHintTime(Date.now());
    setCooldown(COOLDOWN_SECONDS);
  }, [room, puzzleId, hintLevel, cooldown, solved, sendPuzzleAction]);

  const allHintsUsed = hintLevel >= MAX_HINTS;
  const isDisabled = solved || allHintsUsed || cooldown > 0;

  const costForNext = hintLevel < MAX_HINTS ? [5, 10, 15][hintLevel] : 0;

  return (
    <div className="hint-button-container">
      <button
        className="hint-button"
        onClick={handleRequestHint}
        disabled={isDisabled}
        title={
          solved
            ? 'Puzzle already solved'
            : allHintsUsed
              ? 'All hints used'
              : cooldown > 0
                ? `Cooldown: ${cooldown}s`
                : `Request hint ${hintLevel + 1}/${MAX_HINTS} (-${costForNext} pts)`
        }
      >
        <Lightbulb size={16} />
        <span className="hint-button-label">
          {cooldown > 0 ? (
            <>{cooldown}s</>
          ) : allHintsUsed ? (
            'No hints left'
          ) : (
            `Hint ${hintLevel}/${MAX_HINTS}`
          )}
        </span>
      </button>
      <div className="hint-level-dots">
        {Array.from({ length: MAX_HINTS }, (_, i) => (
          <span
            key={i}
            className={`hint-dot ${i < hintLevel ? 'hint-dot-used' : ''}`}
          />
        ))}
      </div>
      {hintLevel > 0 && hintLevel < MAX_HINTS && cooldown === 0 && (
        <div className="hint-cost">
          -{costForNext} pts
        </div>
      )}
    </div>
  );
}
