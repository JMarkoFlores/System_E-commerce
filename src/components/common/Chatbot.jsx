import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  MessageCircle,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Loader2,
  Trash2,
  ChevronDown,
} from 'lucide-react';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const buildSystemPrompt = (lang, user) => {
  const isEN = lang?.startsWith('en');
  if (isEN) {
    return `You are TechBot, the intelligent virtual assistant of TechStore AI, a tech e-commerce store specialized in electronics, peripherals, audio, storage, furniture, lighting, photography and streaming equipment.

Your role:
- Help customers find products, compare options and make purchase decisions
- Explain how the AI recommendation system works (neural network trained on purchase history)
- Guide on how to use the store: catalog, shopping cart, checkout, order history
- Answer questions about shipping, payments (Yape/Plin or credit card), and order status
- If the user is an administrator, help with dashboard navigation, reports, user management and AI metrics

The current user is: ${user?.email || 'visitor'} (role: ${user?.role || 'guest'})

IMPORTANT RULES:
- Be friendly, concise and professional
- Always respond in English since the interface is in English
- For prices, use $ format
- If you don't know something specific about the store, be honest and suggest contacting support
- Keep responses brief (max 3-4 sentences unless a detailed explanation is needed)
- Use emojis sparingly to be friendly but not excessive`;
  }
  return `Eres TechBot, el asistente virtual inteligente de TechStore AI, una tienda e-commerce de tecnología especializada en electrónica, periféricos, audio, almacenamiento, muebles, iluminación, fotografía y equipos de streaming.

Tu rol:
- Ayudar a los clientes a encontrar productos, comparar opciones y tomar decisiones de compra
- Explicar cómo funciona el sistema de recomendación con IA (red neuronal entrenada con historial de compras)
- Orientar sobre cómo usar la tienda: catálogo, carrito, pago, historial de pedidos
- Responder sobre envíos, métodos de pago (Yape/Plin o tarjeta de crédito) y estado de pedidos
- Si el usuario es administrador, ayudar con navegación del dashboard, reportes, gestión de usuarios y métricas de IA

El usuario actual es: ${user?.email || 'visitante'} (rol: ${user?.role || 'invitado'})

REGLAS IMPORTANTES:
- Sé amigable, conciso y profesional
- Responde siempre en español ya que la interfaz está en español
- Para precios, usa el formato $
- Si no sabes algo específico de la tienda, sé honesto y sugiere contactar soporte
- Mantén respuestas breves (máximo 3-4 oraciones salvo que se necesite explicación detallada)
- Usa emojis con moderación para ser amigable pero sin exceso`;
};

export default function Chatbot() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.language;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [unread, setUnread] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const isEN = lang?.startsWith('en');

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus on open
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcome = isEN
        ? `👋 Hi${user?.email ? ` **${user.email.split('@')[0]}**` : ''}! I'm **TechBot**, your TechStore AI assistant. How can I help you today?`
        : `👋 ¡Hola${user?.email ? ` **${user.email.split('@')[0]}**` : ''}! Soy **TechBot**, tu asistente de TechStore AI. ¿En qué puedo ayudarte hoy?`;
      setMessages([{ role: 'assistant', content: welcome, ts: Date.now() }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Groq API call
  const sendToGroq = useCallback(async (userMessage) => {
    const history = messages
      .filter((m) => m.role !== 'error')
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt(lang, user) },
          ...history,
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '...';
  }, [messages, lang, user]);

  // Text-to-Speech
  const speak = useCallback((text, language) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/[_*`#]/g, '');
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = language?.startsWith('en') ? 'en-US' : 'es-PE';
    utt.rate = 1;
    window.speechSynthesis.speak(utt);
  }, []);

  // Send message
  const handleSend = useCallback(async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: msg, ts: Date.now() }]);

    try {
      const reply = await sendToGroq(msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, ts: Date.now() }]);
      if (!open) setUnread((n) => n + 1);
      if (ttsEnabled) speak(reply, lang);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'error',
          content: isEN
            ? `⚠️ Connection error: ${err.message}`
            : `⚠️ Error de conexión: ${err.message}`,
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, open, sendToGroq, ttsEnabled, speak, lang, isEN]);

  // Voice Input
  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(isEN ? 'Voice not supported in this browser.' : 'Voz no soportada en este navegador.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = lang?.startsWith('en') ? 'en-US' : 'es-PE';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      handleSend(transcript);
    };

    rec.start();
    recognitionRef.current = rec;
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setTimeout(() => {
      setMessages([{
        role: 'assistant',
        content: isEN ? '👋 Chat cleared! How can I help you?' : '👋 ¡Chat limpiado! ¿En qué puedo ayudarte?',
        ts: Date.now(),
      }]);
    }, 50);
  };

  // Render basic markdown
  const renderContent = (text) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString(isEN ? 'en-US' : 'es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const quickSuggestions = isEN
    ? ['Find products 🛒', 'How does AI work? 🤖', 'Payment methods 💳', 'My orders 📦']
    : ['Buscar productos 🛒', '¿Cómo funciona la IA? 🤖', 'Métodos de pago 💳', 'Mis pedidos 📦'];

  return (
    <>
      {/* Floating Button */}
      <button
        id="chatbot-toggle-btn"
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-500/50 ${
          open
            ? 'bg-gray-700 dark:bg-gray-600 scale-95'
            : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:scale-110'
        }`}
        aria-label={isEN ? 'Open chat assistant' : 'Abrir asistente'}
      >
        {open ? (
          <ChevronDown size={24} className="text-white" />
        ) : (
          <div className="relative">
            <Bot size={26} className="text-white" />
            {unread > 0 && (
              <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {unread}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-1.5rem)] flex flex-col transition-all duration-300 origin-bottom-right ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'
        }`}
        style={{ maxHeight: 'calc(100vh - 180px)' }}
      >
        <div
          className="flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-purple-500/20 bg-white dark:bg-gray-900 backdrop-blur-xl"
          style={{ maxHeight: 'calc(100vh - 180px)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-2 ring-white/30">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">TechBot</p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                  <p className="text-purple-100 text-xs">
                    {loading
                      ? (isEN ? 'Thinking...' : 'Pensando...')
                      : (isEN ? 'Online · Groq AI' : 'En línea · Groq IA')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setTtsEnabled((v) => !v)}
                className={`p-1.5 rounded-lg transition ${ttsEnabled ? 'bg-white/30 text-white' : 'text-purple-200 hover:bg-white/10'}`}
                title={isEN ? 'Voice responses' : 'Respuestas por voz'}
              >
                {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg text-purple-200 hover:bg-white/10 transition"
                title={isEN ? 'Clear chat' : 'Limpiar chat'}
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-purple-200 hover:bg-white/10 transition"
                aria-label={isEN ? 'Close chat' : 'Cerrar chat'}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 dark:bg-gray-950"
            style={{ minHeight: '260px', maxHeight: '370px' }}
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                {msg.role !== 'user' && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'error'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-gradient-to-br from-purple-500 to-indigo-500'
                  }`}>
                    <Bot size={14} className={msg.role === 'error' ? 'text-red-500' : 'text-white'} />
                  </div>
                )}

                <div className={`flex flex-col max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-sm'
                        : msg.role === 'error'
                        ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-bl-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm border border-gray-100 dark:border-gray-700 rounded-bl-sm'
                    }`}
                    dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                  />
                  <span className="text-xs text-gray-400 dark:text-gray-600 mt-0.5 px-1">
                    {formatTime(msg.ts)}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-purple-600 dark:text-purple-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex space-x-1 items-center h-4">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions (only at start) */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
              {quickSuggestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-xs px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="px-3 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              {/* Mic */}
              <button
                id="chatbot-voice-btn"
                onClick={toggleVoice}
                className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  listening
                    ? 'bg-red-500 text-white shadow-lg shadow-red-400/40 animate-pulse'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600'
                }`}
                title={listening ? (isEN ? 'Stop' : 'Detener') : (isEN ? 'Voice input' : 'Voz')}
              >
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              {/* Input */}
              <input
                ref={inputRef}
                id="chatbot-text-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={
                  listening
                    ? (isEN ? '🎤 Listening...' : '🎤 Escuchando...')
                    : (isEN ? 'Write a message...' : 'Escribe un mensaje...')
                }
                disabled={loading}
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:opacity-60"
              />

              {/* Send */}
              <button
                id="chatbot-send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white transition-all hover:from-purple-700 hover:to-indigo-700 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>

            {/* Voice wave animation */}
            {listening && (
              <div className="mt-2 flex items-center justify-center gap-0.5">
                {[12, 20, 16, 24, 14, 22, 10, 18].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-purple-500 rounded-full animate-pulse"
                    style={{ height: `${h}px`, animationDelay: `${i * 80}ms` }}
                  />
                ))}
                <span className="text-xs text-purple-500 ml-2 font-medium">
                  {isEN ? 'Listening...' : 'Escuchando...'}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="py-1.5 bg-white dark:bg-gray-900 border-t border-gray-50 dark:border-gray-800 text-center flex-shrink-0">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              Powered by{' '}
              <span className="font-semibold text-purple-500">Groq</span>
              {' '}· LLaMA 3.3 70B
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
