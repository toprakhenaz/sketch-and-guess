"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';

interface ScoreBoardProps {
  score: number;
}

export function ScoreBoard({ score }: ScoreBoardProps) {
  return (
    <Card className="w-full max-w-xs mx-auto shadow-md bg-accent text-accent-foreground">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Score</CardTitle>
        <Award className="h-5 w-5 text-accent-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-center">{score}</div>
      </CardContent>
    </Card>
  );
}
