'use server';

/**
 * @fileOverview AI flow for evaluating the user's guess in the AI mode of the Artful Guesser game.
 *
 * - evaluateUserGuess - A function that evaluates the user's guess and provides feedback.
 * - EvaluateUserGuessInput - The input type for the evaluateUserGuess function.
 * - EvaluateUserGuessOutput - The return type for the evaluateUserGuess function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateUserGuessInputSchema = z.object({
  drawingDescription: z
    .string()
    .describe('The description of the original drawing.'),
  userGuess: z.string().describe('The user submitted guess of the drawing.'),
});
export type EvaluateUserGuessInput = z.infer<typeof EvaluateUserGuessInputSchema>;

const EvaluateUserGuessOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the user guess is correct.'),
  feedback: z.string().describe('Feedback on how close the user guess is.'),
  correctAnswer: z.string().optional().describe('The correct answer of drawing, should only be populated if `isCorrect` is false.'),
});
export type EvaluateUserGuessOutput = z.infer<typeof EvaluateUserGuessOutputSchema>;

export async function evaluateUserGuess(input: EvaluateUserGuessInput): Promise<EvaluateUserGuessOutput> {
  return evaluateUserGuessFlow(input);
}

const evaluateUserGuessPrompt = ai.definePrompt({
  name: 'evaluateUserGuessPrompt',
  input: {schema: EvaluateUserGuessInputSchema},
  output: {schema: EvaluateUserGuessOutputSchema},
  prompt: `You are playing a game of Artful Guesser, where a user is trying to guess what was drawn.

  Evaluate the user's guess, and provide feedback on how close they are to the correct answer.

  Drawing Description: {{{drawingDescription}}}
  User Guess: {{{userGuess}}}

  Return the following:
  - isCorrect: true if the user's guess is correct, false otherwise.
  - feedback: provide feedback on how close the user's guess is to the drawing description. Be encouraging, and help them improve their guessing skills.
  - correctAnswer: If the user is incorrect, populate this field with the correct answer. Otherwise leave blank.
  `,
});

const evaluateUserGuessFlow = ai.defineFlow(
  {
    name: 'evaluateUserGuessFlow',
    inputSchema: EvaluateUserGuessInputSchema,
    outputSchema: EvaluateUserGuessOutputSchema,
  },
  async input => {
    const {output} = await evaluateUserGuessPrompt(input);
    return output!;
  }
);
