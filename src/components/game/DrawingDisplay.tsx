"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';

interface DrawingDisplayProps {
  prompt: string | null;
  isLoading: boolean;
}

export function DrawingDisplay({ prompt, isLoading }: DrawingDisplayProps) {
  if (isLoading) {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-lg">
        <CardHeader className="items-center">
          <Lightbulb className="h-8 w-8 text-accent mb-2" />
          <CardTitle className="text-2xl font-headline">Guess the Drawing!</CardTitle>
          <CardDescription>The AI is thinking of something...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="aspect-video w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader className="items-center">
        <Lightbulb className="h-8 w-8 text-accent mb-2" />
        <CardTitle className="text-2xl font-headline">Guess the Drawing!</CardTitle>
        <CardDescription>What could this be?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6 text-center">
        <div className="bg-secondary p-4 rounded-lg">
          <p className="text-lg font-medium text-secondary-foreground">{prompt || "Waiting for prompt..."}</p>
        </div>
        <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          <Image
            src="https://placehold.co/600x400.png"
            alt="Drawing placeholder"
            width={600}
            height={400}
            className="object-cover"
            data-ai-hint="mystery object"
          />
        </div>
      </CardContent>
    </Card>
  );
}
