import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, QueryLLMParams, QueryLLMResult } from '../types.js';

export class AnthropicProvider implements LLMProvider {
  name = 'anthropic';
  defaultModel = 'claude-3-5-haiku-latest';
  envKey = 'ANTHROPIC_API_KEY';

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
    const anthropic = new Anthropic({ apiKey: resolvedKey });

    const messages: Anthropic.MessageParam[] = [];
    for (const h of chatHistory) {
      messages.push({ role: h.role, content: h.content });
    }
    messages.push({ role: 'user', content: prompt });

    let resolvedSystemPrompt = systemPrompt;
    if (responseFormat === 'json_object') {
      const jsonInstruction =
        'CRITICAL: Return response as raw, valid JSON only. Do not wrap in markdown or add conversational filler.';
      resolvedSystemPrompt = resolvedSystemPrompt ? `${resolvedSystemPrompt}\n\n${jsonInstruction}` : jsonInstruction;
    }

    const response = await anthropic.messages.create({
      model: resolvedModel,
      system: resolvedSystemPrompt,
      messages,
      temperature,
      max_tokens: maxTokens || 4096,
    });

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('\n');

    return {
      text,
      model: response.model || resolvedModel,
      provider: this.name,
      usage: response.usage ? {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      } : undefined,
    };
  }
}
export default AnthropicProvider;
