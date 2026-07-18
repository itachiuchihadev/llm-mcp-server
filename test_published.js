import { spawn } from 'child_process';

console.log('Bootstrapping published npm package: @abhishekkumar00019/llm-mcp-server...');
// Use --package flag explicitly to guide npx on scoped package binaries on Windows
const mcpProcess = spawn('npx', ['-y', '--package', '@abhishekkumar00019/llm-mcp-server', 'llm-mcp-server'], { shell: true });

mcpProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  console.log(`[STDOUT Chunk]: ${output}`);
  
  if (output.includes('jsonrpc')) {
    console.log('\nSuccess! Received valid JSON-RPC handshake response.');
    mcpProcess.kill();
    process.exit(0);
  }
});

mcpProcess.stderr.on('data', (data) => {
  console.error(`[Server Log / STDERR]: ${data.toString().trim()}`);
});

const handshake = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'npx-test-runner', version: '1.0.0' },
  },
};

setTimeout(() => {
  console.log('Sending JSON-RPC initialization handshake message to stdin...');
  mcpProcess.stdin.write(JSON.stringify(handshake) + '\n');
}, 4000);

// Timeout safety
setTimeout(() => {
  console.error('Error: Handshake response timed out after 12 seconds.');
  mcpProcess.kill();
  process.exit(1);
}, 12000);
