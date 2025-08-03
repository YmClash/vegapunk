import { OllamaProvider } from '@/llm/OllamaProvider';
import { HuggingFaceProvider } from '@/llm/HuggingFaceProvider';
import { ShakaAgent } from '@agents/shaka/ShakaAgent';
import { logger } from '@utils/logger';
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

type LLMProvider = OllamaProvider | HuggingFaceProvider;

type ProviderType = 'ollama' | 'huggingface';

export class ChatHandler extends EventEmitter {
  private context: ChatContext;
  private messageIdCounter: number = 0;
  private providers: Map<ProviderType, LLMProvider>;
  private currentProvider: ProviderType;
  private shakaAgent?: ShakaAgent;

  constructor(private ollama: OllamaProvider, private huggingface?: HuggingFaceProvider) {
    super();
    
    this.providers = new Map();
    this.providers.set('ollama', ollama);
    
    if (huggingface) {
      this.providers.set('huggingface', huggingface);
    }
    
    // Default to Ollama, fallback to Hugging Face if available
    this.currentProvider = 'ollama';
    
    this.context = {
      messages: [],
      systemPrompt: this.getSystemPrompt(),
      maxHistoryLength: 10
    };

    // Add initial system message
    this.addMessage(this.context.systemPrompt, 'system');

    // Initialize ShakaAgent if we have a provider
    this.initializeShakaAgent();
  }

  private getSystemPrompt(): string {
    return `Tu es Vegapunk, un assistant IA avancé inspiré du Dr Vegapunk de One Piece.

🧠 SYSTÈME VEGAPUNK:
Vous êtes l'intelligence principale du système Vegapunk Dashboard, conçu pour aider les utilisateurs avec des tâches techniques et scientifiques.

Principales caractéristiques:
- Serviable, intelligent et curieux des découvertes scientifiques
- Expert en concepts d'IA et de développement
- Assistant technique pour le système Vegapunk
- Compétent en programmation, architecture système et technologies

Capacités actuelles:
- Conversation naturelle et assistance technique
- Explication de concepts complexes d'IA
- Aide avec la configuration et l'utilisation du système
- Support pour le développement et l'architecture

Soyez concis mais complet dans vos réponses.`;
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

  async processMessage(userMessage: string): Promise<{ response: string; agent: string; ethicalAnalysis?: any; isCollaborative?: boolean }> {
    try {
      // Add user message to context
      this.addMessage(userMessage, 'user');
      
      // Chat principal = Vegapunk uniquement (simple et rapide)
      return await this.processVegapunkQuery(userMessage);
    } catch (error: any) {
      logger.error('Chat processing error:', error);
      const providerName = this.currentProvider === 'ollama' ? 'Ollama' : 'Hugging Face';
      const errorMessage = `I apologize, but I encountered an error processing your message. Please ensure ${providerName} is properly configured and try again.`;
      this.addMessage(errorMessage, 'assistant', { error: error.message, provider: this.currentProvider });
      throw error;
    }
  }

  async streamMessage(userMessage: string, onChunk: (chunk: string) => void): Promise<void> {
    try {
      // Add user message to context
      this.addMessage(userMessage, 'user');
      
      // Build prompt with context
      const prompt = this.buildPrompt(userMessage);
      
      logger.debug('Streaming chat message', { 
        userMessage: userMessage.substring(0, 100),
        provider: this.currentProvider 
      });
      
      let fullResponse = '';
      
      // Get response from current provider
      const provider = this.providers.get(this.currentProvider);
      if (!provider) {
        throw new Error(`Provider ${this.currentProvider} not available`);
      }
      
      // Stream response from current provider
      await provider.streamResponse(prompt, (chunk: string) => {
        fullResponse += chunk;
        onChunk(chunk);
      });
      
      // Add complete response to context
      this.addMessage(fullResponse, 'assistant');
      
    } catch (error: any) {
      logger.error('Chat streaming error:', error);
      const providerName = this.currentProvider === 'ollama' ? 'Ollama' : 'Hugging Face';
      const errorMessage = `I apologize, but I encountered an error streaming the response. Please ensure ${providerName} is properly configured and try again.`;
      this.addMessage(errorMessage, 'assistant', { error: error.message, provider: this.currentProvider });
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

  // Provider management methods
  setProvider(providerType: ProviderType): void {
    if (!this.providers.has(providerType)) {
      throw new Error(`Provider ${providerType} not available`);
    }
    
    const oldProvider = this.currentProvider;
    this.currentProvider = providerType;
    
    logger.info(`🔄 Switched LLM provider from ${oldProvider} to ${providerType}`);
    this.emit('provider-changed', { from: oldProvider, to: providerType });
  }

  getCurrentProvider(): ProviderType {
    return this.currentProvider;
  }

  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  async getProviderStatus(): Promise<Record<ProviderType, any>> {
    const status: Record<string, any> = {};
    
    for (const [providerType, provider] of this.providers) {
      try {
        if (providerType === 'ollama') {
          const ollamaProvider = provider as OllamaProvider;
          status[providerType] = await ollamaProvider.getHealthStatus();
        } else if (providerType === 'huggingface') {
          const hfProvider = provider as HuggingFaceProvider;
          status[providerType] = await hfProvider.getHealthStatus();
        }
      } catch (error) {
        // @ts-ignore
        status[providerType] = { status: 'error', error: error.message };
      }
    }
    
    return status;
  }

  addProvider(providerType: ProviderType, provider: LLMProvider): void {
    this.providers.set(providerType, provider);
    logger.info(`➕ Added LLM provider: ${providerType}`);
    this.emit('provider-added', providerType);
  }

  removeProvider(providerType: ProviderType): void {
    if (providerType === this.currentProvider) {
      throw new Error('Cannot remove the currently active provider');
    }
    
    this.providers.delete(providerType);
    logger.info(`➖ Removed LLM provider: ${providerType}`);
    this.emit('provider-removed', providerType);
  }

  // ShakaAgent integration methods

  private initializeShakaAgent(): void {
    try {
      // Use current provider for ShakaAgent
      const provider = this.providers.get(this.currentProvider);
      if (provider) {
        this.shakaAgent = new ShakaAgent(provider);
        this.setupShakaEventHandlers();
        logger.info('🧠 ShakaAgent initialized and integrated with ChatHandler');
      }
    } catch (error) {
      logger.warn('Failed to initialize ShakaAgent', error);
    }
  }

  private setupShakaEventHandlers(): void {
    if (!this.shakaAgent) return;

    this.shakaAgent.on('shaka:analysis-complete', (result) => {
      this.emit('shaka:analysis-complete', result);
    });

    this.shakaAgent.on('shaka:ethical-concern', (concern) => {
      this.emit('shaka:ethical-concern', concern);
    });

    this.shakaAgent.on('shaka:alert', (alert) => {
      this.emit('shaka:alert', alert);
    });
  }

  private isCollaborationRequest(userMessage: string): boolean {
    const collaborationKeywords = [
      'shaka', 'éthique', 'moral', 'opinion', 'analyse', 'conseil',
      'dilemme', 'décision', 'responsabilité', 'conséquences',
      'politique', 'guide', 'principes', 'valeurs', 'impact'
    ];
    
    const message = userMessage.toLowerCase();
    return collaborationKeywords.some(keyword => message.includes(keyword)) && 
           !message.includes('technique') && !message.includes('comment');
  }

  private async processVegapunkQuery(userMessage: string): Promise<{ response: string; agent: string }> {
    const prompt = this.buildPrompt(userMessage);
    
    logger.debug('Processing Vegapunk query', { 
      userMessage: userMessage.substring(0, 100),
      provider: this.currentProvider 
    });
    
    const provider = this.providers.get(this.currentProvider);
    if (!provider) {
      throw new Error(`Provider ${this.currentProvider} not available`);
    }
    
    const response = await provider.generateResponse(prompt);
    this.addMessage(response, 'assistant');
    
    return { response, agent: 'vegapunk' };
  }

  private async processShakaQuery(userMessage: string): Promise<{ response: string; agent: string; ethicalAnalysis: any }> {
    if (!this.shakaAgent) {
      throw new Error('ShakaAgent not initialized');
    }

    try {
      logger.info('🧠 Processing ethical query with ShakaAgent', {
        query: userMessage.substring(0, 100)
      });

      const result = await this.shakaAgent.processEthicalQuery({
        query: userMessage,
        context: {
          action: userMessage,
          intent: 'User ethical inquiry',
          stakeholders: ['user', 'system'],
        },
        framework: 'all'
      });

      const chatResponse = this.formatShakaResponse(result);
      this.addMessage(chatResponse, 'assistant', { 
        isEthical: true, 
        analysis: result.analysis 
      });

      return { 
        response: chatResponse, 
        agent: 'shaka',
        ethicalAnalysis: {
          compliance: result.confidence,
          concerns: result.analysis?.concerns?.length || 0,
          recommendations: result.recommendations?.length || 0,
          processingTime: result.processingTime || 0
        }
      };
    } catch (error: any) {
      logger.error('ShakaAgent processing error:', error);
      throw error;
    }
  }

  private async processCollaborativeQuery(userMessage: string): Promise<{ response: string; agent: string; isCollaborative: boolean }> {
    try {
      logger.info('🤝 Processing collaborative query with both agents', {
        query: userMessage.substring(0, 100)
      });

      // Get Vegapunk's technical perspective first
      const vegapunkPrompt = this.buildPrompt(userMessage + "\n\nNote: ShakaAgent will provide complementary ethical analysis.");
      const provider = this.providers.get(this.currentProvider);
      if (!provider) {
        throw new Error(`Provider ${this.currentProvider} not available`);
      }
      
      const vegapunkResponse = await provider.generateResponse(vegapunkPrompt);
      
      // Get ShakaAgent's ethical perspective if available
      let shakaResponse = "";
      if (this.shakaAgent) {
        const result = await this.shakaAgent.processEthicalQuery({
          query: userMessage,
          context: {
            action: userMessage,
            intent: 'Collaborative analysis',
            stakeholders: ['user', 'system'],
          },
          framework: 'all'
        });
        shakaResponse = this.formatShakaResponse(result);
      }

      // Combine both perspectives
      const collaborativeResponse = `🧠 **Vegapunk - Perspective Technique:**\n${vegapunkResponse}\n\n${shakaResponse}`;
      
      this.addMessage(collaborativeResponse, 'assistant', {
        isCollaborative: true,
        vegapunkResponse,
        shakaResponse
      });

      return { 
        response: collaborativeResponse, 
        agent: 'vegapunk', 
        isCollaborative: true 
      };

    } catch (error: any) {
      logger.error('Collaborative query processing error:', error);
      throw error;
    }
  }

  private formatShakaResponse(result: any): string {
    const { analysis, response, confidence, recommendations } = result;
    
    const complianceEmoji = confidence >= 0.8 ? '✅' : confidence >= 0.6 ? '⚠️' : '❌';
    const complianceText = confidence >= 0.8 ? 'Excellente' : confidence >= 0.6 ? 'Acceptable' : 'Préoccupante';

    let formattedResponse = `🧠 **Analyse Éthique Shaka**\n\n`;
    formattedResponse += `${response}\n\n`;
    
    formattedResponse += `📊 **Évaluation Éthique:**\n`;
    formattedResponse += `${complianceEmoji} Conformité: ${Math.round(confidence * 100)}% (${complianceText})\n`;
    
    if (analysis.concerns && analysis.concerns.length > 0) {
      formattedResponse += `⚠️ Préoccupations: ${analysis.concerns.length} identifiées\n`;
    }

    if (recommendations && recommendations.length > 0) {
      formattedResponse += `\n💡 **Recommandations:**\n`;
      recommendations.slice(0, 3).forEach((rec: string, index: number) => {
        formattedResponse += `${index + 1}. ${rec}\n`;
      });
    }

    return formattedResponse;
  }

  // ShakaAgent management methods

  public getShakaAgent(): ShakaAgent | undefined {
    return this.shakaAgent;
  }

  public activateShakaAgent(): boolean {
    if (!this.shakaAgent) {
      this.initializeShakaAgent();
    }
    
    if (this.shakaAgent) {
      this.shakaAgent.activate();
      logger.info('🧠 ShakaAgent activated via ChatHandler');
      return true;
    }
    
    return false;
  }

  public deactivateShakaAgent(): boolean {
    if (this.shakaAgent) {
      this.shakaAgent.deactivate();
      logger.info('ShakaAgent deactivated via ChatHandler');
      return true;
    }
    
    return false;
  }

  public getShakaStatus() {
    return this.shakaAgent ? this.shakaAgent.getStatus() : null;
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