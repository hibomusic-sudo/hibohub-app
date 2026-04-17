
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit initialization with the Google AI plugin.
 * The API key is automatically picked up from the GOOGLE_GENAI_API_KEY 
 * or GEMINI_API_KEY environment variable.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      // Explicitly check for both common environment variable names
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
});

export { googleAI };
