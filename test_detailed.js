import { spawn } from 'child_process';

console.log('Starting detailed formatting verification test...');
const mcpProcess = spawn('node', ['./dist/index.js']);

let step = 0;

mcpProcess.stdout.on('data', (data) => {
  const responses = data.toString().trim().split('\n');
  for (const responseStr of responses) {
    if (!responseStr) continue;
    
    try {
      const response = JSON.parse(responseStr);
      console.log(`\n=== STDOUT [Step ${step}] ===\n`, JSON.stringify(response, null, 2));

      if (step === 0) {
        step = 1;
        const queryRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'query_llm',
            arguments: {
              provider: 'gemini',
              prompt: 'Explain what gravity is in one sentence.',
              responseFormat: 'detailed',
            },
          },
        };
        console.log('\nSending tools/call query_llm (gemini with responseFormat detailed) request...');
        mcpProcess.stdin.write(JSON.stringify(queryRequest) + '\n');
      } else if (step === 1) {
        mcpProcess.kill();
        console.log('\nDetailed format test completed!');
        if (response.result && response.result.content && response.result.content[0]) {
          console.log('Success! Received detailed response:\n', response.result.content[0].text);
          process.exit(0);
        } else {
          console.error('Error: Unexpected response structure or error:', response);
          process.exit(1);
        }
      }
    } catch (err) {
      console.error('JSON Parse error on response:', responseStr, err);
      mcpProcess.kill();
      process.exit(1);
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
}, 12000);
