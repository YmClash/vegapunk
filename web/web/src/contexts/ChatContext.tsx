import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface EthicalAnalysis {
  compliance: number;
  concerns: number;
  recommendations: number;
  processingTime: number;
  framework?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'vegapunk' | 'shaka';
  timestamp: Date;
  isStreaming?: boolean;
  ethicalAnalysis?: EthicalAnalysis;
  isCollaborative?: boolean; // Indique si c'est une collaboration entre agents
}

interface ChatContextType {
  messages: ChatMessage[];
  currentMessage: string;
  isTyping: boolean;
  connected: boolean;
  streamMode: boolean;
  currentStreamMessage: string;
  setCurrentMessage: (message: string) => void;
  setStreamMode: (enabled: boolean) => void;
  sendMessage: (message: string) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [streamMode, setStreamMode] = useState(false);
  const [currentStreamMessage, setCurrentStreamMessage] = useState('');
  const socketRef = useRef<Socket | null>(null);

  // Fonction pour ajouter un message (étendue pour multi-agents)
  const addMessage = (text: string, sender: 'user' | 'vegapunk' | 'shaka', ethicalAnalysis?: EthicalAnalysis, isCollaborative?: boolean) => {
    const message: ChatMessage = {
      id: `${Date.now()}_${Math.random()}`,
      text,
      sender,
      timestamp: new Date(),
      isStreaming: false,
      ethicalAnalysis,
      isCollaborative
    };
    setMessages(prev => [...prev, message]);
  };

  // Fonction pour envoyer un message
  const sendMessage = (messageText: string) => {
    if (!messageText.trim() || !socket || !connected) return;

    const text = messageText.trim();
    addMessage(text, 'user');
    setCurrentMessage('');
    setIsTyping(true);

    socket.emit('chat-message', { 
      message: text,
      streamMode: streamMode
    });
  };

  // Fonction pour vider les messages
  const clearMessages = () => {
    setMessages([]);
    addMessage('Chat history cleared. How can I help you?', 'vegapunk');
  };

  // Connexion WebSocket (uniquement au mount initial)
  useEffect(() => {
    // Éviter les connexions multiples
    if (socketRef.current) {
      return;
    }

    console.log('Initializing WebSocket connection...');
    
    const newSocket = io('http://localhost:8080', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Gestionnaires d'événements
    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setConnected(true);
      
      // Ajouter le message de bienvenue seulement si pas de messages existants
      setMessages(prev => {
        if (prev.length === 0) {
          return [{
            id: `welcome_${Date.now()}`,
            text: 'Welcome to Vegapunk Chat! I\'m Vegapunk, your AI assistant for technical and scientific support. How can I help you?',
            sender: 'vegapunk' as const,
            timestamp: new Date(),
            isStreaming: false
          }];
        }
        return prev;
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setConnected(false);
    });

    newSocket.on('chat-response', (data) => {
      addMessage(data.response, data.agent || 'vegapunk', data.ethicalAnalysis, data.isCollaborative);
      setIsTyping(false);
    });

    newSocket.on('chat-stream', (data) => {
      setCurrentStreamMessage(prev => prev + data.chunk);
    });

    newSocket.on('chat-complete', () => {
      setCurrentStreamMessage(current => {
        if (current) {
          addMessage(current, 'vegapunk');
          return '';
        }
        return current;
      });
      setIsTyping(false);
    });

    newSocket.on('chat-error', (data) => {
      addMessage(`Error: ${data.error}`, 'vegapunk');
      setIsTyping(false);
      setCurrentStreamMessage('');
    });

    // Nettoyage lors du démontage
    return () => {
      console.log('Cleaning up WebSocket connection...');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Dépendances vides pour s'exécuter seulement au mount

  // Restoration depuis localStorage au démarrage
  useEffect(() => {
    const savedMessages = localStorage.getItem('vegapunk_chat_messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Convertir les timestamps en objets Date
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Error parsing saved messages:', error);
      }
    }
  }, []);

  // Sauvegarde dans localStorage quand les messages changent
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('vegapunk_chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  const contextValue: ChatContextType = {
    messages,
    currentMessage,
    isTyping,
    connected,
    streamMode,
    currentStreamMessage,
    setCurrentMessage,
    setStreamMode,
    sendMessage,
    clearMessages
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}