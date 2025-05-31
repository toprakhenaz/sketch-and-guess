import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Construction } from 'lucide-react';
import Link from 'next/link';

export default function MultiplayerGamePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center space-y-8">
        <Construction className="h-24 w-24 text-accent" />
        <h1 className="text-4xl font-headline font-bold text-primary">Multiplayer Mode</h1>
        <p className="text-xl text-foreground/80 max-w-md">
          Get ready to draw and guess with players from around the world! This mode is currently under construction.
        </p>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="font-headline">Coming Soon!</CardTitle>
            <CardDescription>We're working hard to bring you an amazing multiplayer experience.</CardDescription>
          </CardHeader>
          <CardContent>
            <Users className="h-16 w-16 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Stay tuned for updates!</p>
          </CardContent>
        </Card>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Back to Home</Link>
        </Button>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground">
        Patience is a virtue, especially in game development!
      </footer>
    </div>
  );
}
