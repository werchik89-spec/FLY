import { useState, useEffect } from 'react';
import type { User, IncomingCall } from '../types';

interface CallScreenProps {
  activeCall: { callId: string; user: User; callType: string } | null;
  incomingCall: IncomingCall | null;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
}

export default function CallScreen({ activeCall, incomingCall, onAccept, onReject, onEnd }: CallScreenProps) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (activeCall) {
      const interval = setInterval(() => setDuration(d => d + 1), 1000);
      return () => clearInterval(interval);
    }
    setDuration(0);
  }, [activeCall?.callId]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (incomingCall) {
    return (
      <div className="call-overlay">
        <div className="call-avatar">
          {incomingCall.caller.avatar ? (
            <img src={incomingCall.caller.avatar} alt="" />
          ) : (
            getInitials(incomingCall.caller.displayName)
          )}
        </div>
        <div className="call-name">{incomingCall.caller.displayName}</div>
        <div className="call-status">
          {incomingCall.callType === 'video' ? 'Видеозвонок' : 'Голосовой звонок'}
        </div>
        <div className="call-actions">
          <button className="call-btn reject" onClick={onReject} title="Отклонить">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <button className="call-btn accept" onClick={onAccept} title="Принять">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (activeCall) {
    return (
      <div className="call-overlay">
        <div className="call-avatar">
          {activeCall.user.avatar ? (
            <img src={activeCall.user.avatar} alt="" />
          ) : (
            getInitials(activeCall.user.displayName)
          )}
        </div>
        <div className="call-name">{activeCall.user.displayName}</div>
        <div className="call-status">{formatDuration(duration)}</div>
        <div className="call-actions">
          <button className="call-btn reject" onClick={onEnd} title="Завершить">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
