import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from "@/lib/supabase";
// Eliminamos Xenova/Transformers para usar OpenAI directamente (más preciso)
const getQueryEmbedding = async (text: string) => {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text
    })
  });

  if (!response.ok) throw new Error('OpenAI Embedding Error');
  const data = await response.json();
  return data.data[0].embedding;
};

const formatMessage = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(/^https?:\/\//)) {
      // Caso 1: WhatsApp
      if (part.includes('wa.me') || part.includes('whatsapp')) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[#20BD5A] transition-all hover:scale-105 shadow-md shadow-green-500/20 active:scale-95"
          >
            <span>Hablar por WhatsApp</span>
          </a>
        );
      }
      
      // Caso 2: Producto de la tienda
      if (part.includes('/producto/')) {
        return (
          <a
            key={index}
            href={part}
            className="flex items-center justify-between mt-4 px-6 py-4 bg-secondary text-white text-[10px] font-black uppercase tracking-[0.2em] italic rounded-2xl hover:bg-primary transition-all group shadow-xl shadow-secondary/10 active:scale-[0.98]"
          >
            <span>Ver Producto</span>
            <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors">
              <Send className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </a>
        );
      }

      // Caso 3: Otras URLs (links genéricos)
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-bold underline hover:text-primary/80 break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={index} className="leading-relaxed">{part}</span>;
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
      let matchedProducts = [];
      let searchMethod = 'semantic';

      try {
        // 1. Intentar Búsqueda Semántica (OpenAI + Supabase)
        const embedding = await getQueryEmbedding(userMsg);

        const { data, error: rpcError } = await supabase.rpc('match_products', {
          query_embedding: embedding,
          match_threshold: 0.3, // Umbral más estricto para OpenAI (es más preciso)
          match_count: 8
        });

        if (rpcError) throw rpcError;
        matchedProducts = data || [];
      } catch (vectorError) {
        console.warn('Vector search failed, falling back to keywords:', vectorError);
        searchMethod = 'keyword';
        // 2. Fallback: Búsqueda por palabras clave más amplia
        const firstWord = userMsg.split(' ')[0];
        const { data: keywordProducts } = await supabase
          .from('products')
          .select('*, categories(name)')
          .or(`name.ilike.%${userMsg}%,description.ilike.%${userMsg}%,name.ilike.%${firstWord}%`)
          .limit(10);
        
        matchedProducts = keywordProducts || [];
      }

      // 3. Preparar info para el prompt
      const productsInfo = matchedProducts.length > 0 
        ? matchedProducts.map((p: any) => {
            const stockInfo = p.variants?.map((v: any) => `${v.size}: ${v.stock}uds`).join(', ') || 'Sin info de stock';
            const novelty = p.is_new ? '✨ NOVEDAD ✨' : '';
            return `Artículo: ${p.name} ${novelty}. Precio: ${p.price}€. URL: ${window.location.origin}/producto/${p.product_id}. Tallas/Stock: ${stockInfo}. Descripción: ${p.description}`;
          }).join('\n---\n')
        : 'No hay artículos específicos en el catálogo que coincidan.';

      const conversationHistory = messages.slice(1).map(m => ({
        role: m.isBot ? 'assistant' : 'user',
        content: m.text
      }));

      const systemPrompt = `
Eres MeloMe, la asistente virtual experta de la boutique "Modas Me lo Merezco". Tu objetivo es asesorar a las clientas con amabilidad, elegancia y un toque cercano.

INFORMACIÓN DE LA TIENDA:
- Ubicación: Calle Aragón, 2, Local 2, Benalmádena (Málaga).
- Teléfono/WhatsApp: 685 011 494.
- Envíos: 5,50€ tarifa plana a Península (Nacex/Correos). Gratis en compras > 50€. Entrega en 24-48h laborables. No enviamos fuera de la Península.
- Recogida: Gratis en tienda física.
- Devoluciones: 14 días naturales desde la recepción. El producto debe estar impecable y con etiquetas. Los gastos de envío de devolución corren a cargo de la clienta.
- Pagos: Aceptamos Tarjeta y Bizum (pasarela segura Redsys).
- Sobre nosotros: Boutique dedicada a celebrar la feminidad y exclusividad. "Donde la elegancia y el estilo se encuentran a la orilla del mar".

INVENTARIO REAL (Usa esta info para recomendar):
${productsInfo}

REGLAS DE RESPUESTA:
1. Sé persuasiva pero concisa.
2. Si un producto es "NOVEDAD", menciónalo con entusiasmo.
3. Genera el enlace al producto usando ESTE FORMATO EXACTO: ${window.location.origin}/producto/[product_id]. (Ejemplo: ${window.location.origin}/producto/20). NO inventes nombres o slugs, usa solo el ID numérico.
4. Si preguntan por una talla, mira el "Tallas/Stock" y confirma si la tienes. Si el stock es 0, di que está agotada pero ofrece algo similar.
5. Si no encuentras nada en el inventario, invita a escribir por WhatsApp o sugiere mirar las "Novedades" en la web.
`;

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
          temperature: 0.6,
          max_tokens: 600
        })
      });

      if (!response.ok) throw new Error('Groq API Error');
      
      const data = await response.json();
      const botResponse = data.choices[0].message.content;

      setMessages(prev => [...prev, { id: Date.now().toString(), text: botResponse, isBot: true }]);
    } catch (error) {
      console.error('AIChat Error:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: 'Lo siento, estoy teniendo un problema técnico. ¿Podrías repetirme la pregunta o contactarnos por WhatsApp?', isBot: true }]);
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
