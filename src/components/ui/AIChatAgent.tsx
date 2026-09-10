import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Maximize2, Minimize2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from "@/lib/supabase";
import { getProductPath } from '@/lib/productSlug';
import { useChatStore } from "@/store/useChatStore";
// Eliminamos Xenova/Transformers para usar OpenAI directamente (más preciso)
const getQueryEmbedding = async (text: string): Promise<number[]> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'embed', input: text }),
  });

  if (!response.ok) throw new Error('Embedding Error');
  const data = await response.json();
  return data.data[0].embedding;
};

const trimTrailingPunctuation = (value: string) =>
  value.replace(/[.,;:!?)\]}>]+$/g, '');

const isInternalPath = (href: string) =>
  href.startsWith('/producto/') ||
  href.startsWith('/categoria/') ||
  href.startsWith('/#');

/** Extrae href + etiqueta opcional desde markdown, URL absoluta o ruta relativa. */
const parseLinkToken = (
  token: string,
): { href: string; label?: string } | null => {
  const md = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (md) {
    const label = md[1].trim();
    const hrefRaw = md[2].trim();
    // Casos rotos del modelo: [/producto/...](#) o [texto](#)
    if (hrefRaw === '#' || hrefRaw === '') {
      if (isInternalPath(label)) return { href: trimTrailingPunctuation(label) };
      return null;
    }
    const href = trimTrailingPunctuation(hrefRaw);
    if (isInternalPath(href) || href.startsWith('http')) {
      const niceLabel =
        label && !isInternalPath(label) && !label.startsWith('http')
          ? label.replace(/\*\*/g, '').trim()
          : undefined;
      return { href, label: niceLabel };
    }
    return null;
  }

  if (/^https?:\/\//.test(token) || isInternalPath(token)) {
    return { href: trimTrailingPunctuation(token) };
  }
  return null;
};

const ProductLinkButton = ({
  href,
  label,
}: {
  href: string;
  label?: string;
}) => (
  <a
    href={href}
    className="flex items-center justify-between mt-2 mb-5 px-5 py-3.5 bg-secondary text-white text-[10px] font-black uppercase tracking-[0.18em] italic rounded-2xl hover:bg-primary transition-all group shadow-lg shadow-secondary/10 active:scale-[0.98]"
  >
    <span className="truncate pr-3">{label || 'Ver producto'}</span>
    <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors shrink-0">
      <Send className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
    </div>
  </a>
);

const formatPlainText = (text: string) =>
  text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\|.*\|$/gm, '')
    .replace(/^[-|:\s]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const formatMessage = (text: string) => {
  // Markdown links, http(s), o rutas internas sueltas
  const tokenRegex =
    /(\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s|]+|\/(?:producto|categoria)\/[^\s|\]>]+|\/#[^\s|\]>]+)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    const link = parseLinkToken(part);
    if (link) {
      const { href, label } = link;

      if (href.includes('wa.me') || href.includes('whatsapp')) {
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 mb-2 px-5 py-2.5 bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[#20BD5A] transition-all hover:scale-105 shadow-md shadow-green-500/20 active:scale-95"
          >
            <span>Hablar por WhatsApp</span>
          </a>
        );
      }

      if (href.includes('/producto/')) {
        return <ProductLinkButton key={index} href={href} label={label} />;
      }

      if (isInternalPath(href)) {
        return (
          <a
            key={index}
            href={href}
            className="inline-flex mt-3 mb-4 px-5 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:opacity-90 transition-all"
          >
            {label || 'Ver sección'}
          </a>
        );
      }

      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-bold underline hover:text-primary/80 break-all"
        >
          {label || href}
        </a>
      );
    }

    const plain = formatPlainText(part);
    if (!plain) return null;
    return (
      <span key={index} className="leading-relaxed whitespace-pre-wrap block">
        {plain}
      </span>
    );
  });
};

export const AIChatAgent = () => {
  const { pathname } = useLocation();
  const { messages, isOpen, setIsOpen, addMessage } = useChatStore();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) setIsExpanded(false);
  }, [isOpen]);

  if (pathname.startsWith('/admin') || pathname.startsWith('/cuenta')) {
    return null;
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    addMessage({ id: Date.now().toString(), text: userMsg, isBot: false });
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.isBot ? 'assistant' : 'user',
        content: m.text
      }));

      let productsInfo = '';
      let useProductSearch = true;

      const isNoveltyQuery = (text: string) => {
        const t = text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return /\b(novedad(es)?|nuevo[as]?|nuevos|recien(\s+llegad\w*)?|lo\s+ultimo|ultima\s+coleccion)\b/.test(
          t,
        );
      };

      const formatProductsForPrompt = (
        items: Array<{
          product_id: string;
          name: string;
          description?: string | null;
          price?: number;
          is_new?: boolean;
          slug?: string | null;
          variants?: Array<{ size?: string; color?: string | null; stock?: number }>;
        }>,
        slugById: Record<string, string | null> = {},
      ) =>
        items
          .map((p) => {
            const stockInfo =
              p.variants
                ?.map((v) => {
                  const label = v.color ? `${v.size}/${v.color}` : v.size;
                  return `${label}: ${v.stock ?? 0}uds`;
                })
                .join(', ') || 'Sin info de stock';
            const novelty = p.is_new ? '✨ NOVEDAD ✨' : '';
            const path = getProductPath({
              product_id: p.product_id,
              slug: slugById[p.product_id] ?? p.slug,
            });
            return `Artículo: ${p.name} ${novelty}. Precio: ${p.price}€. URL: ${path}. Tallas/Stock: ${stockInfo}. Descripción: ${p.description || ''}`;
          })
          .join('\n---\n');

      try {
        let matchedProducts: any[] = [];

        if (isNoveltyQuery(userMsg)) {
          const { data: news, error: newsError } = await supabase
            .from('products')
            .select(
              'product_id, name, description, price, is_new, slug, product_variants(size, stock, colors(name))',
            )
            .eq('is_new', true)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(12);

          if (newsError) throw newsError;

          matchedProducts = (news || []).map((p: any) => ({
            ...p,
            variants: (p.product_variants || []).map((v: any) => ({
              size: v.size,
              color: v.colors?.name || null,
              stock: v.stock ?? 0,
            })),
          }));
        } else {
          const embedding = await getQueryEmbedding(userMsg);
          const { data, error: rpcError } = await supabase.rpc('match_products', {
            query_embedding: embedding,
            match_threshold: 0.35,
            match_count: 12,
          });
          if (rpcError) throw rpcError;
          matchedProducts = data || [];
        }

        let slugById: Record<string, string | null> = {};
        if (matchedProducts.length > 0) {
          const ids = matchedProducts.map((p: { product_id: string }) => p.product_id);
          const { data: slugRows } = await supabase
            .from('products')
            .select('product_id, slug')
            .in('product_id', ids);
          slugById = Object.fromEntries(
            (slugRows || []).map((r: { product_id: string; slug: string | null }) => [
              r.product_id,
              r.slug,
            ]),
          );
        }

        productsInfo =
          matchedProducts.length > 0
            ? formatProductsForPrompt(matchedProducts, slugById)
            : 'No hay artículos específicos en el catálogo que coincidan.';
      } catch {
        useProductSearch = false;
        productsInfo = '';
      }

      const baseInfo = `
Eres MeloMe, la asistente virtual experta de la boutique "Modas Me lo Merezco". Tu objetivo es asesorar a las clientas con amabilidad, elegancia y un toque cercano.

IMPORTANTE: Los nombres de productos y categorías están en español y NO deben traducirse ni reinterpretarse. Usa siempre el nombre exacto del producto tal cual aparece en el inventario (ej: "Body", "Top", "Blazer", "Jeans" se mantienen así, nunca los conviertas a otras palabras).

INFORMACIÓN DE LA TIENDA:
- Ubicación: Calle Aragón, 2, Local 2, Benalmádena (Málaga).
- Teléfono/WhatsApp: 685 011 494.
- Envíos: 5,50€ tarifa plana a Península (Nacex/Correos). Gratis en compras > 50€. Entrega en 24-48h laborables. No enviamos fuera de la Península.
- Recogida: Gratis en tienda física.
- Devoluciones: 14 días naturales desde la recepción. El producto debe estar impecable y con etiquetas. Los gastos de envío de devolución corren a cargo de la clienta.
- Pagos: Aceptamos Tarjeta y Bizum (pasarela segura Redsys).
- Sobre nosotros: Boutique dedicada a celebrar la feminidad y exclusividad. "Donde la elegancia y el estilo se encuentran a la orilla del mar".
`;

      const inventoryBlock = useProductSearch
        ? `
INVENTARIO REAL (Usa esta info para recomendar):
${productsInfo}

REGLAS CRÍTICAS DE RESPUESTA:
1. SOLO recomienda artículos que estén en el "INVENTARIO REAL" arriba indicado. NUNCA inventes un producto que no aparezca en la lista.
2. Si la clienta pide una categoría (ej: Pantalón) y no hay ninguno en el inventario real, NO inventes ni recomiendes otra cosa de distinta categoría. Di amablemente que no tienes stock de eso ahora mismo y ofrece mirar las "Novedades" o contactar por WhatsApp.
3. Los enlaces a producto DEBEN ser copiados EXACTAMENTE del inventario real. No modifiques ni inventes URLs. Usa siempre la forma relativa (/producto/...) NUNCA con dominio completo.
4. Sé persuasiva pero muy concisa. Máximo 3 productos por respuesta.
5. Si un producto es "NOVEDAD", menciónalo con entusiasmo. Si el inventario trae artículos marcados como NOVEDAD (p. ej. la clienta preguntó por novedades), recomiéndalos; NUNCA digas que no hay novedades si aparecen en el inventario.
6. NUNCA digas "Excelente elección" ni frases similares si la clienta solo preguntó o pidió recomendaciones. Responde de forma natural como una dependienta de boutique. Si la clienta aún no ha elegido nada, no finjas que ya lo hizo.
7. NO compartas la URL completa del sitio web (https://www.modasmelomerezco.es) porque la usuaria ya está en él. Si quieres dirigir a una sección, usa solo el enlace relativo (ej: /#novedades).
8. Empieza SIEMPRE con 1 o 2 frases cortas y cercanas respondiendo a la clienta ANTES de listar productos. Nunca empieces la respuesta directamente con el nombre de un artículo.
9. FORMATO OBLIGATORIO: NUNCA uses tablas markdown, pipes |, ni sintaxis [texto](url) ni **negritas**. Tras la intro, para cada producto escribe 1 línea con nombre y precio, y en la línea siguiente SOLO la URL relativa tal cual del inventario. La interfaz la convertirá en un botón. Ejemplo correcto:
¡Claro! Aquí tienes unas opciones a buen precio:
COLLARES COLORINES — 15€
/producto/collares-colorines`
        : `
NOTA: En este momento no tengo acceso al catálogo de productos en tiempo real. NO inventes productos ni generes URLs de producto bajo ninguna circunstancia. Ayuda a la clienta con información general de la tienda (envíos, devoluciones, tallas, horarios) y sugiérele estas secciones reales de la web usando enlaces relativos:

- Ropa: /categoria/ropa
- Complementos: /categoria/complementos
- Bolsos: /categoria/bolsos
- Calzado: /categoria/calzado
- Novedades: /#novedades

Para dudas de stock, que contacte por WhatsApp (685 011 494). NUNCA escribas enlaces que no estén en esta lista. NUNCA incluyas el dominio completo (https://...) en los enlaces, usa siempre la forma relativa como se muestra arriba. NUNCA uses tablas markdown ni sintaxis [texto](url): pon la ruta relativa sola en su propia línea. Empieza siempre con una frase amable antes de los enlaces.`;

      const systemPrompt = baseInfo + inventoryBlock;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          systemPrompt,
          messages: [
            ...conversationHistory,
            { role: 'user', content: userMsg },
          ],
        }),
      });

      if (!response.ok) throw new Error('Groq API Error');
      
      const resData = await response.json();
      const botResponse = resData.choices[0].message.content;

      addMessage({ id: Date.now().toString(), text: botResponse, isBot: true });
    } catch (error) {
      console.error('AIChat Error:', error);
      addMessage({ id: Date.now().toString(), text: 'Lo siento, estoy teniendo un problema técnico. ¿Podrías repetirme la pregunta o contactarnos por WhatsApp?', isBot: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-primary text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        aria-label="Abrir chat"
      >
        <MessageCircle className="w-7 h-7" />
      </button>

      <div
        className={`fixed z-50 bg-white shadow-2xl overflow-hidden transition-all duration-300 transform origin-bottom-right flex flex-col border border-primary/10 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        } ${
          isExpanded
            ? 'inset-3 sm:inset-4 rounded-2xl w-auto h-auto max-h-none'
            : 'bottom-6 right-6 w-[90vw] sm:w-[380px] rounded-3xl'
        }`}
        style={
          isExpanded
            ? undefined
            : { height: '550px', maxHeight: '85vh' }
        }
      >
        <div className="bg-primary p-5 flex justify-between items-center text-white relative shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-white/20 p-2 rounded-full shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm tracking-wide">MeloMe AI</h3>
              <p className="text-[10px] opacity-80 uppercase tracking-widest">Asistente Virtual</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label={isExpanded ? 'Reducir chat' : 'Ampliar chat'}
              title={isExpanded ? 'Vista normal' : 'Pantalla completa'}
            >
              {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Cerrar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 min-h-0">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`p-3 text-sm rounded-2xl ${
                  isExpanded ? 'max-w-[min(100%,42rem)]' : 'max-w-[85%]'
                } ${msg.isBot ? 'bg-white border border-gray-100 shadow-sm' : 'bg-secondary text-white shadow-md'}`}
              >
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

        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
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
