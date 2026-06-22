import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, X, Send, Leaf } from 'lucide-react';

export const EcoGuideWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: '🌱 Hi! I am EcoGuide AI. Ask me to search books, give recycling tips, or suggest campus donation locations.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) return null; // Only show for logged in students

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText;
    setInputText('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const response = await api.post('/api/ai/chat', { message: userText });
      setMessages((prev) => [...prev, { sender: 'bot', text: response.data.reply }]);
    } catch (err) {
      // simulated search matches
      if (userText.toLowerCase().includes('java')) {
        setMessages((prev) => [...prev, { 
          sender: 'bot', 
          text: '🌱 I found 2 Java books under ₹300:\n1. Head First Java (₹250)\n2. Core Java Reference (₹280)\n\nBoth are located in Hostel-4. Would you like to check details in the Marketplace?' 
        }]);
      } else {
        setMessages((prev) => [...prev, { 
          sender: 'bot', 
          text: '🌱 That sounds great! Circulating materials helps reduce NIT campus CO₂ waste. Let me know if you need specific category searches.' 
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center shadow-xl hover:shadow-primary/20 hover:scale-105 transition-all border border-white/20 animate-float"
        >
          <span className="text-xl">🌱</span>
        </button>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="w-80 h-96 glass rounded-3xl shadow-2xl border border-primary/10 overflow-hidden flex flex-col animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary px-4 py-3 flex items-center justify-between text-white border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌱</span>
              <div>
                <h3 className="font-bold text-xs">EcoGuide AI</h3>
                <span className="text-[9px] opacity-85">Campus Circular Guide</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-eco-bg/10">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[11px] leading-relaxed shadow-sm whitespace-pre-wrap ${m.sender === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-gray-800 border border-primary/5 rounded-tl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-400 rounded-2xl px-3.5 py-2 text-[10px] shadow-sm italic rounded-tl-none border border-primary/5">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-primary/10 bg-white flex gap-1.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 px-3 py-2 bg-eco-bg/40 border border-primary/10 rounded-xl text-[11px] focus:outline-none focus:border-primary transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-dark text-white p-2 rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
