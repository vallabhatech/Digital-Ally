import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('@google/genai');

export const GoogleGenAI = pkg.GoogleGenAI;
