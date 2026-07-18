# Multi-Provider LLM MCP Server

An official Model Context Protocol (MCP) server that exposes a unified, secure routing interface to query multiple Large Language Model (LLM) providers. Built on top of TypeScript, it dynamically integrates with **Google Gemini**, **OpenAI**, **Anthropic Claude**, **Cohere**, **Groq**, **Mistral AI**, and **OpenRouter** using a modular Strategy Pattern.

This server enables agentic IDE clients (such as Claude Desktop, Cursor, Windsurf, or GitHub Copilot) to switch models dynamically based on task requirements, evaluate model outputs, and optimize API costs.

---

## 1. Why This Server? (Key Use Cases)

This MCP server goes beyond basic completions. It empowers your AI assistants with the following advanced capabilities:

### 🌟 Cross-Model Consensus Code Auditing (Multi-Model Voting)
Security and logic flaws can easily be missed by a single LLM. By invoking the `query_llm` tool across multiple providers (e.g. OpenAI, Anthropic, Gemini) on the same code snippet, your IDE agent can compare outputs:
- **How it works**: The agent sends the same prompt to GPT-4o, Claude 3.5 Sonnet, and Gemini 2.5. If two out of three models flag a potential SQL injection or logic bug, the agent warns you before deploying.

### 🌟 LLM-as-a-Judge (Automated Quality Evaluation)
Build automated feedback loops inside your workspace:
- **How it works**: Model A (OpenAI) writes a function. Model B (Anthropic) generates unit test cases. Model C (Gemini) evaluates both the implementation and test coverage, grading the overall solution and suggesting improvements.

### 🌟 Fallback Resilience & High-Availability Routing
API rate limits, service-specific outages, or server lag can interrupt automated coding workflows:
- **How it works**: If an API call to OpenAI fails or hits a rate limit, the routing service can dynamically catch the error and retry the query with Anthropic or Gemini, keeping your developer loop uninterrupted.

### 🌟 Cost-Optimized Context Compression (Token Optimization)
LLM costs scale with context size. Sending large files directly to high-reasoning models like Claude 3.5 Sonnet can quickly become expensive:
- **How it works**: Send massive logs or document dumps to a fast, cost-efficient model (such as Groq/Llama-3 or Gemini Flash) first. Instruct it to compress the information into a concise summary, and then send that summary to Claude for final refactoring.

### 🌟 Privacy Redaction & PII Pre-Filtering
When working with sensitive projects, sending raw user data or company secrets directly to closed-source proprietary APIs poses security risks:
- **How it works**: Route raw user messages to a local or open-source model (via Groq/Mistral) to redact secrets, keys, or PII (personally identifiable information) before forwarding the sanitized input to external proprietary models.

### 🌟 Synthetic Dialogue Simulation (Agent-User Mocking)
Testing interactive chatbot features requires realistic dialogues:
- **How it works**: Prompt one model (e.g. Mistral) to act as a difficult customer and another (e.g. GPT-4o-mini) to act as the support representative. You can simulate multi-turn chats automatically to test error handling, response times, and chat flows.

---

## 2. Architecture & Design Patterns

The server is designed using the **Strategy Pattern** and a **Central Registry** to ensure clean separation of concerns and effortless extensibility:

```
src/
  ├── index.ts              # Transport Bootstrapper
  ├── server.ts             # MCP Tool Definition & Schema Validation
  └── services/
        ├── types.ts        # Common contracts and LLMProvider interface
        ├── llm.ts          # Central Provider Registry
        └── providers/      # Individual Provider Clients (Strategies)
              ├── gemini.ts
              ├── openai.ts
              ├── anthropic.ts
              ├── cohere.ts
              ├── groq.ts
              ├── mistral.ts
              └── openrouter.ts
```

Every provider implements the `LLMProvider` contract:
```typescript
export interface LLMProvider {
  name: string;
  defaultModel: string;
  envKey: string;
  query(params: QueryLLMParams): Promise<QueryLLMResult>;
}
```

### Adding New Providers
To support a new provider, you do not need to modify the server routing logic:
1. Create a new provider file under `src/services/providers/your_provider.ts` implementing `LLMProvider`.
2. Register it in `src/services/llm.ts`.

---

## 3. Tool Interface

The server registers two primary tools with your MCP client:

### 1. `query_llm`
Query any supported LLM provider with a prompt.
- **`provider`** (Required): `"gemini"` | `"openai"` | `"anthropic"` | `"cohere"` | `"groq"` | `"mistral"` | `"openrouter"`.
- **`prompt`** (Required): The input message.
- **`apiKey`** (Optional): API Token. Falls back to environment variables if omitted.
- **`model`** (Optional): Specific model name. Defaults to a sensible model if omitted.
- **`systemPrompt`** (Optional): Guiding system context.
- **`temperature`** (Optional): Controls randomness (`0.0` to `2.0`).
- **`maxTokens`** (Optional): Max tokens to generate.
- **`responseFormat`** (Optional): `"text"` (raw completion), `"json_object"` (strictly JSON), or `"detailed"` (returns markdown reporting execution time, provider metadata, and token usage).
- **`chatHistory`** (Optional): Array of previous message history objects `[{ role: "user" | "assistant", content: "..." }]`.

### 2. `list_providers`
Lists status of all LLM providers, including default models, required environment keys, and if keys are set.

---

## 4. Installation & Configurations

Detailed templates for setting up this server in popular IDEs and clients are located in the [sample_mcp_configs](file:///c:/Users/abhi9/Documents/Work/AI%20Projects/llm_mcp/sample_mcp_configs) directory:
- [Claude Desktop Configuration](file:///c:/Users/abhi9/Documents/Work/AI%20Projects/llm_mcp/sample_mcp_configs/claude_desktop_config.json)
- [Cursor settings UI Guide](file:///c:/Users/abhi9/Documents/Work/AI%20Projects/llm_mcp/sample_mcp_configs/cursor_settings.json)
- [Windsurf IDE Configuration](file:///c:/Users/abhi9/Documents/Work/AI%20Projects/llm_mcp/sample_mcp_configs/windsurf_config.json)
- [GitHub Copilot Configuration](file:///c:/Users/abhi9/Documents/Work/AI%20Projects/llm_mcp/sample_mcp_configs/copilot_config.json)
- [Configuration Setup Guide](file:///c:/Users/abhi9/Documents/Work/AI%20Projects/llm_mcp/sample_mcp_configs/README.md)

### Publishing to NPM
To publish this package publicly under your scope, run:
```bash
npm publish --access public
```
Once published, users can configure their MCP client command to `npx` with args `["-y", "@abhishek-kumar-00019/llm-mcp-server"]`.
