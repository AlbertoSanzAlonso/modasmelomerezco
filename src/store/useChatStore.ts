
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
}

interface ChatState {
  messages: Message[];
  isOpen: boolean;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setIsOpen: (isOpen: boolean) => void;
  clearChat: () => void;
}

const INITIAL_MESSAGE: Message = { 
  id: '1', 
  text: '¡Hola! Soy MeloMe, tu asistente virtual. ¿En qué puedo ayudarte? Si prefieres hablar por WhatsApp, pulsa aquí: https://wa.me/34685011494', 
  isBot: true 
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [INITIAL_MESSAGE],
      isOpen: false,
      addMessage: (message) => set((state) => ({ 
        messages: [...state.messages, message] 
      })),
      setMessages: (messages) => set({ messages }),
      setIsOpen: (isOpen) => set({ isOpen }),
      clearChat: () => set({ messages: [INITIAL_MESSAGE] }),
    }),
    {
      name: 'chat-session-storage',
      storage: createJSONStorage(() => sessionStorage), // Se borra al cerrar la pestaña
    }
  )
);
