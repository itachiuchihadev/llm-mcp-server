import { CohereClientV2 } from 'cohere-ai';
import { LLMProvider, QueryLLMParams, QueryLLMResult } from '../types.js';

export class CohereProvider implements LLMProvider {
  name = 'cohere';
  defaultModel = 'command-r-plus';
  envKey = 'COHERE_API_KEY';

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
    const cohere = new CohereClientV2({ token: resolvedKey });

    const messages: any[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    for (const h of chatHistory) {
      messages.push({ role: h.role, content: h.content });
    }
    messages.push({ role: 'user', content: prompt });

    const reqBody: any = {
      model: resolvedModel,
      messages,
      temperature,
      maxTokens,
    };

    if (responseFormat === 'json_object') {
      reqBody.responseFormat = { type: 'json_object' };
    }

    const response = await cohere.chat(reqBody);

    let text = '';
    if (response.message?.content) {
      if (typeof response.message.content === 'string') {
        text = response.message.content;
      } else if (Array.isArray(response.message.content)) {
        text = response.message.content
          .map((block: any) => block.text || block.content || '')
          .join('\n');
      }
    }

    return {
      text,
      model: resolvedModel,
      provider: this.name,
      usage: response.usage ? {
        promptTokens:
          (response.usage as any).tokens?.inputTokens ??
          (response.usage as any).inputTokens ??
          (response.usage as any).billedInputTokens,
        completionTokens:
          (response.usage as any).tokens?.outputTokens ??
          (response.usage as any).outputTokens ??
          (response.usage as any).billedOutputTokens,
        totalTokens:
          ((response.usage as any).tokens?.inputTokens ?? (response.usage as any).inputTokens ?? 0) +
          ((response.usage as any).tokens?.outputTokens ?? (response.usage as any).outputTokens ?? 0),
      } : undefined,
    };
  }
}
export default CohereProvider;
