import { useState, useEffect, useRef, useCallback } from 'react';

interface TypeWriterProps {
  text: string;
  speed?: number;
  pauseAtPunctuation?: boolean;
  punctuationPauseMs?: number;
  onComplete?: () => void;
  className?: string;
  startDelay?: number;
  cursor?: boolean;
}

const PUNCTUATION = new Set(['.', '!', '?', ',', ';', ':', '—', '…']);

export default function TypeWriter({
  text,
  speed = 30,
  pauseAtPunctuation = true,
  punctuationPauseMs = 150,
  onComplete,
  className,
  startDelay = 0,
  cursor = true,
}: TypeWriterProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNext = useCallback(() => {
    if (indexRef.current >= text.length) {
      setDone(true);
      onComplete?.();
      return;
    }

    const currentChar = text[indexRef.current];
    const isPunctuation = pauseAtPunctuation && PUNCTUATION.has(currentChar);
    const delay = isPunctuation ? punctuationPauseMs : speed;

    timerRef.current = setTimeout(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      scheduleNext();
    }, delay);
  }, [text, speed, pauseAtPunctuation, punctuationPauseMs, onComplete]);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setStarted(true);
      indexRef.current = 0;
      setDisplayed('');
      setDone(false);
      scheduleNext();
    }, startDelay);

    return () => {
      clearTimeout(delayTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, startDelay, scheduleNext]);

  if (!started) {
    return <span className={className}>{cursor && <span className="typewriter-cursor">|</span>}</span>;
  }

  return (
    <span className={className}>
      {displayed}
      {!done && cursor && <span className="typewriter-cursor">|</span>}
    </span>
  );
}
