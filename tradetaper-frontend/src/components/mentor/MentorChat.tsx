'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, LoaderCircle, Bot, User, Trash2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string; // Markdown or text
  type?: 'text' | 'critique';
  image?: string; // base64 or url
  sources?: string[];
}

export default function MentorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello. I am your ICT Mentor. Upload a chart for a critique, or ask me a concept question.',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !image) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      image: image || undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setImage(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      
      let endpoint = '';
      let body = {};

      if (userMsg.image) {
        endpoint = `${apiBase}/agents/mentor/audit`;
        body = {
          imageUrl: userMsg.image,
          description: userMsg.content || 'Please audit this chart.',
        };
      } else {
        endpoint = `${apiBase}/agents/mentor/chat`;
        body = {
          question: userMsg.content,
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const data = await res.json();
      
      // Parse response based on agent
      let replyContent = '';
      let sources = [];
      
      if (data.data?.answer) {
        replyContent = data.data.answer;
        sources = data.data.sources;
      } else if (data.data?.critique) {
        replyContent = data.data.critique;
      } else {
        replyContent = "I couldn't process that.";
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyContent,
        sources: sources,
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Error: Failed to reach the mentor. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/20">
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">ICT Mentor AI</h3>
            <p className="text-xs text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/20 rounded-tr-none' 
                : 'bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-tl-none'
            }`}>
              {msg.image && (
                <div className="mb-3 rounded-lg overflow-hidden border border-white/10">
                  <img src={msg.image} alt="Chart" className="max-w-full h-auto" />
                </div>
              )}
              
              <div className="whitespace-pre-wrap text-sm leading-relaxed font-light">
                {msg.content}
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-400">Sources:</span> {msg.sources.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl p-4 rounded-tl-none flex items-center gap-2 text-zinc-400 text-sm">
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800">
        {image && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-zinc-900 rounded-lg border border-zinc-800 w-fit">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-zinc-400">Image attached</span>
            <button onClick={() => setImage(null)} className="hover:text-red-400 text-zinc-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <label className="cursor-pointer p-2 hover:bg-zinc-900 rounded-lg transition-colors text-zinc-400 hover:text-emerald-400">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <ImageIcon className="w-5 h-5" />
          </label>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={image ? "Describe your question about this chart..." : "Ask a question..."}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-600"
          />
          
          <button 
            onClick={handleSend}
            disabled={!input.trim() && !image || loading}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
