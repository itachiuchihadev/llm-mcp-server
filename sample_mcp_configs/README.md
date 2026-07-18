# MCP Client Integration Configurations

This directory contains template configuration files and instructions for connecting the **Multi-Provider LLM MCP Server** to various Model Context Protocol (MCP) clients (such as Claude Desktop, Cursor, Windsurf, and GitHub Copilot).

---

## 1. Local vs Production (NPM) Execution

Each configuration can be written in two ways:

### Option A: Production Setup (Published NPM Package)
Once you publish the package under `@abhishekkumar00019/llm-mcp-server`, clients can run it globally via `npx` without needing the files locally:
- **Command**: `npx`
- **Args**: `["-y", "@abhishekkumar00019/llm-mcp-server"]`

### Option B: Local Development Setup (Direct Exec)
If you are modifying the code locally, run the server by pointing directly to your compiled build folder:
- **Command**: `node`
- **Args**: `["c:/Users/abhi9/Documents/Work/AI Projects/llm_mcp/dist/index.js"]`

---

## 2. Supported Clients Setup

### A. Claude Desktop
Claude Desktop reads a global configuration file to boot the server.
- **Windows File Path**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS File Path**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Configuration Template**: See [claude_desktop_config.json](file:///c:/Users/abhi9/Documents/Work/AI%20Projects/llm_mcp/sample_mcp_configs/claude_desktop_config.json).

---

### B. Windsurf IDE
Windsurf is an agentic IDE that supports MCP servers.
- **Windows File Path**: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`
- **macOS/Linux File Path**: `~/.codeium/windsurf/mcp_config.json`
- **Configuration Template**: See [windsurf_config.json](file:///c:/Users/abhi9/Documents/Work/AI%20Projects/llm_mcp/sample_mcp_configs/windsurf_config.json).

---

### C. GitHub Copilot
GitHub Copilot reads user configuration profiles to launch custom local or remote MCP servers.
- **Accessing Settings**: In VS Code, open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and choose **MCP: Open User Configuration** to configure your server.
- **Configuration Template**: See [copilot_config.json](file:///c:/Users/abhi9/Documents/Work/AI%20Projects/llm_mcp/sample_mcp_configs/copilot_config.json).

---

### D. Cursor IDE
Cursor does not currently use a shared JSON configuration file for MCP servers. Instead, servers are configured directly via the IDE Settings UI:
1. Open Cursor and navigate to **Settings** -> **Features** -> **MCP**.
2. Click **+ Add New MCP Server**.
3. Fill in the parameters:
   - **Name**: `llm-mcp-server`
   - **Type**: `command`
   - **Command**: `npx -y @abhishekkumar00019/llm-mcp-server` (Production) or `node "c:/Users/abhi9/Documents/Work/AI Projects/llm_mcp/dist/index.js"` (Local)
4. Use the reference details inside [cursor_settings.json](file:///c:/Users/abhi9/Documents/Work/AI%20Projects/llm_mcp/sample_mcp_configs/cursor_settings.json) to set up your environment credentials.

---

## 3. API Credentials Configuration

For each client, you must configure the environment variables for the LLM providers you want to use. Replace the placeholder values (e.g. `YOUR_GEMINI_API_KEY`) in the configs with your actual API tokens.

| Env Variable Key | Provider | Default Model |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini | `gemini-2.5-flash` |
| `OPENAI_API_KEY` | OpenAI / ChatGPT | `gpt-4o-mini` |
| `ANTHROPIC_API_KEY`| Anthropic Claude | `claude-3-5-haiku-latest` |
| `COHERE_API_KEY` | Cohere | `command-r-plus` |
| `GROQ_API_KEY` | Groq | `llama3-8b-8192` |
| `MISTRAL_API_KEY` | Mistral AI | `mistral-large-latest` |
| `OPENROUTER_API_KEY`| OpenRouter | `google/gemini-2.5-flash` |
