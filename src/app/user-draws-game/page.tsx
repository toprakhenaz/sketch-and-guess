
"use client";

import { useState, useRef }
from 'react';
import { guessUserDrawing, type GuessUserDrawingInput, type GuessUserDrawingOutput } from '@/ai/flows/guess-user-drawing-flow';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb, UploadCloud, AlertTriangle } from 'lucide-react';
import { DrawingCanvas, type DrawingCanvasRef } from '@/components/game/DrawingCanvas';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function UserDrawsGamePage() {
  const [aiGuess, setAiGuess] = useState<GuessUserDrawingOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const drawingCanvasRef = useRef<DrawingCanvasRef>(null);
  const { toast } = useToast();

  const handleSubmitDrawing = async () => {
    if (!drawingCanvasRef.current) {
      toast({
        title: "Hata",
        description: "Çizim alanı bulunamadı.",
        variant: "destructive",
      });
      return;
    }

    const drawingDataUri = drawingCanvasRef.current.getDrawingAsDataURL('image/png');

    if (!drawingDataUri) {
      toast({
        title: "Hata",
        description: "Çizim alınamadı. Lütfen bir şeyler çizin.",
        variant: "destructive",
      });
      return;
    }
    
    // Basic check if canvas is empty (all white)
    // This is a simplified check. A more robust check would analyze pixel data.
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let isEffectivelyEmpty = true;
        for (let i = 0; i < data.length; i += 4) {
            // Check if pixel is not white (considering alpha for PNG)
            if (data[i] < 250 || data[i+1] < 250 || data[i+2] < 250 ) { // Check if not white-ish
                 // Check for non-transparent pixels if it's PNG
                if (data[i+3] > 10) { // alpha threshold
                    isEffectivelyEmpty = false;
                    break;
                }
            }
        }

        if (isEffectivelyEmpty) {
            toast({
              title: "Uyarı",
              description: "Lütfen bir şeyler çizin!",
              variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        setAiGuess(null);

        try {
          const result = await guessUserDrawing({ drawingDataUri });
          setAiGuess(result);
        } catch (error) {
          console.error("Failed to get AI guess:", error);
          toast({
            title: "Tahmin Hatası",
            description: "Yapay zeka tahmin yaparken bir sorun oluştu. Lütfen tekrar deneyin.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
    };
    img.onerror = () => {
        toast({
            title: "Hata",
            description: "Çizim verisi işlenemedi.",
            variant: "destructive",
        });
    };
    img.src = drawingDataUri;


  };

  const handleClearAndNew = () => {
    if (drawingCanvasRef.current) {
      drawingCanvasRef.current.clearCanvas();
    }
    setAiGuess(null);
    setIsLoading(false);
  };


  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center space-y-6">
        <h1 className="text-4xl font-headline font-bold text-primary">Sen Çiz, Yapay Zeka Tahmin Etsin!</h1>
        <p className="text-lg text-foreground/80 max-w-xl text-center">
          Aklından bir nesne tut ve çiz. Bakalım yapay zeka ne çizdiğini anlayabilecek mi?
        </p>

        <Card className="w-full max-w-xl shadow-xl">
          <CardHeader className="items-center">
            <CardTitle className="text-2xl font-headline">Çizim Alanı</CardTitle>
            <CardDescription>Yaratıcılığını konuştur!</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <DrawingCanvas ref={drawingCanvasRef} width={450} height={350} />
            <div className="flex space-x-4">
              <Button onClick={handleSubmitDrawing} disabled={isLoading} size="lg">
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Lightbulb className="mr-2 h-5 w-5" />
                )}
                Tahmin Et!
              </Button>
              <Button onClick={handleClearAndNew} variant="outline" disabled={isLoading} size="lg">
                Yeni Çizim
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-3 text-lg text-foreground">Yapay zeka düşünüyor...</p>
          </div>
        )}

        {aiGuess && !isLoading && (
          <Card className="w-full max-w-xl shadow-lg">
            <CardHeader className="items-center">
              <Lightbulb className="h-8 w-8 text-accent mb-2" />
              <CardTitle className="text-2xl font-headline">Yapay Zekanın Tahmini</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-6 text-center">
              <p className="text-xl font-semibold text-primary">{aiGuess.guessedObjectName || "Bir tahminde bulunamadı."}</p>
              <p className="text-md text-foreground/90">{aiGuess.confidence && `Eminlik: %${(aiGuess.confidence * 100).toFixed(0)}`}</p>
              <p className="text-sm text-muted-foreground">{aiGuess.feedback}</p>
              {aiGuess.alternativeGuesses && aiGuess.alternativeGuesses.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-medium text-foreground">Diğer tahminler:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {aiGuess.alternativeGuesses.slice(0, 3).map((altGuess, index) => (
                      <li key={index}>{altGuess}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
         {!isLoading && !aiGuess && (
            <Alert variant="default" className="w-full max-w-xl">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Nasıl Oynanır?</AlertTitle>
              <AlertDescription>
                1. Yukarıdaki alana bir şeyler çizin. <br />
                2. &quot;Tahmin Et!&quot; butonuna tıklayın. <br />
                3. Yapay zekanın tahminini görün! <br />
                4. &quot;Yeni Çizim&quot; ile tekrar deneyin.
              </AlertDescription>
            </Alert>
        )}


      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground">
        Yaratıcılığının sınırlarını zorla!
      </footer>
    </div>
  );
}
