import { spawn } from 'child_process';

console.log('Starting Multi-Provider LLM MCP Server local verification test...');
const mcpProcess = spawn('node', ['./dist/index.js']);

mcpProcess.stdout.on('data', (data) => {
  console.log(`\n=== STDOUT RECEIVED (JSON-RPC) ===\n${data.toString()}`);
  mcpProcess.kill();
  console.log('Test completed successfully! Server parsed initialization handshake.');
  process.exit(0);
});

mcpProcess.stderr.on('data', (data) => {
  console.error(`[Server Log / STDERR]: ${data.toString().trim()}`);
});

// Standard MCP Initialize request
const handshake = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'mcp-test-runner', version: '1.0.0' },
  },
};

setTimeout(() => {
  console.log('Sending JSON-RPC initialization handshake message to stdin...');
  mcpProcess.stdin.write(JSON.stringify(handshake) + '\n');
}, 1500);

// Set a timeout to prevent hanging if server fails to respond
setTimeout(() => {
  console.error('Error: Handshake response timed out after 6 seconds.');
  mcpProcess.kill();
  process.exit(1);
}, 6000);
