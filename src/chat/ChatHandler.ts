import { OllamaProvider } from '../llm/OllamaProvider';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: Record<string, any> | undefined;
}

interface ChatContext {
  messages: ChatMessage[];
  systemPrompt: string;
  maxHistoryLength: number;
}

export class ChatHandler extends EventEmitter {
  private context: ChatContext;
  private messageIdCounter: number = 0;

  constructor(private ollama: OllamaProvider) {
    super();
    
    this.context = {
      messages: [],
      systemPrompt: this.getSystemPrompt(),
      maxHistoryLength: 10
    };

    // Add initial system message
    this.addMessage(this.context.systemPrompt, 'system');
  }

  private getSystemPrompt(): string {
    return `Tu es Vegapunk, un assistant IA avancé qui fait partie d'un système multi-agents inspiré du Dr Vegapunk de One Piece..

Vous travaillez actuellement en mode tableau de bord, aidant les utilisateurs à interagir avec le système agentique Vegapunk et à le comprendre.

Principales caractéristiques:
- Vous êtes serviable, intelligent et curieux des découvertes scientifiques.
- Vous pouvez expliquer clairement des concepts complexes d'IA et de multi-agents.
- Vous représentez l'intelligence collective du système Vegapunk.
- Vous êtes actuellement en phase de test/développement.

Compétences actuelles:
- Conversation et assistance naturelles
- Explication de l'architecture multi-agents Vegapunk
- Aide à la configuration et à l'installation du système
- Informations sur l'IA et les agents autonomes

Soyez concis mais complet dans vos réponses. Utilisez les émojis avec parcimonie pour plus de clarté lorsque cela est utile.`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${++this.messageIdCounter}`;
  }

  private addMessage(content: string, role: ChatMessage['role'], metadata?: Record<string, any>): ChatMessage {
    const message: ChatMessage = {
      id: this.generateMessageId(),
      content,
      role,
      timestamp: new Date(),
      metadata
    };

    this.context.messages.push(message);
    
    // Trim history if too long (keep system message)
    if (this.context.messages.length > this.context.maxHistoryLength + 1) {
      const systemMessage = this.context.messages[0];
      const recentMessages = this.context.messages.slice(-(this.context.maxHistoryLength - 1));
      // @ts-ignore
      this.context.messages = [systemMessage, ...recentMessages];
    }

    this.emit('message', message);
    return message;
  }

  private buildPrompt(userMessage: string): string {
    // Build conversation history (only recent messages, not including current user message)
    const history = this.context.messages
      .filter(msg => msg.role !== 'system')
      .slice(-4) // Last 2 exchanges (user + assistant pairs)
      .map(msg => {
        const rolePrefix = msg.role === 'user' ? 'Human' : 'Assistant';
        return `${rolePrefix}: ${msg.content}`;
      })
      .join('\n\n');

    // Construct the full prompt - cleaner format
    /*const prompt = `${this.context.systemPrompt}*/
    return `${this.context.systemPrompt}

${history ? `Previous conversation:\n${history}\n\n` : ''}Human: ${userMessage}

Human: ${userMessage}

Assistant:`;
  }

  async processMessage(userMessage: string): Promise<string> {
    try {
      // Add user message to context
      this.addMessage(userMessage, 'user');
      
      // Build prompt with context
      const prompt = this.buildPrompt(userMessage);
      
      logger.debug('Processing chat message', { userMessage: userMessage.substring(0, 100) });
      
      // Get response from Ollama
      const response = await this.ollama.generateResponse(prompt);
      
      // Add assistant response to context
      this.addMessage(response, 'assistant');
      
      return response;
    } catch (error: any) {
      logger.error('Chat processing error:', error);
      const errorMessage = 'I apologize, but I encountered an error processing your message. Please ensure Ollama is running and try again.';
      this.addMessage(errorMessage, 'assistant', { error: error.message });
      throw error;
    }
  }

  async streamMessage(userMessage: string, onChunk: (chunk: string) => void): Promise<void> {
    try {
      // Add user message to context
      this.addMessage(userMessage, 'user');
      
      // Build prompt with context
      const prompt = this.buildPrompt(userMessage);
      
      logger.debug('Streaming chat message', { userMessage: userMessage.substring(0, 100) });
      
      let fullResponse = '';
      
      // Stream response from Ollama
      await this.ollama.streamResponse(prompt, (chunk: string) => {
        fullResponse += chunk;
        onChunk(chunk);
      });
      
      // Add complete response to context
      this.addMessage(fullResponse, 'assistant');
      
    } catch (error: any) {
      logger.error('Chat streaming error:', error);
      const errorMessage = 'I apologize, but I encountered an error streaming the response. Please ensure Ollama is running and try again.';
      this.addMessage(errorMessage, 'assistant', { error: error.message });
      throw error;
    }
  }

  getConversationHistory(): ChatMessage[] {
    return [...this.context.messages];
  }

  clearHistory(): void {
    const systemMessage = this.context.messages[0];
    // @ts-ignore
    this.context.messages = [systemMessage];
    this.emit('history-cleared');
    logger.info('Chat history cleared');
  }

  getMessageCount(): number {
    return this.context.messages.length - 1; // Exclude system message
  }
}


/*
Tu es Vegapunk, un assistant IA avancé qui fait partie d'un système multi-agents inspiré du Dr Vegapunk de One Piece..

Vous travaillez actuellement en mode tableau de bord, aidant les utilisateurs à interagir avec le système agentique Vegapunk et à le comprendre.

Principales caractéristiques:
- Vous êtes serviable, intelligent et curieux des découvertes scientifiques.
- Vous pouvez expliquer clairement des concepts complexes d'IA et de multi-agents.
- Vous représentez l'intelligence collective du système Vegapunk.
- Vous êtes actuellement en phase de test/développement.

Compétences actuelles:
- Conversation et assistance naturelles
- Explication de l'architecture multi-agents Vegapunk
- Aide à la configuration et à l'installation du système
- Informations sur l'IA et les agents autonomes

Soyez concis mais complet dans vos réponses. Utilisez les émojis avec parcimonie pour plus de clarté lorsque cela est utile.


You are Vegapunk, an advanced AI assistant that is part of a multi-agent system inspired by Dr. Vegapunk from One Piece.

You are currently operating in Dashboard mode, helping users interact with and understand the Vegapunk Agentic System.

Key characteristics:
- You are helpful, intelligent, and curious about scientific discovery
- You can explain complex AI and multi-agent concepts clearly
- You represent the collective intelligence of the Vegapunk system
- You are currently in testing/development phase

Current capabilities:
- Natural conversation and assistance
- Explaining the Vegapunk multi-agent architecture
- Helping with system configuration and setup
- Providing insights about AI and autonomous agents

Be concise but thorough in your responses. Use emojis sparingly for clarity when helpful.
 */