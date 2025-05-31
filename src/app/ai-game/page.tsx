"use client";

import { useState, useEffect, useCallback } from 'react';
import { generateDrawingPrompt, type GenerateDrawingPromptInput } from '@/ai/flows/generate-drawing-prompt';
import { evaluateUserGuess, type EvaluateUserGuessInput, type EvaluateUserGuessOutput } from '@/ai/flows/evaluate-user-guess';

import { Header } from '@/components/layout/Header';
import { DrawingDisplay } from '@/components/game/DrawingDisplay';
import { GuessInput } from '@/components/game/GuessInput';
import { ScoreBoard } from '@/components/game/ScoreBoard';
import { FeedbackDisplay } from '@/components/game/FeedbackDisplay';
import { GameControls } from '@/components/game/GameControls';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


export default function AIGamePage() {
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState<boolean>(true);
  const [feedbackResult, setFeedbackResult] = useState<EvaluateUserGuessOutput | null>(null);
  const [isSubmittingGuess, setIsSubmittingGuess] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [roundOver, setRoundOver] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<GenerateDrawingPromptInput['difficulty']>('easy');
  const { toast } = useToast();

  const fetchNewPrompt = useCallback(async () => {
    setIsLoadingPrompt(true);
    setFeedbackResult(null);
    setRoundOver(false);
    setCurrentPrompt(null); 
    try {
      const result = await generateDrawingPrompt({ difficulty });
      setCurrentPrompt(result.prompt);
    } catch (error) {
      console.error("Failed to generate drawing prompt:", error);
      toast({
        title: "Error",
        description: "Could not load a new drawing prompt. Please try again.",
        variant: "destructive",
      });
      setCurrentPrompt("Error loading prompt. Try refreshing.");
    } finally {
      setIsLoadingPrompt(false);
    }
  }, [difficulty, toast]);

  useEffect(() => {
    fetchNewPrompt();
  }, [fetchNewPrompt]);

  const handleGuessSubmit = async (guess: string) => {
    if (!currentPrompt) return;

    setIsSubmittingGuess(true);
    setRoundOver(false);
    try {
      const result = await evaluateUserGuess({ drawingDescription: currentPrompt, userGuess: guess });
      setFeedbackResult(result);
      if (result.isCorrect) {
        setScore((prevScore) => prevScore + 10); // Award 10 points for correct guess
      }
      setRoundOver(true);
    } catch (error) {
      console.error("Failed to evaluate guess:", error);
      toast({
        title: "Error",
        description: "Could not submit your guess. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingGuess(false);
    }
  };

  const handleNextRound = () => {
    fetchNewPrompt();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center space-y-6">
        <h1 className="text-4xl font-headline font-bold text-primary">AI Guessing Challenge</h1>
        
        <div className="w-full max-w-xs">
          <ScoreBoard score={score} />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4 items-center justify-center">
          <span className="text-sm font-medium text-foreground">Difficulty:</span>
          {(['easy', 'medium', 'hard'] as const).map(level => (
            <Button
              key={level}
              variant={difficulty === level ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setDifficulty(level);
                // Optionally fetch new prompt immediately on difficulty change
                // fetchNewPrompt(); // This might be too disruptive, let user click next round
              }}
              disabled={isLoadingPrompt || isSubmittingGuess}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Button>
          ))}
        </div>
        
        <DrawingDisplay prompt={currentPrompt} isLoading={isLoadingPrompt} />
        
        {!isLoadingPrompt && (
          <GuessInput 
            onSubmit={handleGuessSubmit} 
            isSubmitting={isSubmittingGuess}
            disabled={roundOver}
          />
        )}
        
        {feedbackResult && <FeedbackDisplay feedbackResult={feedbackResult} />}
        
        <GameControls 
          onNextRound={handleNextRound} 
          isRoundOver={roundOver}
          isLoadingNewPrompt={isLoadingPrompt}
        />

        { (isLoadingPrompt && !currentPrompt) && 
          <div className="flex items-center justify-center p-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-foreground">Loading your challenge...</p>
          </div>
        }
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground">
        Art by AI, Guessed by You!
      </footer>
    </div>
  );
}
