import { GoogleGenAI } from '@google/genai';
import { LLMProvider, QueryLLMParams, QueryLLMResult } from '../types.js';

export class GeminiProvider implements LLMProvider {
  name = 'gemini';
  defaultModel = 'gemini-2.5-flash';
  envKey = 'GEMINI_API_KEY';

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
    const ai = new GoogleGenAI({ apiKey: resolvedKey });

    const config: any = {};
    if (systemPrompt) config.systemInstruction = systemPrompt;
    if (temperature !== undefined) config.temperature = temperature;
    if (maxTokens !== undefined) config.maxOutputTokens = maxTokens;
    if (responseFormat === 'json_object') config.responseMimeType = 'application/json';

    if (chatHistory.length > 0) {
      const history = chatHistory.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));

      const chat = ai.chats.create({
        model: resolvedModel,
        history,
        config,
      });

      const result = await chat.sendMessage({ message: prompt });
      return {
        text: result.text || '',
        model: resolvedModel,
        provider: this.name,
      };
    } else {
      const result = await ai.models.generateContent({
        model: resolvedModel,
        contents: prompt,
        config,
      });
      return {
        text: result.text || '',
        model: resolvedModel,
        provider: this.name,
      };
    }
  }
}
export default GeminiProvider;
