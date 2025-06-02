import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const GEMINI_API_KEY = 'AIzaSyBhOXRcPQ5l5vEJeR5cfj4SBMZYRfLIsto';

const DEFAULT_CHATS = [
  { id: '1', title: 'Plan a 3-day trip', preview: 'A 3-day trip to see the northern lights in Norway...' },
  { id: '2', title: 'Ideas for a customer loyalty program', preview: 'Here are some ideas for a customer loyalty program...' },
  { id: '3', title: 'Help me pick', preview: 'Here are some gift ideas for your friend...' },
];

const AIPage: React.FC = () => {
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('ai_chats');
    return saved ? JSON.parse(saved) : DEFAULT_CHATS;
  });
  const [selectedChatId, setSelectedChatId] = useState(chats[0]?.id || '');
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('ai_chat_' + selectedChatId);
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [chatMenuOpen, setChatMenuOpen] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameChatId, setRenameChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('ai_chat_' + selectedChatId);
    setMessages(saved ? JSON.parse(saved) : []);
  }, [selectedChatId]);

  useEffect(() => {
    if (selectedChatId) {
      localStorage.setItem('ai_chat_' + selectedChatId, JSON.stringify(messages));
    }
  }, [messages, selectedChatId]);

  useEffect(() => {
    localStorage.setItem('ai_chats', JSON.stringify(chats));
  }, [chats]);

  const startNewChat = () => {
    const newId = Date.now().toString();
    const newChat = { id: newId, title: 'New Chat', preview: '' };
    setChats([newChat, ...chats]);
    setSelectedChatId(newId);
    setMessages([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    setChats(chats => chats.map(chat => chat.id === selectedChatId ? { ...chat, preview: input } : chat));
    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an AI assistant for an aptitude and learning app. Only answer questions related to study, aptitude, exams, reasoning, or learning. If the question is not related to these topics, politely refuse to answer.\n\nUser: ${input}`
            }]
          }],
        }),
      });
      const data = await res.json();
      let aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiText) {
        aiText = data?.error?.message || "Sorry, I could not generate a response.";
      }
      setMessages(msgs => [...msgs, { role: 'ai', content: aiText }]);
    } catch (e) {
      setMessages(msgs => [...msgs, { role: 'ai', content: 'Error: Could not connect to AI.' }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  // Feature cards for aptitude AI
  const featureCards = [
    {
      icon: '🧠',
      title: 'Aptitude Practice',
      desc: 'Practice quantitative, logical, and verbal aptitude questions with instant feedback.',
      prompt: 'Explain the formulas of percentage. When you use LaTeX, always wrap it in $...$ for inline or $$...$$ for block math. Use headings, bullet points, formulas (in LaTeX if possible), and examples for each formula. Format the answer for easy reading, like a study guide.'
    },
    {
      icon: '📊',
      title: 'Topic-wise Analysis',
      desc: 'Get detailed analysis and tips for each aptitude topic you practice.',
      prompt: 'Analyze my performance in time and work questions and give me tips.'
    },
    {
      icon: '📝',
      title: 'Exam Simulation',
      desc: 'Simulate real exam conditions with timed tests and review your performance.',
      prompt: 'Simulate a 10-question aptitude test and review my answers.'
    },
  ];

  // Open rename dialog
  const openRenameDialog = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    setRenameChatId(chatId);
    setRenameValue(chat.title);
    setRenameDialogOpen(true);
    setChatMenuOpen(null);
  };

  // Save rename
  const handleRenameSave = () => {
    if (renameChatId && renameValue.trim()) {
      setChats(chats => chats.map(c => c.id === renameChatId ? { ...c, title: renameValue.trim() } : c));
    }
    setRenameDialogOpen(false);
    setRenameChatId(null);
    setRenameValue('');
  };

  // Cancel rename
  const handleRenameCancel = () => {
    setRenameDialogOpen(false);
    setRenameChatId(null);
    setRenameValue('');
  };

  // Delete chat
  const handleDeleteChat = (chatId: string) => {
    if (!window.confirm('Are you sure you want to delete this chat?')) return;
    setChats(chats => chats.filter(c => c.id !== chatId));
    localStorage.removeItem('ai_chat_' + chatId);
    // If the deleted chat is selected, select the first remaining chat
    setTimeout(() => {
      setChatMenuOpen(null);
      if (selectedChatId === chatId) {
        const remaining = chats.filter(c => c.id !== chatId);
        setSelectedChatId(remaining[0]?.id || '');
      }
    }, 0);
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen bg-[#F6F1EC] p-0">
        <div className="w-full h-[90vh] max-w-6xl flex rounded-card soft-shadow bg-white overflow-hidden">
          {/* Sidebar (Chats only) */}
          <div className="w-72 border-r bg-[#F6F1EC] flex flex-col">
            <div className="flex items-center gap-2 p-4 border-b">
              <img src="https://res.cloudinary.com/dcoijn5mh/image/upload/v1748838136/ai_gnrq6h.png" alt="AI" className="w-8 h-8 rounded-full" />
              <div className="font-bold text-lg text-[#1A1A1A]">Aptitude AI</div>
              <button className="ml-auto px-3 py-1 rounded bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-white font-semibold shadow hover:from-[#22c55e] hover:to-[#4ade80] transition text-sm" onClick={startNewChat}>+ New</button>
            </div>
            <div className="p-3">
              <input
                type="text"
                className="w-full rounded-full border border-gray-300 bg-[#F6F1EC] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4ade80] transition"
                placeholder="Search chats"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2" style={{ overflowX: 'hidden' }}>
              {chats.filter(chat => chat.title.toLowerCase().includes(search.toLowerCase())).map(chat => (
                <div key={chat.id} className={`group relative px-2 py-2 rounded cursor-pointer mb-1 flex items-center ${selectedChatId === chat.id ? 'bg-[#E1DDFC] font-semibold' : 'hover:bg-gray-100'}`}
                  onClick={() => setSelectedChatId(chat.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ maxWidth: '100%' }}>{chat.title}</div>
                    <div className="text-xs text-gray-400 truncate" style={{ maxWidth: '100%' }}>{chat.preview}</div>
                  </div>
                  <button
                    className="ml-2 opacity-60 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition"
                    onClick={e => { e.stopPropagation(); setChatMenuOpen(chat.id === chatMenuOpen ? null : chat.id); }}
                  >
                    <span style={{ fontSize: 18 }}>⋮</span>
                  </button>
                  {chatMenuOpen === chat.id && (
                    <div className="absolute right-2 top-10 z-10 bg-white border rounded shadow-lg flex flex-col min-w-[120px]">
                      <button className="px-4 py-2 text-left hover:bg-gray-100" onClick={e => { e.stopPropagation(); openRenameDialog(chat.id); }}>
                        Rename
                      </button>
                      <button className="px-4 py-2 text-left text-red-600 hover:bg-gray-100" onClick={e => { e.stopPropagation(); handleDeleteChat(chat.id); }}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Main chat area */}
          <div className="flex-1 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <img src="https://res.cloudinary.com/dcoijn5mh/image/upload/v1748838136/ai_gnrq6h.png" alt="AI" className="w-16 h-16 rounded-full mb-4" />
                  <div className="text-2xl font-bold mb-2 text-[#1A1A1A]">How can I help you with aptitude today?</div>
                  <div className="text-base text-[#5C5C5C] mb-6">Ask me anything about aptitude, reasoning, math, or competitive exams.<br />Try these:<br /><span className="text-[#4ade80]">"Give me a time and work problem."<br />"Explain profit and loss with an example."<br />"Give me a logical reasoning puzzle."</span></div>
                  <div className="flex gap-4 mt-4 flex-wrap justify-center">
                    {featureCards.map(card => (
                      <button
                        key={card.title}
                        className="bg-[#F6F1EC] border rounded-lg p-4 text-center min-w-[140px] hover:bg-[#E1DDFC] transition cursor-pointer"
                        onClick={() => setInput(card.prompt)}
                      >
                        <div className="text-2xl mb-2">{card.icon}</div>
                        <div className="font-semibold text-sm mb-1">{card.title}</div>
                        <div className="text-xs text-gray-500">{card.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-xl px-4 py-2 max-w-[70%] ${msg.role === 'user' ? 'bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-white' : 'bg-[#F6F1EC] text-[#1A1A1A]'}`}>
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            code({node, className, children, ...props}) {
                              return <code className={className} {...props}>{children}</code>;
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {loading && <div className="text-[#4ade80]">Thinking...</div>}
                </div>
              )}
            </div>
            <div className="mt-auto pt-4 border-t flex items-center gap-2 bg-white px-6 pb-6">
              <img src="https://res.cloudinary.com/dcoijn5mh/image/upload/v1748838136/ai_gnrq6h.png" alt="AI" className="w-8 h-8 rounded-full" />
              <input
                type="text"
                className="flex-1 rounded-full border border-gray-300 bg-[#F6F1EC] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4ade80] transition"
                placeholder="Type your prompt here..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                ref={inputRef}
                disabled={loading}
              />
              <button className="px-4 py-2 rounded bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-white font-semibold shadow hover:from-[#22c55e] hover:to-[#4ade80] transition" onClick={sendMessage} disabled={loading}>
                →
              </button>
            </div>
            <div className="text-xs text-gray-400 text-center mt-2 pb-2">This AI is for aptitude, reasoning, and learning. Answers are generated by Gemini.</div>
          </div>
        </div>
      </div>
      {/* Rename Dialog */}
      {renameDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xs flex flex-col gap-4">
            <div className="font-bold text-lg text-[#1A1A1A]">Edit Chat Name</div>
            <input
              className="rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4ade80] transition"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded bg-gray-200 text-[#1A1A1A] font-semibold" onClick={handleRenameCancel}>Cancel</button>
              <button className="px-4 py-2 rounded bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-white font-semibold shadow" onClick={handleRenameSave} disabled={!renameValue.trim()}>Save</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AIPage; 