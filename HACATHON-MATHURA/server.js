import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { registerIntentPlan } from './mcpClient.js';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// @ts-ignore
const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || "AIzaSyDnr4Mgix440arZr6qfaCPDYaehI0lPNps" });

// Dummy bash execution wrapper (armorCodex hook simulation)
async function executeBashSecurely(command, rawPrompt) {
  try {
    console.log(`[Secure Execution] Intent registration for: ${command}`);
    // Register intent with armorCodex MCP
    await registerIntentPlan(`Execute bash command: ${command}`, rawPrompt);
    
    // Once intent is registered, execute the command (simulating what the hook does)
    console.log(`[Secure Execution] Running: ${command}`);
    const { stdout, stderr } = await execPromise(command);
    return `stdout: ${stdout}\nstderr: ${stderr}`;
  } catch (err) {
    console.error(`[Secure Execution] Error:`, err);
    return `Error: ${err.message}`;
  }
}

app.post('/api/analyze', async (req, res) => {
  const { prompt, mimeType, imageBuffer } = req.body;

  try {
    // 1. Initial Prompt with Tool capabilities
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt + "\n\nExplain step by step in Hindi and English mix. Be a personal tutor. You can also run bash commands if needed." },
            { inlineData: { mimeType, data: imageBuffer } }
          ]
        }
      ],
      tools: [{
        functionDeclarations: [
          {
            name: "execute_bash",
            description: "Execute a bash command on the server securely via armorCodex.",
            parameters: {
              type: "OBJECT",
              properties: {
                command: {
                  type: "STRING",
                  description: "The bash command to execute"
                }
              },
              required: ["command"]
            }
          }
        ]
      }]
    });

    // 2. Handle Tool Calls if any
    if (response.functionCalls && response.functionCalls.length > 0) {
      let functionResponses = [];
      for (const call of response.functionCalls) {
        if (call.name === 'execute_bash') {
          const result = await executeBashSecurely(call.args.command, prompt);
          functionResponses.push({
            name: call.name,
            response: { result }
          });
        }
      }

      // Send the tool response back to Gemini to get the final answer
      const finalResponse = await ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: [
           {
             role: 'user',
             parts: [
               { text: prompt + "\n\nExplain step by step in Hindi and English mix. Be a personal tutor. You can also run bash commands if needed." },
               { inlineData: { mimeType, data: imageBuffer } }
             ]
           },
           {
             role: 'model',
             parts: response.functionCalls.map(c => ({ functionCall: c }))
           },
           {
             role: 'user',
             parts: functionResponses.map(fr => ({ functionResponse: fr }))
           }
         ]
      });

      return res.json({ result: finalResponse.text });
    }

    // Return the normal text if no tool was called
    return res.json({ result: response.text });
  } catch (error) {
    console.error("Backend Analyze Error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Suvidha Secure Backend running on port ${PORT}`);
});
