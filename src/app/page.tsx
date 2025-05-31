import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Users, Palette, Brush } from 'lucide-react';
import { Header } from '@/components/layout/Header';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-6 space-y-12">
        <div className="text-center space-y-4">
          <Palette className="mx-auto h-16 w-16 text-primary" />
          <h1 className="text-5xl font-headline font-bold tracking-tight text-primary">
            Artful Guesser'a Hoş Geldiniz!
          </h1>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Yaratıcılığınızı ve tahmin becerilerinizi serbest bırakın. Eğlenceye başlamak için aşağıdan bir mod seçin!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <Brain className="h-12 w-12 text-accent mb-2" />
              <CardTitle className="text-2xl font-headline">Yapay Zeka Tahmin Modu</CardTitle>
              <CardDescription>
                Yapay zekaya meydan okuyun! Yapay zekanın komutlarına göre ne düşündüğünü tahmin edin.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full">
                <Link href="/ai-game">AI Modunda Oyna</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <Brush className="h-12 w-12 text-accent mb-2" />
              <CardTitle className="text-2xl font-headline">Sen Çiz, AI Tahmin Etsin</CardTitle>
              <CardDescription>
                Bir şeyler çizin ve yapay zekanın ne çizdiğinizi tahmin etmesini izleyin. Yaratıcılığınızı sına!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full">
                <Link href="/user-draws-game">Çiz ve Oyna</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <Users className="h-12 w-12 text-accent mb-2" />
              <CardTitle className="text-2xl font-headline">Çok Oyunculu Mod</CardTitle>
              <CardDescription>
                Arkadaşlarınızla veya diğer oyuncularla çevrimiçi çizin ve tahmin edin. (Çok Yakında!)
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full" disabled>
                <Link href="/multiplayer-game">Çok Oyunculu Oyna</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Artful Guesser. Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
