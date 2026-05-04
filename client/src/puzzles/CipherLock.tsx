import { useState, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { useRoom } from '../hooks/useRoom.js';

interface CipherLockProps {
  puzzleId: string;
  data: Record<string, any>;
}

export default function CipherLock({ puzzleId, data }: CipherLockProps) {
  const { playerId } = useGameStore();
  const { sendPuzzleAction } = useRoom();

  const role: 'decoder' | 'lock-holder' | null =
    playerId && data.roles?.[playerId] ? data.roles[playerId] : null;

  if (role === 'decoder') {
    return <DecoderView puzzleId={puzzleId} data={data} sendPuzzleAction={sendPuzzleAction} />;
  }
  if (role === 'lock-holder') {
    return <LockHolderView puzzleId={puzzleId} data={data} sendPuzzleAction={sendPuzzleAction} />;
  }
  return (
    <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
      Waiting for role assignment...
    </div>
  );
}

interface SharedProps {
  puzzleId: string;
  data: Record<string, any>;
  sendPuzzleAction: (puzzleId: string, action: string, data: Record<string, any>) => void;
}

function DecoderView({ puzzleId, data, sendPuzzleAction }: SharedProps) {
  const cipherKey: Record<string, number> = data.cipherKey || {};
  const encodedMessage: string = data.encodedMessage || '';
  const hintLevel: number = data.hintLevel || 0;

  const handleHint = useCallback(() => {
    console.log('[SFX] hint-request');
    sendPuzzleAction(puzzleId, 'request-hint', {});
  }, [puzzleId, sendPuzzleAction]);

  return (
    <div className="cipher-decoder">
      <div className="cipher-role-badge">Decoder</div>
      <p className="cipher-instruction">
        You have the cipher key! Decode the message and tell your partner the digits.
      </p>

      <div className="cipher-key-panel">
        <h4>Cipher Key</h4>
        <div className="cipher-key-grid">
          {Object.entries(cipherKey).map(([letter, digit]) => (
            <div key={letter} className="cipher-key-entry">
              <span className="cipher-letter">{letter}</span>
              <span className="cipher-arrow">=</span>
              <span className="cipher-digit">{digit}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="cipher-message-panel">
        <h4>Encoded Message</h4>
        <div className="cipher-encoded">
          {encodedMessage.split('-').map((letter, i) => (
            <span key={i} className="cipher-encoded-letter">
              {letter}
            </span>
          ))}
        </div>
      </div>

      <button
        className="cipher-hint-btn"
        onClick={handleHint}
        disabled={hintLevel >= 4}
      >
        {hintLevel >= 4 ? 'All hints used' : `Request Hint (${hintLevel}/4)`}
      </button>

      <p className="cipher-reminder">
        Use the chat panel to share the decoded digits with your partner!
      </p>
    </div>
  );
}

function LockHolderView({ puzzleId, data, sendPuzzleAction }: SharedProps) {
  const currentDigits: number[] = data.currentDigits || [0, 0, 0, 0];
  const [submitted, setSubmitted] = useState(false);
  const [wrong, setWrong] = useState(false);
  const hintLevel: number = data.hintLevel || 0;

  const cycleDigit = useCallback(
    (index: number, direction: 1 | -1) => {
      const newDigits = [...currentDigits];
      newDigits[index] = (newDigits[index] + direction + 10) % 10;
      console.log('[SFX] dial-click');
      sendPuzzleAction(puzzleId, 'update-digits', { digits: newDigits });
    },
    [currentDigits, puzzleId, sendPuzzleAction],
  );

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    console.log('[SFX] submit-code');
    sendPuzzleAction(puzzleId, 'submit-code', { digits: currentDigits });
    // Wrong answer feedback: if after a short delay the puzzle is still unsolved, shake
    setTimeout(() => {
      const room = useGameStore.getState().room;
      const puzzle = room?.puzzles[puzzleId];
      if (!puzzle?.solved) {
        setWrong(true);
        setTimeout(() => setWrong(false), 600);
      }
    }, 500);
  }, [currentDigits, puzzleId, sendPuzzleAction]);

  const handleHint = useCallback(() => {
    console.log('[SFX] hint-request');
    sendPuzzleAction(puzzleId, 'request-hint', {});
  }, [puzzleId, sendPuzzleAction]);

  return (
    <div className="cipher-lockholder">
      <div className="cipher-role-badge cipher-role-badge-lock">Lock Holder</div>
      <p className="cipher-instruction">
        Your partner has the cipher. Ask them for the code, then enter it below.
      </p>

      <div className={`cipher-combo-lock ${wrong ? 'cipher-combo-shake' : ''}`}>
        {currentDigits.map((digit, i) => (
          <div key={i} className="cipher-dial">
            <button
              className="cipher-dial-btn cipher-dial-up"
              onClick={() => cycleDigit(i, 1)}
            >
              ▲
            </button>
            <div className="cipher-dial-digit">{digit}</div>
            <button
              className="cipher-dial-btn cipher-dial-down"
              onClick={() => cycleDigit(i, -1)}
            >
              ▼
            </button>
          </div>
        ))}
      </div>

      <button
        className="cipher-submit-btn"
        onClick={handleSubmit}
        disabled={submitted}
      >
        {submitted ? 'Checking...' : 'Submit Code'}
      </button>

      <button
        className="cipher-hint-btn"
        onClick={handleHint}
        disabled={hintLevel >= 4}
      >
        {hintLevel >= 4 ? 'All hints used' : `Request Hint (${hintLevel}/4)`}
      </button>
    </div>
  );
}
