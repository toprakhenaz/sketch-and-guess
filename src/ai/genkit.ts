
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Check for Genkit Google AI API Key
// The googleAI() plugin typically looks for GEMINI_API_KEY or GOOGLE_API_KEY
if (typeof process !== 'undefined' && !process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  console.warn(
    "WARNING: GEMINI_API_KEY (or GOOGLE_API_KEY) is not set in environment variables. " +
    "The Genkit Google AI plugin may not function correctly. " +
    "Please set this key in your .env.local file or deployment environment for AI features to work."
  );
  // Note: The googleAI() plugin might still attempt to initialize and could throw its own error
  // or operate in a degraded mode if the key is missing or invalid.
  // This warning aims to preemptively inform the developer.
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
