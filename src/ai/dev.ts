import { config } from 'dotenv';
config();

import '@/ai/flows/evaluate-user-guess.ts';
import '@/ai/flows/generate-drawing-prompt.ts';
import '@/ai/flows/guess-user-drawing-flow.ts';
