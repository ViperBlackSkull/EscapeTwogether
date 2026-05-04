import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { useRoom } from '../hooks/useRoom.js';
import { getQuickPhrases } from '../lib/quickPhrases.js';
import { Send, MessageCircle, Zap } from 'lucide-react';
import type { ChatMessageType } from '../types/index.js';

interface ChatPanelProps {
  activePuzzleType?: string | null;
}

export default function ChatPanel({ activePuzzleType }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const { chatMessages, playerId, partnerTyping } = useGameStore();
  const { sendChatMessage, sendTyping } = useRoom();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);
  const prevMsgCountRef = useRef(0);
  const typingEmittedRef = useRef(false);

  const quickPhrases = getQuickPhrases(activePuzzleType ?? null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Track unread count when collapsed
  const unreadCount = collapsed
    ? Math.max(0, chatMessages.length - prevMsgCountRef.current)
    : 0;

  useEffect(() => {
    if (!collapsed) {
      prevMsgCountRef.current = chatMessages.length;
    }
  }, [collapsed, chatMessages.length]);

  const emitTyping = useCallback(() => {
    if (!typingEmittedRef.current) {
      typingEmittedRef.current = true;
      sendTyping();
      setTimeout(() => {
        typingEmittedRef.current = false;
      }, 2000);
    }
  }, [sendTyping]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendChatMessage(trimmed);
    setInput('');
  }, [input, sendChatMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (e.target.value.length > 0) {
      emitTyping();
    }
  };

  const handleQuickPhrase = (phrase: string) => {
    sendChatMessage(phrase);
    setShowQuickPhrases(false);
  };

  const getMsgClass = (type: ChatMessageType) => {
    switch (type) {
      case 'system': return 'chat-msg-system';
      case 'puzzle-hint': return 'chat-msg-hint';
      case 'puzzle-info': return 'chat-msg-info';
      default: return '';
    }
  };

  if (collapsed) {
    return (
      <button
        className="chat-toggle-btn"
        onClick={() => setCollapsed(false)}
        title="Open chat"
      >
        <MessageCircle size={20} />
        {unreadCount > 0 && <span className="chat-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
    );
  }

  return (
    <div className="chat-panel page-enter">
      <div className="chat-header">
        <span style={{ fontWeight: 600, fontSize: 14 }}>Chat</span>
        <button
          className="chat-collapse-btn"
          onClick={() => setCollapsed(true)}
          title="Minimize chat"
        >
          &rsaquo;
        </button>
      </div>
      <div className="chat-messages">
        {chatMessages.length === 0 && (
          <div className="chat-empty">
            Communicate with your partner to solve puzzles together.
          </div>
        )}
        {chatMessages.map((msg, i) => {
          const isSelf = msg.senderId === playerId;
          const isSystem = msg.type !== 'chat';
          return (
            <div
              key={i}
              className={`chat-msg ${isSelf ? 'chat-msg-self' : ''} ${getMsgClass(msg.type)} ${isSystem ? 'chat-msg-is-system' : ''}`}
            >
              {!isSystem && (
                <div className="chat-msg-sender" style={{ color: isSelf ? 'var(--accent-amber)' : 'var(--accent-teal)' }}>
                  {msg.sender}
                </div>
              )}
              <div className="chat-msg-text">
                {isSystem && <span className="chat-msg-type-badge">{msg.type === 'puzzle-hint' ? 'Hint' : msg.type === 'puzzle-info' ? 'Info' : ''}</span>}
                {msg.message}
              </div>
              <div className="chat-msg-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
        {partnerTyping && (
          <div className="chat-typing-indicator">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-label">Partner is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {quickPhrases.length > 0 && (
        <div className="chat-quick-phrases">
          <button
            className={`chat-quick-toggle ${showQuickPhrases ? 'active' : ''}`}
            onClick={() => setShowQuickPhrases(!showQuickPhrases)}
            title="Quick phrases"
          >
            <Zap size={14} />
            <span>Quick</span>
          </button>
          {showQuickPhrases && (
            <div className="chat-quick-list">
              {quickPhrases.map((phrase, i) => (
                <button
                  key={i}
                  className="chat-quick-item"
                  onClick={() => handleQuickPhrase(phrase)}
                >
                  {phrase}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="chat-input-area">
        <input
          className="chat-input"
          placeholder="Type a message..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          maxLength={200}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim()}
          title="Send"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
