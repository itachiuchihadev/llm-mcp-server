import { spawn } from 'child_process';

console.log('Starting Multi-Provider LLM MCP Server tool execution test...');
const mcpProcess = spawn('node', ['./dist/index.js']);

let step = 0;

mcpProcess.stdout.on('data', (data) => {
  const responses = data.toString().trim().split('\n');
  for (const responseStr of responses) {
    if (!responseStr) continue;
    console.log(`\n=== STDOUT [Step ${step}] ===\n`, JSON.stringify(JSON.parse(responseStr), null, 2));

    if (step === 0) {
      // Send tools/list request
      step = 1;
      const listRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      };
      console.log('\nSending tools/list request...');
      mcpProcess.stdin.write(JSON.stringify(listRequest) + '\n');
    } else if (step === 1) {
      // Send tools/call list_providers request
      step = 2;
      const callRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'list_providers',
          arguments: {},
        },
      };
      console.log('\nSending tools/call list_providers request...');
      mcpProcess.stdin.write(JSON.stringify(callRequest) + '\n');
    } else if (step === 2) {
      // Finished
      mcpProcess.kill();
      console.log('\nTest completed successfully! All tools listed and called.');
      process.exit(0);
    }
  }
});

mcpProcess.stderr.on('data', (data) => {
  console.error(`[Server Log / STDERR]: ${data.toString().trim()}`);
});

// Start with initialize handshake
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
  console.log('Sending JSON-RPC initialization handshake...');
  mcpProcess.stdin.write(JSON.stringify(handshake) + '\n');
}, 1000);

// Timeout safety
setTimeout(() => {
  console.error('Error: Test execution timed out.');
  mcpProcess.kill();
  process.exit(1);
}, 8000);
