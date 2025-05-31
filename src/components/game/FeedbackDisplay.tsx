"use client";

import type { EvaluateUserGuessOutput } from '@/ai/flows/evaluate-user-guess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

interface FeedbackDisplayProps {
  feedbackResult: EvaluateUserGuessOutput | null;
}

export function FeedbackDisplay({ feedbackResult }: FeedbackDisplayProps) {
  if (!feedbackResult) {
    return null;
  }

  const { isCorrect, feedback, correctAnswer } = feedbackResult;

  return (
    <Card className={`w-full max-w-lg mx-auto shadow-lg ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
      <CardHeader className="items-center">
        {isCorrect ? (
          <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
        ) : (
          <XCircle className="h-10 w-10 text-red-500 mb-2" />
        )}
        <CardTitle className={`text-2xl font-headline ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {isCorrect ? 'Correct!' : 'Incorrect!'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-6 text-center">
        <p className="text-foreground/90 text-lg">{feedback}</p>
        {!isCorrect && correctAnswer && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm text-muted-foreground">
              The correct answer was: <strong className="text-primary">{correctAnswer}</strong>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
