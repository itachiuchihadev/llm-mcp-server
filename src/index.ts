import dotenv from 'dotenv';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import server from './server.js';

// Load environment variables from .env if present
dotenv.config();

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Multi-Provider LLM MCP Server initialized on stdio transport');
}

main().catch((error) => {
  console.error('Fatal error in bootstrap:', error);
  process.exit(1);
});
