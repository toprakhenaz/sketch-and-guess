"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';

interface GuessInputProps {
  onSubmit: (guess: string) => void;
  isSubmitting: boolean;
  disabled?: boolean;
}

export function GuessInput({ onSubmit, isSubmitting, disabled = false }: GuessInputProps) {
  const [guess, setGuess] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (guess.trim() && !isSubmitting && !disabled) {
      onSubmit(guess.trim());
      setGuess('');
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader className="items-center">
        <CardTitle className="text-xl font-headline">Your Guess</CardTitle>
        <CardDescription>Type what you think the drawing is!</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Enter your guess..."
            disabled={isSubmitting || disabled}
            className="flex-grow text-base"
            aria-label="Your guess"
          />
          <Button type="submit" disabled={isSubmitting || disabled || !guess.trim()} className="w-full sm:w-auto">
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Guess'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
