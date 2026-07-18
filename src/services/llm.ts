import { QueryLLMParams, QueryLLMResult, LLMProvider } from './types.js';
import { GeminiProvider } from './providers/gemini.js';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { CohereProvider } from './providers/cohere.js';
import { GroqProvider } from './providers/groq.js';
import { MistralProvider } from './providers/mistral.js';
import { OpenRouterProvider } from './providers/openrouter.js';

// Central Registry of all LLM provider strategies
const providers: Record<string, LLMProvider> = {
  gemini: new GeminiProvider(),
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  cohere: new CohereProvider(),
  groq: new GroqProvider(),
  mistral: new MistralProvider(),
  openrouter: new OpenRouterProvider(),
};

// Dynamically generate metadata maps for the server
export const DEFAULT_MODELS = Object.fromEntries(
  Object.entries(providers).map(([key, provider]) => [key, provider.defaultModel])
) as Record<string, string>;

export const ENV_KEY_MAP = Object.fromEntries(
  Object.entries(providers).map(([key, provider]) => [key, provider.envKey])
) as Record<string, string>;

/**
 * Entry point to query any supported LLM provider.
 * Delegates the query execution to the respective LLMProvider implementation.
 */
export async function queryLLM(params: QueryLLMParams): Promise<QueryLLMResult> {
  const providerInstance = providers[params.provider];
  if (!providerInstance) {
    throw new Error(`Unsupported provider: ${params.provider}`);
  }
  return providerInstance.query(params);
}
