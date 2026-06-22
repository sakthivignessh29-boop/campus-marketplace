import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { User, Message } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Send, Leaf, User as UserIcon, MessageCircle } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { messages: wsMessages, sendMessage, clearMessages, markNotificationsAsRead } = useSocket();

  const [activeChats, setActiveChats] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clear unread message notifications when entering the page
  useEffect(() => {
    markNotificationsAsRead('NEW_MESSAGE');
  }, []);

  // Fetch active chats on startup
  useEffect(() => {
    const loadActiveChats = async () => {
      try {
        const response = await api.get('/api/chat/active-chats');
        setActiveChats(response.data);
        if (response.data.length > 0) {
          setSelectedUser(response.data[0]);
        }
      } catch (e) {
        console.error('Failed to load active chats list', e);
      }
    };
    loadActiveChats();
  }, []);

  // Fetch history when active chat user selection changes
  useEffect(() => {
    if (!selectedUser) return;
    setLoading(true);
    clearMessages(); // Clear ws temporary stack

    const loadChatHistory = async () => {
      try {
        const response = await api.get(`/api/chat/history/${selectedUser.id}`);
        setChatHistory(response.data);
      } catch (err) {
        console.error('Error fetching chat history', err);
      } finally {
        setLoading(false);
      }
    };
    loadChatHistory();
  }, [selectedUser]);

  // Combine REST history with WebSocket messages
  useEffect(() => {
    if (!selectedUser) return;
    
    // Filter ws messages that belong to the active conversation
    const relatedWs = wsMessages.filter(
      (m) =>
        (m.sender.id === selectedUser.id && m.receiver.id === user?.id) ||
        (m.sender.id === user?.id && m.receiver.id === selectedUser.id)
    );

    if (relatedWs.length > 0) {
      setChatHistory((prev) => {
        // De-duplicate in case they are already present
        const combined = [...prev, ...relatedWs];
        const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        return unique;
      });
    }
  }, [wsMessages, selectedUser, user]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser) return;

    // Dispatch via SocketContext
    sendMessage(selectedUser.id, inputText);

    // Optimistically add to history locally
    const myMsg: Message = {
      id: Date.now(), // temporary id
      sender: user!,
      receiver: selectedUser,
      content: inputText,
      isRead: true,
      createdAt: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, myMsg]);
    setInputText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-80px)] flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column - User Chats list */}
        <div className="md:col-span-4 glass border border-primary/10 rounded-3xl overflow-hidden flex flex-col shadow-lg">
          <div className="px-5 py-4 border-b border-primary/10 bg-primary/5">
            <h2 className="font-poppins font-bold text-sm text-primary-dark flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" /> Active Chats
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-primary/5">
            {activeChats.length === 0 ? (
              <div className="py-20 text-center text-xs text-gray-400">No active discussions</div>
            ) : (
              activeChats.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full px-5 py-4 flex items-center gap-3 transition-all text-left ${selectedUser?.id === u.id ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-primary/5'}`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{u.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{u.department} • Year {u.year}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Chat Messages Timeline */}
        <div className="md:col-span-8 glass border border-primary/10 rounded-3xl overflow-hidden flex flex-col shadow-lg">
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-primary/10 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-800">{selectedUser.name}</h3>
                    <span className="text-[9px] text-primary font-semibold uppercase">{selectedUser.role}</span>
                  </div>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-eco-bg/20">
                {loading ? (
                  <div className="text-center text-xs text-gray-400 py-10">Syncing chat logs...</div>
                ) : chatHistory.length === 0 ? (
                  <div className="text-center text-xs text-gray-400 py-10">No messages yet. Send a greeting to start!</div>
                ) : (
                  chatHistory.map((m) => {
                    const isMe = m.sender.id === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-gray-800 border border-primary/5 rounded-tl-none'}`}>
                          {m.product && (
                            <div className="mb-2 p-2 bg-black/5 rounded-xl border border-black/10 flex items-center gap-2">
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">ITEM</span>
                              <span className="font-semibold text-[10px] truncate block max-w-[150px]">{m.product.name}</span>
                            </div>
                          )}
                          <p>{m.content}</p>
                          <span className={`text-[8px] mt-1 block text-right ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} className="p-4 border-t border-primary/10 bg-white flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1 px-4 py-3 bg-eco-bg/40 border border-primary/10 rounded-2xl text-xs focus:outline-none focus:border-primary transition-all"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-dark text-white p-3 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 text-gray-400">
              <Leaf className="w-12 h-12 text-primary/25 animate-float" />
              <p className="text-xs font-semibold">Select a conversation thread to review messaging timeline</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
