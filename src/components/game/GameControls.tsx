"use client";

import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';

interface GameControlsProps {
  onNextRound: () => void;
  isRoundOver: boolean;
  isLoadingNewPrompt: boolean;
}

export function GameControls({ onNextRound, isRoundOver, isLoadingNewPrompt }: GameControlsProps) {
  if (!isRoundOver) {
    return null;
  }

  return (
    <div className="mt-6 text-center">
      <Button onClick={onNextRound} size="lg" disabled={isLoadingNewPrompt}>
        <RotateCw className={`mr-2 h-5 w-5 ${isLoadingNewPrompt ? 'animate-spin' : ''}`} />
        {isLoadingNewPrompt ? 'Loading...' : 'Next Round'}
      </Button>
    </div>
  );
}
