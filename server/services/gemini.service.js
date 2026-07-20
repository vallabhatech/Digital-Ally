import { GoogleGenAI } from '@google/genai';
import { env } from '../env.js';
import { getServerConfig, getModelForTask } from '../config.js';

let apiKeys = [];
let currentKeyIndex = 0;
let aiClients = [];

export function initializeGeminiClients() {
  if (!env.GEMINI_API_KEY) return;
  apiKeys = env.GEMINI_API_KEY.split(',').map(k => k.trim()).filter(Boolean);
  aiClients = apiKeys.map(apiKey => new GoogleGenAI({ apiKey }));
}
initializeGeminiClients();

export function getGeminiClient() {
  if (aiClients.length === 0) return null;
  return aiClients[currentKeyIndex];
}

export function rotateGeminiClient() {
  if (aiClients.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % aiClients.length;
    console.warn(`Rotated Gemini API key. Now using key index ${currentKeyIndex}`);
  }
}

export async function callGemini(task, prompt) {
  let client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini API is not configured on the server.');
  }

  const config = getServerConfig();
  const model = getModelForTask(task);
  
  let lastError = null;
  const attempts = aiClients.length > 0 ? aiClients.length : 1;

  for (let i = 0; i < attempts; i++) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: config.generation.temperature,
          topP: config.generation.topP,
        },
      });
      const text = response.text || '';
      return { text, model, responseSizeBytes: Buffer.byteLength(text, 'utf8') };
    } catch (err) {
      lastError = err;
      const isRateLimit = err.status === 429 || err.status === 503 || (err.message && (err.message.includes('429') || err.message.includes('503') || err.message.includes('quota')));
      if (isRateLimit && aiClients.length > 1) {
        rotateGeminiClient();
        client = getGeminiClient();
      } else {
        throw err;
      }
    }
  }
  throw lastError || new Error('All Gemini API keys failed');
}

export async function checkGeminiHealth() {
  const client = getGeminiClient();
  if (!env.GEMINI_API_KEY || !client) {
    return {
      ok: false,
      configured: false,
      reachable: false,
      message: 'Gemini API key is not configured on the server.',
    };
  }

  try {
    const model = getModelForTask('website');
    await client.models.generateContent({
      model,
      contents: 'health check',
      config: {
        temperature: 0,
        topP: 0,
      },
    });

    return {
      ok: true,
      configured: true,
      reachable: true,
      message: `Gemini API is reachable (Key Index: ${currentKeyIndex}, Pool Size: ${aiClients.length}).`,
      model,
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      reachable: false,
      message: error instanceof Error ? error.message : 'Gemini API is unreachable.',
    };
  }
}
