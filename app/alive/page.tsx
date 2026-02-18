'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_GREETING =
  "Welcome. I\u2019m curious about what\u2019s alive in you right now \u2014 no agenda, just genuine interest in whatever you\u2019re feeling in this moment. What\u2019s present for you?";

export default function AlivePage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: INITIAL_GREETING },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: data.text },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content:
            'I\u2019m sorry, something went wrong on my end. Would you like to try sharing that again?',
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderContent = (content: string) => {
    const paragraphs = content.split('\n\n').filter(Boolean);
    if (paragraphs.length <= 1) {
      return <span>{content}</span>;
    }
    return paragraphs.map((p, i) => <p key={i}>{p}</p>);
  };

  return (
    <div className="container">
      <header className="header">
        <a href="https://kasanoff.ai" className="back-link" target="_blank" rel="noopener">
          &larr; kasanoff.ai
        </a>
        <h1 className="title welcome-fade">
          What&rsquo;s Alive In You Right Now?
        </h1>
        <p className="subtitle welcome-fade">
          A guided conversation &middot; take your time
        </p>
      </header>

      <div className="messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${
              message.role === 'assistant'
                ? 'message-assistant'
                : 'message-user'
            }`}
            style={{ animationDelay: index === 0 ? '0.5s' : '0s' }}
          >
            {renderContent(message.content)}
          </div>
        ))}

        {isLoading && (
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            className="input-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what&#x2019;s present for you&#x2026;"
            rows={1}
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            aria-label="Send"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
