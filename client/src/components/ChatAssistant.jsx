import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ChatAssistant({ codeContext }) {
  const { getApiUrl } = useApp();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hi! I am your CodeLens AI Tutor. Ask me any question about your active code, algorithm complexity, or execution steps!'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { sender: 'user', text: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`${getApiUrl()}/api/analyze/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          codeContext: codeContext || '',
          history: newMessages.slice(-6)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get answer');

      setMessages((prev) => [...prev, { sender: 'assistant', text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: err.message || 'Sorry, I ran into an issue answering that. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed bottom-4 right-3 left-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 font-body text-left">
      {/* Floating Toggle Button */}
      {!open && (
        <div className="flex justify-end">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-accentCyan to-accentPurple text-background font-heading font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,245,196,0.35)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 fill-current" />
            <span>Ask CodeLens AI</span>
          </button>
        </div>
      )}

      {/* Floating Chat Drawer Window */}
      {open && (
        <div className="w-full sm:w-[420px] h-[480px] sm:h-[520px] max-h-[80vh] rounded-2xl glass-card border border-accentCyan/30 bg-surface/95 shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-border/80 bg-surface2/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-accentCyan/15 border border-accentCyan/30 flex items-center justify-center text-accentCyan">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-heading text-xs font-black uppercase tracking-wider text-textMain flex items-center gap-1.5">
                  CodeLens AI Assistant <Sparkles className="h-3 w-3 text-accentYellow animate-pulse" />
                </h4>
                <span className="text-[9px] text-mutedMain font-mono">24/7 Code Tutor Active</span>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-mutedMain hover:text-textMain hover:bg-surface transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Scroll Panel */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="h-6 w-6 rounded-lg bg-accentCyan/10 border border-accentCyan/20 flex items-center justify-center text-accentCyan shrink-0 mt-0.5">
                    <Bot className="h-3 w-3" />
                  </div>
                )}

                <div
                  className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-accentCyan to-accentPurple text-background font-medium rounded-tr-none shadow-md'
                      : 'bg-surface2/80 border border-border/60 text-textMain/90 rounded-tl-none font-body whitespace-pre-wrap'
                  }`}
                >
                  {msg.text}
                </div>

                {msg.sender === 'user' && (
                  <div className="h-6 w-6 rounded-lg bg-accentPurple/20 border border-accentPurple/30 flex items-center justify-center text-accentPurple shrink-0 mt-0.5">
                    <User className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-mutedMain">
                <div className="h-6 w-6 rounded-lg bg-accentCyan/10 border border-accentCyan/20 flex items-center justify-center text-accentCyan shrink-0">
                  <Loader2 className="h-3 w-3 animate-spin" />
                </div>
                <span className="text-[10px] italic">CodeLens AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 border-t border-border/80 bg-surface2/40 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this code..."
              className="flex-1 bg-background/80 border border-border/60 rounded-xl px-3.5 py-2 text-xs text-textMain placeholder:text-mutedMain/50 outline-none focus:border-accentCyan/60 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 rounded-xl bg-accentCyan text-background disabled:opacity-30 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
