import { useEffect, useState } from 'react';
import type { RoomTransitionEvent } from '../types/index.js';

interface RoomTransitionProps {
  transition: RoomTransitionEvent;
  onComplete: () => void;
}

export default function RoomTransition({ transition, onComplete }: RoomTransitionProps) {
  const [countdown, setCountdown] = useState(transition.countdown);
  const [visible, setVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    // Fade in
    const showTimer = setTimeout(() => setVisible(true), 50);
    const textTimer = setTimeout(() => setTextVisible(true), 300);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(textTimer);
    };
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  return (
    <div className={`room-transition ${visible ? 'room-transition-visible' : ''}`}>
      <div className="room-transition-bg" />
      <div className="room-transition-content">
        <div className={`room-transition-door ${textVisible ? 'room-transition-door-open' : ''}`}>
          <div className="room-transition-door-frame">
            <div className="room-transition-light-ray" />
          </div>
        </div>

        <div className={`room-transition-text ${textVisible ? 'room-transition-text-visible' : ''}`}>
          <div className="room-transition-unlocked">Door Unlocked!</div>
          <h2 className="room-transition-name">{transition.roomName}</h2>
          <p className="room-transition-desc">{transition.roomDescription}</p>
          <div className="room-transition-countdown">
            Entering in <span className="room-transition-count">{countdown}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
