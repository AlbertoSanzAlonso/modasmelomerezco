import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from "@/lib/api";
import { useLocation } from 'react-router-dom';

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

  const { data: allProducts } = useQuery({
    queryKey: ['products-all-chat'],
    queryFn: () => api.products.getAll('', undefined, 1, 1000),
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // No mostrar el agente en el panel de admin ni en la cuenta del cliente
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
      const stopWords = ['el','la','los','las','un','una','unos','unas','de','del','para','y','o','en','que','qué','cual','cuál','talla','precio','quiero','busco','tenéis','tienes','hay','con','sin','por','a','al','hola','buenas','tardes','dias','noches'];
      const keywords = userMsg.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopWords.includes(w));

      let relevantProducts = [];
      if (allProducts && keywords.length > 0) {
        relevantProducts = allProducts.map(p => {
          let score = 0;
          const searchString = `${p.name} ${p.category} ${p.subcategory || ''} ${p.description}`.toLowerCase();
          keywords.forEach(kw => {
            if (searchString.includes(kw)) score += 1;
            // Bonus points for exact word matches in name or category
            if (p.name.toLowerCase().includes(kw)) score += 2;
            if (p.category.toLowerCase().includes(kw) || p.subcategory?.toLowerCase().includes(kw)) score += 2;
          });
          return { product: p, score };
        })
        .filter(p => p.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(p => p.product);
      }
      
      // Fallback si no hay coincidencias o el saludo es genérico
      if (relevantProducts.length === 0 && allProducts) {
        relevantProducts = allProducts.slice(0, 10); 
      }

      // Cogemos solo el Top 10 para inyectar al prompt
      const topProducts = relevantProducts.slice(0, 10);

      const productsInfo = topProducts.length > 0 
        ? topProducts.map(p => `Artículo: ${p.name} (${p.category}). Precio: ${p.price}€. Tallas: ${p.variants?.filter(v => v.stock > 0).map(v => v.size).join(',') || 'Agotado'}. Detalles: ${p.description}`).join('\n---\n')
        : 'Inventario vacío o sin coincidencias.';

      const conversationHistory = messages.slice(1).map(m => ({
        role: m.isBot ? 'assistant' : 'user',
        content: m.text
      }));

      const systemPrompt = `
Eres MeloMe, la asistente de la tienda "Modas Me lo Merezco". Responde de forma amable, breve y femenina.
INFO: Envíos 5,50€ (48h), recogida gratis. Pagos: Tarjeta y Bizum (Redsys).

INVENTARIO RELEVANTE PARA ESTA CONSULTA:
${productsInfo}

Reglas: Basa tus respuestas en este inventario. Sé persuasiva pero concisa. No inventes tallas ni precios.`;

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

      if (!response.ok) {
        const errText = await response.text();
        console.error('Groq API Error Details:', errText);
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      const botResponse = data.choices[0].message.content;

      setMessages(prev => [...prev, { id: Date.now().toString(), text: botResponse, isBot: true }]);
    } catch (error) {
      console.error('Groq API Error:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: 'Vaya, he tenido un problema de conexión. Por favor, inténtalo de nuevo.', isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-primary text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:scale-110 hover:shadow-[0_8px_30px_rgba(255,79,112,0.3)] ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        aria-label="Abrir asistente virtual"
      >
        <MessageCircle className="w-7 h-7" />
      </button>

      {/* Ventana de chat */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[90vw] sm:w-[380px] bg-white rounded-4xl shadow-2xl overflow-hidden transition-all duration-300 transform origin-bottom-right flex flex-col border border-primary/10 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
        style={{ height: '550px', maxHeight: '85vh' }}
      >
        {/* Cabecera */}
        <div className="bg-primary p-5 flex justify-between items-center text-white relative overflow-hidden">
          {/* Patrón de fondo sutil */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-white/20 p-2.5 rounded-full backdrop-blur-sm shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest italic">MeloMe</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                <p className="text-[9px] opacity-90 uppercase tracking-widest font-medium">Asistente en línea</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10"
            aria-label="Cerrar chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#fafafa]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-auto ${msg.isBot ? 'bg-primary/10 text-primary' : 'bg-secondary text-white'}`}>
                  {msg.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                 <div className={`p-4 text-sm shadow-sm leading-relaxed ${
                   msg.isBot 
                     ? 'bg-white border border-gray-100 text-secondary rounded-[1.5rem] rounded-bl-sm' 
                     : 'bg-secondary text-white rounded-[1.5rem] rounded-br-sm'
                 }`}>
                   {msg.isBot ? formatMessage(msg.text) : msg.text}
                 </div>
              </div>
            </div>
          ))}
          
          {/* Indicador de escribiendo... */}
          {isLoading && (
            <div className="flex justify-start animate-in fade-in">
              <div className="flex gap-3 max-w-[80%] flex-row">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-auto">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 bg-white border border-gray-100 text-secondary rounded-[1.5rem] rounded-bl-sm flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                  <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pregúntame algo..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full pl-5 pr-12 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-secondary"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-1.5 p-2.5 bg-primary text-white rounded-full hover:bg-[#e63e5d] transition-colors disabled:opacity-40 disabled:hover:bg-primary"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
