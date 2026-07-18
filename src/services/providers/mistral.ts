import { Mistral } from '@mistralai/mistralai';
import { LLMProvider, QueryLLMParams, QueryLLMResult } from '../types.js';

export class MistralProvider implements LLMProvider {
  name = 'mistral';
  defaultModel = 'mistral-large-latest';
  envKey = 'MISTRAL_API_KEY';

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
    const mistral = new Mistral({ apiKey: resolvedKey });

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

    const response = await mistral.chat.complete(reqBody);

    return {
      text: (response.choices?.[0]?.message?.content as string) || '',
      model: response.model || resolvedModel,
      provider: this.name,
      usage: response.usage ? {
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
      } : undefined,
    };
  }
}
export default MistralProvider;
