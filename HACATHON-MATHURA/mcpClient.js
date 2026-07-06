import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the armorCodex MCP server
const armorCodexServerPath = path.resolve(__dirname, '../armorCodex/hosted-mcp/server.mjs');

let mcpClient = null;

export async function getMcpClient() {
  if (mcpClient) return mcpClient;

  try {
    console.log(`Connecting to armorCodex MCP Server at: ${armorCodexServerPath}`);
    const transport = new StdioClientTransport({
      command: 'node',
      args: [armorCodexServerPath]
    });

    mcpClient = new Client(
      { name: 'suvidha-agent-client', version: '1.0.0' },
      { capabilities: {} }
    );

    await mcpClient.connect(transport);
    console.log('Successfully connected to armorCodex MCP Server.');
    return mcpClient;
  } catch (error) {
    console.error('Failed to connect to armorCodex MCP Server:', error);
    throw error;
  }
}

export async function registerIntentPlan(intentPlan, rawPrompt) {
  const client = await getMcpClient();
  try {
    const result = await client.callTool({
      name: 'register_intent_plan',
      arguments: {
        intent_plan: intentPlan,
        raw_prompt: rawPrompt
      }
    });
    return result;
  } catch (err) {
    console.error('Error registering intent plan:', err);
    throw err;
  }
}
