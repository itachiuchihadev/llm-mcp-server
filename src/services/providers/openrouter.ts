import OpenAI from 'openai';
import { LLMProvider, QueryLLMParams, QueryLLMResult } from '../types.js';

export class OpenRouterProvider implements LLMProvider {
  name = 'openrouter';
  defaultModel = 'google/gemini-2.5-flash';
  envKey = 'OPENROUTER_API_KEY';

  async query(params: QueryLLMParams): Promise<QueryLLMResult> {
    const {
      prompt,
      apiKey,
      model,
      systemPrompt,
      temperature,
      maxTokens,
      responseFormat = 'text',
      chatHistory = [],
    } = params;

    const resolvedKey = apiKey || process.env[this.envKey];
    if (!resolvedKey) {
      throw new Error(
        `API Key for provider "${this.name}" is missing. Please provide it in the "apiKey" parameter or set the "${this.envKey}" environment variable.`
      );
    }

    const resolvedModel = model || this.defaultModel;
    const openai = new OpenAI({
      apiKey: resolvedKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/modelcontextprotocol/servers',
        'X-Title': 'LLM MCP Server',
      },
    });

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    for (const h of chatHistory) {
      messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await openai.chat.completions.create({
      model: resolvedModel,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
    });

    return {
      text: response.choices[0]?.message?.content || '',
      model: response.model || resolvedModel,
      provider: this.name,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };
  }
}
export default OpenRouterProvider;
