'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating drawing prompts.
 *
 * - generateDrawingPrompt - A function that generates a drawing prompt.
 * - GenerateDrawingPromptInput - The input type for the generateDrawingPrompt function.
 * - GenerateDrawingPromptOutput - The return type for the generateDrawingPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDrawingPromptInputSchema = z.object({
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .default('medium')
    .describe('The difficulty of the drawing prompt.'),
});
export type GenerateDrawingPromptInput = z.infer<typeof GenerateDrawingPromptInputSchema>;

const GenerateDrawingPromptOutputSchema = z.object({
  prompt: z.string().describe('The generated drawing prompt.'),
});
export type GenerateDrawingPromptOutput = z.infer<typeof GenerateDrawingPromptOutputSchema>;

export async function generateDrawingPrompt(input: GenerateDrawingPromptInput): Promise<GenerateDrawingPromptOutput> {
  return generateDrawingPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDrawingPromptPrompt',
  input: {schema: GenerateDrawingPromptInputSchema},
  output: {schema: GenerateDrawingPromptOutputSchema},
  prompt: `You are a drawing prompt generator. Your job is to come up with fun and creative drawing prompts.

The difficulty of the prompt should be appropriate for the specified difficulty level: {{{difficulty}}}. Easy prompts should be simple and straightforward, medium prompts should be somewhat more challenging, and hard prompts should be very difficult and abstract.

Here's the prompt:
`,
});

const generateDrawingPromptFlow = ai.defineFlow(
  {
    name: 'generateDrawingPromptFlow',
    inputSchema: GenerateDrawingPromptInputSchema,
    outputSchema: GenerateDrawingPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
