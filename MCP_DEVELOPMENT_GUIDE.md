# Model Context Protocol (MCP) Server Development Guide

This guide establishes the architectural standards, coding strategies, platform-specific workarounds, testing paradigms, and deployment structures for building robust, clean, and publishable MCP servers. Use this as a reference template for any MCP project.

---

## 1. Core Architectural Principles

All MCP servers should separate boot processes, protocol communication, and business logic into single-responsibility modules:

```
src/
  ├── index.ts        # Entry-point (bootstrapper only)
  ├── server.ts       # MCP Server definitions, tool schemas, and handler routing
  ├── services/       # Service layer (external APIs, file system, database operations)
  └── utils/          # Pure helper functions, formatting, and constants
```

### The Standard Output (Stdout) Boundary
> [!IMPORTANT]
> MCP Stdio transport relies **exclusively** on `stdout` for JSON-RPC message passing.
> - **Never** use `console.log()` for debugging or informational messages in any file.
> - **Always** redirect debugging logs, warnings, and trace statements to `console.error()`, which prints to `stderr`. The MCP client (e.g. Claude, Cursor) ignores `stderr` for protocol parsing but captures it for debug logging.

---

## 2. Project Bootstrapping (TypeScript / Node.js)

### package.json Best Practices
Ensure the package is configured as an ES module, supports bundlers, and exposes the entry point as a CLI binary:

```json
{
  "name": "@your-scope/package-name",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "your-executable-command": "./dist/index.js"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "start": "node dist/index.js"
  }
}
```

### tsup Bundler Configuration (`tsup.config.ts`)
Use `tsup` to compile TypeScript to a single executable ES Module, cleaning the output directory and prefixing the Node shebang:

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  dts: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
```

### tsconfig.json Configurations
Target modern environments with strict type compliance:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

---

## 3. Coding Strategies & Design Patterns

### Graceful Error Handling
Do not let tool execution failures crash the MCP server process. Instead, catch exceptions and return them as an error payload so the LLM understands what went wrong:

```typescript
try {
  // perform logic
} catch (error: any) {
  console.error("Error executing tool name:", error);
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: `Error description: ${error.message || error}`,
      },
    ],
  };
}
```

### Input Validation
Always enforce runtime input validation using `Zod` schemas. This ensures the LLM passes correctly typed arguments:

```typescript
import { z } from "zod";

const ToolInputSchema = z.object({
  param1: z.string().describe("Clear instructions for the LLM on what to pass"),
  param2: z.number().optional().describe("Optional configuration parameters"),
});
```

### Content Presentation for LLMs
Format the text content returned to the LLM cleanly using Markdown. LLMs parse tables, headers, and bullet points much better than unformatted raw JSON text blocks:

- Use **Markdown Headers (`###`)** to group sections.
- Use **Markdown Tables** to compare structured items.
- Use **Bullet points (`-`)** for key metrics.

---

## 4. Platform-Specific Workarounds (Windows)

### The `npx` Stdout Pollution Bug
On Windows, `npx` runs via a batch script wrapper (`npx.cmd`) which can echo command lines (e.g. `> npx ...`) directly to `stdout`. This corrupts the MCP JSON-RPC stream.

#### Workaround A: Direct Node Execution (Best for Production)
Install the package globally and point the client directly to the compiled script using `node`, bypassing the batch script:
```json
{
  "command": "node",
  "args": [
    "C:/Users/USERNAME/AppData/Roaming/npm/node_modules/@scope/package/dist/index.js"
  ]
}
```

#### Workaround B: CMD Execution Wrapper
Run `npx` through a command shell wrapper to hide prompt echoes:
```json
{
  "command": "cmd",
  "args": [
    "/c",
    "npx",
    "-y",
    "@scope/package"
  ]
}
```

---

## 5. Local Verification & Testing

Before publishing your package, test the Stdio transport handshake using a lightweight test script to prevent deployment loops.

Create a `test_mcp.js` file:
```javascript
import { spawn } from "child_process";

const mcpProcess = spawn("node", ["./dist/index.js"]);

mcpProcess.stdout.on("data", (data) => {
  console.log(`STDOUT (JSON-RPC): ${data.toString()}`);
  mcpProcess.kill();
  process.exit(0);
});

mcpProcess.stderr.on("data", (data) => {
  console.error(`STDERR (Logs): ${data.toString().trim()}`);
});

// Send a standard initialize handshake request
const handshake = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0.0" }
  }
};

setTimeout(() => {
  mcpProcess.stdin.write(JSON.stringify(handshake) + "\n");
}, 1000);
```

---

## 6. Deployment & CI/CD

### Publishing Scoped Packages
By default, scoped packages are treated as private. To publish them for free public usage, always include the `--access public` flag:

```bash
npm publish --access public
```

### Automated GitHub Action Workflow (`.github/workflows/publish.yml`)
Create a workflow to build and deploy to npm automatically when you push updates or create releases:

```yaml
name: Publish to npm

on:
  release:
    types: [published]
  push:
    branches:
      - main

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          registry-url: https://registry.npmjs.org/
      - run: npm install
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
