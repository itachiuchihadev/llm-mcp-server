import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { queryLLM, DEFAULT_MODELS, ENV_KEY_MAP } from './services/llm.js';

// Setup MCP server metadata
export const server = new Server(
  {
    name: 'llm-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register list tools schema
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query_llm',
        description: 'Query a supported LLM provider (Gemini, OpenAI, Anthropic, Cohere, Groq, Mistral, OpenRouter) with a prompt and retrieve the model response.',
        inputSchema: {
          type: 'object',
          properties: {
            provider: {
              type: 'string',
              enum: ['gemini', 'openai', 'anthropic', 'cohere', 'groq', 'mistral', 'openrouter'],
              description: 'The LLM API provider to call.',
            },
            prompt: {
              type: 'string',
              description: 'The user prompt or instruction message.',
            },
            apiKey: {
              type: 'string',
              description: 'Optional API Key for authentication. If omitted, falls back to environment variables (e.g. GEMINI_API_KEY, OPENAI_API_KEY).',
            },
            model: {
              type: 'string',
              description: 'Optional specific model ID (e.g., gpt-4o-mini, gemini-1.5-flash). Defaults to a recommended model if omitted.',
            },
            systemPrompt: {
              type: 'string',
              description: 'Optional system instructions to direct behavior/formatting.',
            },
            temperature: {
              type: 'number',
              description: 'Optional sampling temperature (0.0 to 2.0).',
            },
            maxTokens: {
              type: 'number',
              description: 'Optional maximum number of output tokens to generate.',
            },
            responseFormat: {
              type: 'string',
              enum: ['text', 'json_object', 'detailed'],
              description: 'Optional response structure: "text" (default raw response), "json_object" (forces valid JSON outputs), or "detailed" (returns markdown detailed report including token usage).',
            },
            chatHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: {
                    type: 'string',
                    enum: ['user', 'assistant'],
                    description: 'The sender role.',
                  },
                  content: {
                    type: 'string',
                    description: 'The message content text.',
                  },
                },
                required: ['role', 'content'],
              },
              description: 'Optional array of message history objects for context.',
            },
          },
          required: ['provider', 'prompt'],
        },
      },
      {
        name: 'list_providers',
        description: 'Check status of all LLM providers, showcasing default models, required environment keys, and if keys are set.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Register call tool request handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'query_llm') {
      const QueryLLMInputSchema = z.object({
        provider: z.enum(['gemini', 'openai', 'anthropic', 'cohere', 'groq', 'mistral', 'openrouter']),
        prompt: z.string(),
        apiKey: z.string().optional(),
        model: z.string().optional(),
        systemPrompt: z.string().optional(),
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().int().positive().optional(),
        responseFormat: z.enum(['text', 'json_object', 'detailed']).optional(),
        chatHistory: z
          .array(
            z.object({
              role: z.enum(['user', 'assistant']),
              content: z.string(),
            })
          )
          .optional(),
      });

      const parsedArgs = QueryLLMInputSchema.parse(args);
      const result = await queryLLM(parsedArgs);

      if (parsedArgs.responseFormat === 'detailed') {
        const usageBlock = result.usage
          ? `### Token Usage\n- **Prompt Tokens**: ${result.usage.promptTokens ?? 'N/A'}\n- **Completion Tokens**: ${result.usage.completionTokens ?? 'N/A'}\n- **Total Tokens**: ${result.usage.totalTokens ?? 'N/A'}\n`
          : '';

        const detailedMarkdown = `## Query Details
- **Provider**: \`${result.provider}\`
- **Model Used**: \`${result.model}\`

${usageBlock}
### Response Content
${result.text}`;

        return {
          content: [
            {
              type: 'text',
              text: detailedMarkdown,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: result.text,
          },
        ],
      };
    } else if (name === 'list_providers') {
      const statusList = Object.keys(DEFAULT_MODELS).map((key) => {
        const provider = key as keyof typeof DEFAULT_MODELS;
        const envKey = ENV_KEY_MAP[provider];
        const isConfigured = !!process.env[envKey];
        return {
          provider,
          defaultModel: DEFAULT_MODELS[provider],
          envKey,
          configured: isConfigured ? '✅ Configured' : '❌ Missing API Key',
        };
      });

      let markdown = `### Multi-Provider LLM Status\n\n`;
      markdown += `| Provider | Default Model | Required Env Variable | Setup Status |\n`;
      markdown += `| :--- | :--- | :--- | :--- |\n`;
      for (const status of statusList) {
        markdown += `| **${status.provider}** | \`${status.defaultModel}\` | \`${status.envKey}\` | ${status.configured} |\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text: markdown,
          },
        ],
      };
    } else {
      throw new Error(`Tool not found: ${name}`);
    }
  } catch (error: any) {
    console.error(`Error in tool execution [${name}]:`, error);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Tool error: ${error.message || error}`,
        },
      ],
    };
  }
});
export default server;
