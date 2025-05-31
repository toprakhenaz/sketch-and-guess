import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Users, Palette } from 'lucide-react';
import { Header } from '@/components/layout/Header';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-6 space-y-12">
        <div className="text-center space-y-4">
          <Palette className="mx-auto h-16 w-16 text-primary" />
          <h1 className="text-5xl font-headline font-bold tracking-tight text-primary">
            Welcome to Artful Guesser!
          </h1>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Unleash your creativity and guessing skills. Choose a mode below to start the fun!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <Brain className="h-12 w-12 text-accent mb-2" />
              <CardTitle className="text-2xl font-headline">AI Guessing Mode</CardTitle>
              <CardDescription>
                Challenge the AI! Guess what the AI is thinking of based on its prompts.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full">
                <Link href="/ai-game">Play AI Mode</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <Users className="h-12 w-12 text-accent mb-2" />
              <CardTitle className="text-2xl font-headline">Multiplayer Mode</CardTitle>
              <CardDescription>
                Draw and guess with friends or other players online. (Coming Soon!)
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full" disabled>
                <Link href="/multiplayer-game">Play Multiplayer</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Artful Guesser. All rights reserved.
      </footer>
    </div>
  );
}
