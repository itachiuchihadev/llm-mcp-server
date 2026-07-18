export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface QueryLLMParams {
  provider: 'gemini' | 'openai' | 'anthropic' | 'cohere' | 'groq' | 'mistral' | 'openrouter';
  prompt: string;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object' | 'detailed';
  chatHistory?: ChatMessage[];
}

export interface QueryLLMResult {
  text: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface LLMProvider {
  name: string;
  defaultModel: string;
  envKey: string;
  query(params: QueryLLMParams): Promise<QueryLLMResult>;
}
