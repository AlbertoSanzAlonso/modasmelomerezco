import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from "@/lib/supabase";
import { pipeline, env } from '@xenova/transformers';

// Configuración para evitar errores de carga de modelos en producción
env.allowLocalModels = false;
env.useBrowserCache = true;

// Singleton para el modelo de IA de vectores
let embedderPromise: Promise<any> | null = null;
const getEmbedder = () => {
  if (!embedderPromise) {
    embedderPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedderPromise;
};

const formatMessage = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(/^https?:\/\//)) {
      if (part.includes('wa.me') || part.includes('whatsapp')) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 px-4 py-2 bg-[#25D366] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#20BD5A] transition-colors"
          >
            WhatsApp
          </a>
        );
      }
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

interface Message {
  id: string;
  text: string;
  isBot: boolean;
}

export const AIChatAgent = () => {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: '¡Hola! Soy MeloMe, tu asistente virtual. ¿En qué puedo ayudarte? Si prefieres hablar por WhatsApp, pulsa aquí: https://wa.me/34685011494', isBot: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // No mostrar en admin ni cuenta
  if (pathname.startsWith('/admin') || pathname.startsWith('/cuenta')) {
    return null;
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userMsg, isBot: false }]);
    setIsLoading(true);

    try {
      // 1. Generar Vector de la pregunta del usuario
      const extractor = await getEmbedder();
      const output = await extractor(userMsg, { pooling: 'mean', normalize: true });
      const embedding = Array.from(output.data);

      // 2. Búsqueda Semántica en Supabase
      const { data: matchedProducts, error: rpcError } = await supabase.rpc('match_products', {
        query_embedding: embedding,
        match_threshold: 0.3, // Umbral de similitud
        match_count: 8       // Top 8 resultados
      });

      if (rpcError) throw rpcError;

      // 3. Preparar info para el prompt
      const productsInfo = matchedProducts && matchedProducts.length > 0 
        ? matchedProducts.map((p: any) => `Artículo: ${p.name} (${p.category || 'Moda'}). Precio: ${p.price}€. Detalles: ${p.description}`).join('\n---\n')
        : 'No hay artículos específicos en el catálogo que coincidan semánticamente.';

      const conversationHistory = messages.slice(1).map(m => ({
        role: m.isBot ? 'assistant' : 'user',
        content: m.text
      }));

      const systemPrompt = `
Eres MeloMe, la asistente de la tienda "Modas Me lo Merezco". Responde de forma amable, breve y femenina.
INFO: Envíos 5,50€ (48h), recogida gratis. Pagos: Tarjeta y Bizum (Redsys).

INVENTARIO RELEVANTE ENCONTRADO MEDIANTE BÚSQUEDA SEMÁNTICA:
${productsInfo}

Reglas: Basa tus respuestas en este inventario. Si no encuentras nada exacto, sugiere lo más parecido o invita a contactar por WhatsApp.`;

      // 4. Llamada a Groq
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: userMsg }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) throw new Error('Groq API Error');
      
      const data = await response.json();
      const botResponse = data.choices[0].message.content;

      setMessages(prev => [...prev, { id: Date.now().toString(), text: botResponse, isBot: true }]);
    } catch (error) {
      console.error('AIChat Error:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: 'Lo siento, estoy teniendo un problema técnico. ¿Podrías repetirme la pregunta?', isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-primary text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <MessageCircle className="w-7 h-7" />
      </button>

      <div
        className={`fixed bottom-6 right-6 z-50 w-[90vw] sm:w-[380px] bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 transform origin-bottom-right flex flex-col border border-primary/10 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
        style={{ height: '550px', maxHeight: '85vh' }}
      >
        <div className="bg-primary p-5 flex justify-between items-center text-white relative">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">MeloMe AI</h3>
              <p className="text-[10px] opacity-80 uppercase tracking-widest">Asistente Virtual</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`p-3 text-sm rounded-2xl max-w-[85%] ${msg.isBot ? 'bg-white border border-gray-100' : 'bg-secondary text-white'}`}>
                {msg.isBot ? formatMessage(msg.text) : msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-3 bg-white border border-gray-100 rounded-2xl animate-pulse text-xs text-gray-400">
                MeloMe está pensando...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="¿En qué puedo ayudarte?"
              className="w-full bg-gray-50 border border-gray-200 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:border-primary"
            />
            <button type="submit" className="absolute right-1 p-2 bg-primary text-white rounded-full">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
