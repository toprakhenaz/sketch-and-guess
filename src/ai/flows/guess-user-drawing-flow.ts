'use server';
/**
 * @fileOverview AI flow for guessing what the user has drawn.
 *
 * - guessUserDrawing - A function that takes a user's drawing and returns an AI guess.
 * - GuessUserDrawingInput - The input type for the guessUserDrawing function.
 * - GuessUserDrawingOutput - The return type for the guessUserDrawing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GuessUserDrawingInputSchema = z.object({
  drawingDataUri: z
    .string()
    .describe(
      "A user's drawing, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GuessUserDrawingInput = z.infer<typeof GuessUserDrawingInputSchema>;

const GuessUserDrawingOutputSchema = z.object({
  guessedObjectName: z.string().describe('The name of the object or concept the AI guesses is depicted in the drawing, in Turkish.'),
  confidence: z.number().min(0).max(1).describe('The AI\'s confidence in its guess, from 0.0 to 1..0'),
  feedback: z.string().describe('Encouraging feedback for the user about their drawing, in Turkish.'),
  alternativeGuesses: z.array(z.string()).optional().describe('Up to 3 alternative guesses if confidence is not high, in Turkish.'),
});
export type GuessUserDrawingOutput = z.infer<typeof GuessUserDrawingOutputSchema>;

export async function guessUserDrawing(input: GuessUserDrawingInput): Promise<GuessUserDrawingOutput> {
  return guessUserDrawingFlow(input);
}

const guessUserDrawingPrompt = ai.definePrompt({
  name: 'guessUserDrawingPrompt',
  input: {schema: GuessUserDrawingInputSchema},
  output: {schema: GuessUserDrawingOutputSchema},
  prompt: `Sen bir yapay zeka sanat eleştirmeni ve uzman bir tahmincisin. Kullanıcı bir çizim sağladı.
Görevin, kullanıcının ne çizdiğini tahmin etmek.
Sağlanan resmi analiz et: {{media url=drawingDataUri}}

Çizime dayanarak şunları sağla (çıktı Türkçe olmalıdır):
1.  \`guessedObjectName\`: Çizimin neyi temsil ettiğine dair en iyi tahminin. Kısa ve öz ol (örneğin, "kedi", "ev", "gülen güneş").
2.  \`confidence\`: Tahminine olan güvenini temsil eden 0.0 (hiç emin değilim) ile 1.0 (çok eminim) arasında sayısal bir değer.
3.  \`feedback\`: Kullanıcıya çizimi hakkında kısa, arkadaşça ve cesaretlendirici bir geri bildirim mesajı. Emin değilsen, bunu eğlenceli bir şekilde belirtebilirsin. Örneğin: "Bu ilginç bir çizim! Acaba bir...?", veya "Harika çizgiler! Sanırım bu bir...".
4.  \`alternativeGuesses\`: Güvenin 0.7'nin altındaysa, olabileceği 1 ila 3 alternatif şey listele. Güven yüksekse, bu boş bir dizi olabilir veya atlanabilir.

Dilini arkadaşça ve bir oyun için uygun tut. Çıktının tamamı Türkçe olmalıdır.
Bir kedi çizimi için örnek çıktı:
{
  "guessedObjectName": "kedi",
  "confidence": 0.85,
  "feedback": "Bu çok sevimli bir çizim! Sanırım bu bir kedi.",
  "alternativeGuesses": ["aslan", "kaplan"]
}

Soyut bir çizim için örnek çıktı:
{
  "guessedObjectName": "soyut şekiller",
  "confidence": 0.4,
  "feedback": "Vay, bu çok yaratıcı bir çizim! Tam olarak ne olduğundan emin değilim ama ilginç görünüyor.",
  "alternativeGuesses": ["modern sanat eseri", "karmaşık bir desen", "bir rüya"]
}
`,
});

const guessUserDrawingFlow = ai.defineFlow(
  {
    name: 'guessUserDrawingFlow',
    inputSchema: GuessUserDrawingInputSchema,
    outputSchema: GuessUserDrawingOutputSchema,
  },
  async input => {
    const {output} = await guessUserDrawingPrompt(input);
    return output!;
  }
);
