import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ messages, onSendMessage, isLoading, hasRepository, onReviewDiff, isReviewing, reviewResult }) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('chat');
  const [diffInput, setDiffInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading && hasRepository) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      {/* Tabs */}
      {hasRepository && (
        <div className="flex justify-center pt-4 pb-2 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex bg-card border border-border rounded-lg p-1">
            <button 
              onClick={() => setMode('chat')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'chat' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text-main'}`}
            >
              Chat
            </button>
            <button 
              onClick={() => setMode('review')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'review' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text-main'}`}
            >
              PR Review
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {mode === 'chat' ? (
        <>
          <div className="flex-1 overflow-y-auto p-6 pb-32 flex flex-col items-center">
            <div className="w-full max-w-[850px] flex-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center mt-20">
              <h2 className="text-3xl font-semibold text-text-main mb-10 tracking-tight">Understand your codebase</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                {[
                  "Explain useState internals",
                  "Trace React Fiber rendering",
                  "Show component lifecycle flow",
                  "Find where a function is defined"
                ].map((suggestion, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (hasRepository && !isLoading) {
                        onSendMessage(suggestion);
                      }
                    }}
                    className={`bg-card border border-border p-5 rounded-xl transition-all duration-300 ${
                      hasRepository ? 'cursor-pointer hover:border-accent/40 hover:bg-accent/5 hover:-translate-y-1 hover:shadow-[0_8px_20px_-8px_rgba(0,245,212,0.15)]' : 'opacity-50 cursor-not-allowed'
                    } group flex items-center justify-between`}
                  >
                    <p className={`text-[15px] font-medium text-text-muted ${hasRepository ? 'group-hover:text-text-main' : ''} transition-colors`}>{suggestion}</p>
                    {hasRepository && <span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity transition-transform group-hover:translate-x-1">→</span>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
          messages.map((msg, idx) => (
            <MessageBubble 
              key={idx} 
              role={msg.role} 
              content={msg.content} 
              diagnostics={msg.diagnostics}
            />
          ))
        )}
        {isLoading && (
          <MessageBubble role="assistant" content="Analyzing repository context..." />
        )}
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent flex justify-center pb-8">
        <form onSubmit={handleSubmit} className="w-full max-w-[850px] relative flex items-end bg-card border border-border rounded-2xl shadow-lg hover:shadow-xl hover:border-border/80 focus-within:ring-1 focus-within:ring-accent focus-within:border-accent focus-within:shadow-[0_0_20px_rgba(0,245,212,0.1)] transition-all duration-300 overflow-hidden">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={hasRepository ? "Ask anything about your repository..." : "Connect a repository to ask questions"}
            className="w-full bg-transparent border-none px-5 py-4 text-[15px] text-text-main placeholder-text-muted focus:outline-none resize-none max-h-40 min-h-[56px] disabled:opacity-50 leading-relaxed"
            rows={1}
            disabled={isLoading || !hasRepository}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading || !hasRepository}
            className="p-2.5 m-2 text-text-main/50 hover:text-accent hover:bg-accent/10 disabled:opacity-30 disabled:hover:text-text-main/50 disabled:hover:bg-transparent transition-all duration-200 rounded-xl flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          <div className="w-full max-w-[850px] flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-text-main">Review Git Diff</h2>
            
            <div className="bg-card border border-border rounded-xl p-1 focus-within:border-accent transition-colors shadow-sm">
              <textarea
                value={diffInput}
                onChange={(e) => setDiffInput(e.target.value)}
                placeholder="Paste your git diff here..."
                className="w-full bg-transparent border-none p-4 text-sm text-text-main placeholder-text-muted focus:outline-none resize-y min-h-[200px] font-mono leading-relaxed"
                disabled={isReviewing}
              />
            </div>
            
            <button 
              onClick={() => onReviewDiff(diffInput)}
              disabled={!diffInput.trim() || isReviewing}
              className="self-end px-6 py-2.5 bg-accent/10 text-accent font-medium rounded-lg hover:bg-accent/20 disabled:opacity-50 transition-all shadow-sm"
            >
              {isReviewing ? 'Analyzing...' : 'Analyze Diff'}
            </button>

            {isReviewing && (
              <div className="mt-4">
                <MessageBubble role="assistant" content="Analyzing diff and generating review..." />
              </div>
            )}

            {reviewResult && !isReviewing && (
              <div className="mt-4 pb-10 border-t border-border/50 pt-6">
                <h3 className="text-lg font-medium text-text-main mb-4">Review Result</h3>
                <MessageBubble 
                  role="assistant" 
                  content={reviewResult.review} 
                  diagnostics={reviewResult.diagnostics}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
