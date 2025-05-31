
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DrawingCanvas, type DrawingCanvasRef } from '@/components/game/DrawingCanvas';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, LogIn, PlusCircle, Send, Palette, Crown, CheckCircle, RefreshCw, Copy, XCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Game, Player, GameGuessEntry } from '@/types/game';
import { 
  createGameSession, 
  joinGameSession, 
  getGameSessionStream, 
  updateGameSession,
  addGuessToGame,
  updatePlayerStatus,
  removePlayerFromGame,
  startGame,
  nextTurn
} from '@/services/gameService';
import { Timestamp, type Unsubscribe } from 'firebase/firestore';

const generateUserId = () => `user_${Math.random().toString(36).substring(2, 10)}`;

export default function MultiplayerGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameData, setGameData] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [userGuess, setUserGuess] = useState<string>('');
  
  const drawingCanvasRef = useRef<DrawingCanvasRef>(null);
  const [joinGameIdInput, setJoinGameIdInput] = useState<string>('');

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    let storedUserId = localStorage.getItem('artfulGuesserUserId');
    if (!storedUserId) {
      storedUserId = generateUserId();
      localStorage.setItem('artfulGuesserUserId', storedUserId);
    }
    setUserId(storedUserId);

    const storedDisplayName = localStorage.getItem('artfulGuesserDisplayName');
    if (storedDisplayName) {
      setDisplayName(storedDisplayName);
    }

    const gameIdFromUrl = searchParams.get('gameId');
    if (gameIdFromUrl) {
      setGameId(gameIdFromUrl);
      setJoinGameIdInput(gameIdFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!gameId || !userId) {
      setGameData(null);
      setIsLoading(false);
      return;
    }
  
    let activeUnsubscribe: Unsubscribe | null = null;
    let isMounted = true;
  
    const streamCallback = (data: Game | null) => {
      if (!isMounted) return;
  
      setGameData(data);
      setIsLoading(false); 
  
      if (!data) {
        setErrorMsg("Oyun bulunamadı veya silinmiş.");
        setGameId(null); 
        router.replace('/multiplayer-game');
      } else if (data.players[userId] && !data.players[userId].isActive && data.status !== 'lobby') {
        setErrorMsg("Bu oyundan ayrıldınız veya çıkarıldınız.");
        setGameId(null); 
        router.replace('/multiplayer-game');
      }
    };
  
    const initializeStream = async () => {
      setIsLoading(true); 
      setErrorMsg(''); 
      try {
        // getGameSessionStream is now async
        activeUnsubscribe = await getGameSessionStream(gameId, streamCallback);
      } catch (error) {
        console.error("Error initializing game session stream:", error);
        if (isMounted) {
          setErrorMsg("Oyun güncellemelerine bağlanılamadı.");
          setIsLoading(false);
        }
      }
    };
  
    initializeStream();
  
    return () => {
      isMounted = false;
      if (activeUnsubscribe) {
        activeUnsubscribe();
      }
    };
  }, [gameId, userId, router]);
  
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (gameId && userId && gameData?.players[userId]?.isActive) {
        // Consider Firestore rules for cleanup or a more robust presence system
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [gameId, userId, gameData]);


  const handleCreateGame = async () => {
    if (!displayName.trim()) {
      setErrorMsg("Lütfen bir görünen ad girin.");
      return;
    }
    localStorage.setItem('artfulGuesserDisplayName', displayName);
    setIsLoading(true);
    try {
      const newPlayer: Player = { id: userId, displayName, score: 0, isActive: true };
      const newGameId = await createGameSession(newPlayer);
      setGameId(newGameId);
      router.push(`/multiplayer-game?gameId=${newGameId}`);
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg("Oyun oluşturulamadı. Lütfen tekrar deneyin.");
      toast({ title: "Hata", description: "Oyun oluşturulamadı.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleJoinGame = async () => {
    if (!displayName.trim()) {
      setErrorMsg("Lütfen bir görünen ad girin.");
      return;
    }
    if (!joinGameIdInput.trim()) {
      setErrorMsg("Lütfen bir Oyun ID'si girin.");
      return;
    }
    localStorage.setItem('artfulGuesserDisplayName', displayName);
    setIsLoading(true);
    try {
      const player: Player = { id: userId, displayName, score: 0, isActive: true };
      const result = await joinGameSession(joinGameIdInput, player);
      if (result.success) {
        setGameId(joinGameIdInput);
        router.push(`/multiplayer-game?gameId=${joinGameIdInput}`);
        setErrorMsg('');
        toast({ title: "Başarılı", description: result.message || "Oyuna katıldınız!" });
      } else {
        setErrorMsg(result.message || "Oyuna katılamadınız.");
        toast({ title: "Katılma Başarısız", description: result.message, variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Oyuna katılırken bir hata oluştu.");
      toast({ title: "Hata", description: "Oyuna katılırken bir hata oluştu.", variant: "destructive" });
    }
    setIsLoading(false);
  };
  
  const handleDrawingEnd = useCallback((dataUrl: string) => {
    if (gameId && gameData && gameData.currentDrawerId === userId && gameData.status === 'drawing') {
      updateGameSession(gameId, { currentDrawingDataUrl: dataUrl });
    }
  }, [gameId, gameData, userId]);

  const handleGuessSubmit = async () => {
    if (!userGuess.trim() || !gameId || !gameData) return;
    if (gameData.currentDrawerId === userId) {
      toast({title: "Uyarı", description: "Kendi çizimini tahmin edemezsin!", variant: "default"});
      return;
    }
    if (gameData.guesses.find(g => g.playerId === userId)) {
      toast({title: "Uyarı", description: "Bu tur için zaten bir tahminde bulundun.", variant: "default"});
      return;
    }

    try {
      await addGuessToGame(gameId, userId, displayName, userGuess);
      setUserGuess('');
      toast({ title: "Başarılı", description: "Tahminin gönderildi!" });
    } catch (error) {
      console.error("Error submitting guess:", error);
      toast({ title: "Hata", description: "Tahmin gönderilemedi.", variant: "destructive" });
    }
  };

  const handleStartGame = async () => {
    if (!gameId || !gameData || gameData.hostId !== userId) return;
    setIsLoading(true);
    try {
      await startGame(gameId);
    } catch (error: any) {
      console.error("Error starting game:", error);
      setErrorMsg(`Oyunu başlatırken hata: ${error.message}`);
      toast({ title: "Hata", description: `Oyunu başlatırken hata: ${error.message}`, variant: "destructive" });
    }
    setIsLoading(false);
  };
  
  const handleNextTurn = async () => {
    if (!gameId || !gameData || gameData.hostId !== userId) return;
    if (gameData.status === 'game-over') {
        toast({title: "Oyun Bitti", description: "Oyun zaten sona erdi.", variant: "default"});
        return;
    }
    setIsLoading(true);
    try {
      const correctWord = gameData.currentWord?.toLowerCase().trim();
      let roundResults = { word: gameData.currentWord || "", drawerId: gameData.currentDrawerId || "", correctGuessers: [] as string[] };
      
      const updatedPlayers = { ...gameData.players };
      gameData.guesses.forEach(guessEntry => {
        if (guessEntry.guess.toLowerCase().trim() === correctWord) {
          roundResults.correctGuessers.push(guessEntry.playerId);
          if (updatedPlayers[guessEntry.playerId]) {
            updatedPlayers[guessEntry.playerId].score += 10; 
          }
        }
      });
      if (roundResults.correctGuessers.length > 0 && gameData.currentDrawerId && updatedPlayers[gameData.currentDrawerId]) {
        updatedPlayers[gameData.currentDrawerId].score += 5; 
      }

      await updateGameSession(gameId, { players: updatedPlayers, roundResults });
      await nextTurn(gameId);
    } catch (error: any) {
      console.error("Error proceeding to next turn:", error);
      setErrorMsg(`Sonraki tura geçerken hata: ${error.message}`);
      toast({ title: "Hata", description: `Sonraki tura geçerken hata: ${error.message}`, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleClearCanvas = () => {
    if (drawingCanvasRef.current) {
      drawingCanvasRef.current.clearCanvas();
      if (gameId) {
         updateGameSession(gameId, { currentDrawingDataUrl: "" }); 
      }
    }
  };

  const handleCopyGameId = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId)
        .then(() => toast({ title: "Kopyalandı!", description: "Oyun ID'si panoya kopyalandı." }))
        .catch(() => toast({ title: "Hata", description: "Oyun ID'si kopyalanamadı.", variant: "destructive" }));
    }
  };
  
  const handleLeaveGame = async () => {
    if (gameId && userId) {
      setIsLoading(true);
      try {
        await updatePlayerStatus(gameId, userId, false); 
        toast({title: "Oyundan Ayrıldın", description: "Başarıyla oyundan ayrıldınız."});
      } catch (error) {
        console.error("Error leaving game:", error);
        toast({title: "Hata", description: "Oyundan ayrılırken bir sorun oluştu.", variant: "destructive"});
      } finally {
        setIsLoading(false);
        setGameId(null);
        setGameData(null);
        router.replace('/multiplayer-game');
      }
    }
  };

  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (gameData && (gameData.status === 'drawing' || gameData.status === 'guessing') && gameData.roundStartTime) {
      const startTime = (gameData.roundStartTime as Timestamp).toDate().getTime();
      const duration = gameData.drawTimeSeconds * 1000;

      const updateTimer = () => {
        const now = new Date().getTime();
        const elapsed = now - startTime;
        const remaining = Math.max(0, duration - elapsed);
        setTimeLeft(Math.ceil(remaining / 1000));

        if (remaining <= 0) {
          setTimeLeft(0);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          if (userId === gameData.hostId && gameData.status !== 'round-over' && gameId) {
             updateGameSession(gameId, { status: 'round-over' });
             toast({ title: "Süre Doldu!", description: "Bu turun süresi doldu. Host sonraki tura geçebilir." });
          }
        }
      };
      updateTimer(); 
      timerIntervalRef.current = setInterval(updateTimer, 1000);
    } else {
      setTimeLeft(null);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameData, userId, gameId, toast]);


  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4">Kullanıcı kimliği oluşturuluyor...</p>
      </div>
    );
  }
  
  if (!gameId || !gameData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center space-y-6">
          <h1 className="text-4xl font-headline font-bold text-primary">Çok Oyunculu Mod</h1>
          {errorMsg && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Hata!</AlertTitle><AlertDescription>{errorMsg}</AlertDescription></Alert>}
          
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Oyuna Katıl veya Oluştur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="Görünen Adınız (Örn: Oyuncu123)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={20}
              />
              <Button onClick={handleCreateGame} disabled={isLoading || !displayName.trim()} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} Yeni Oyun Oluştur
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Veya</span>
                </div>
              </div>
              <Input
                type="text"
                placeholder="Oyun ID'si ile Katıl"
                value={joinGameIdInput}
                onChange={(e) => setJoinGameIdInput(e.target.value)}
              />
              <Button onClick={handleJoinGame} disabled={isLoading || !displayName.trim() || !joinGameIdInput.trim()} className="w-full" variant="secondary">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />} Oyuna Katıl
              </Button>
            </CardContent>
          </Card>
           <Button asChild variant="outline" size="lg" className="mt-8">
            <Link href="/">Ana Sayfaya Dön</Link>
          </Button>
        </main>
      </div>
    );
  }

  const isHost = gameData.hostId === userId;
  const isMyTurnToDraw = gameData.currentDrawerId === userId;
  const activePlayers = Object.values(gameData.players).filter(p => p.isActive);
  const amIActive = gameData.players[userId]?.isActive;

  if (!amIActive && gameData.status !== 'lobby') {
     return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center space-y-6 text-center">
           <XCircle className="h-16 w-16 text-destructive" />
           <h1 className="text-3xl font-bold">Oyundan Ayrıldınız</h1>
           <p className="text-muted-foreground">Bu oyunda artık aktif değilsiniz.</p>
           <Button variant="default" size="lg" onClick={() => {
             setGameId(null);
             setGameData(null);
             router.replace('/multiplayer-game');
           }}>
            Lobiye Dön
          </Button>
        </main>
      </div>
     );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-headline font-bold text-primary truncate">Oyun Odası: <span className="text-accent">{gameId}</span>
            <Button variant="ghost" size="sm" onClick={handleCopyGameId} className="ml-2">
              <Copy className="h-4 w-4"/>
            </Button>
          </h1>
          <div className="flex gap-2 items-center">
            {timeLeft !== null && (gameData.status === 'drawing' || gameData.status === 'guessing') && (
                <Card className="p-2 bg-secondary">
                    <p className="text-lg font-bold text-secondary-foreground">Süre: {timeLeft}s</p>
                </Card>
            )}
            <Button onClick={handleLeaveGame} variant="outline" size="sm" disabled={isLoading}>
              Oyundan Ayrıl
            </Button>
          </div>
        </div>

        {errorMsg && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Hata!</AlertTitle><AlertDescription>{errorMsg}</AlertDescription></Alert>}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" /> Oyuncular ({activePlayers.length}/{gameData.settings.maxPlayers})</CardTitle>
              <CardDescription>Tur: {gameData.currentRound}/{gameData.maxRounds}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {activePlayers.sort((a,b) => b.score - a.score).map(player => (
                <div key={player.id} className={`p-2 rounded-md flex justify-between items-center ${player.id === userId ? 'bg-primary/10' : ''}`}>
                  <div className="flex items-center">
                    {player.id === gameData.hostId && <Crown className="mr-2 h-4 w-4 text-yellow-500" title="Host" />}
                    {player.id === gameData.currentDrawerId && <Palette className="mr-2 h-4 w-4 text-blue-500" title="Çizen Kişi" />}
                    <span className={`font-medium ${player.id === userId ? 'text-primary font-bold' : ''}`}>{player.displayName}</span>
                     {gameData.guesses.find(g => g.playerId === player.id) && player.id !== gameData.currentDrawerId && <CheckCircle className="ml-2 h-4 w-4 text-green-500" title="Tahmin yaptı"/>}
                  </div>
                  <span className="font-bold">{player.score} Puan</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-4">
            {gameData.status === 'lobby' && (
              <Card>
                <CardHeader>
                  <CardTitle>Oyun Lobisi</CardTitle>
                  <CardDescription>Host oyunu başlattığında başlayacak.</CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p>Oyuncuların katılması bekleniyor... Davet etmek için Oyun ID'sini paylaşın: <strong className="text-accent">{gameId}</strong></p>
                  {isHost && (
                    <Button onClick={handleStartGame} disabled={isLoading || activePlayers.length < 1 }>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Oyunu Başlat
                    </Button>
                  )}
                  {!isHost && <p className="text-muted-foreground">Hostun oyunu başlatması bekleniyor.</p>}
                </CardContent>
              </Card>
            )}

            {(gameData.status === 'drawing' || gameData.status === 'guessing' || gameData.status === 'round-over') && (
              <>
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="font-headline text-2xl">
                      {gameData.status === 'game-over' ? 'Oyun Bitti!' : `Tur ${gameData.currentRound}`}
                    </CardTitle>
                    {gameData.currentDrawerId && (
                      <CardDescription>
                        Şu an çizen: <span className="font-semibold text-primary">{gameData.players[gameData.currentDrawerId]?.displayName || 'Bilinmiyor'}</span>
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isMyTurnToDraw && gameData.status === 'drawing' && (
                      <div className="text-center my-2 p-3 bg-accent/20 rounded-md">
                        <p className="text-lg">Çizilecek Kelime: <strong className="text-accent-foreground">{gameData.currentWord || "Kelime bekleniyor..."}</strong></p>
                      </div>
                    )}
                    
                    {gameData.status === 'drawing' && isMyTurnToDraw && (
                       <DrawingCanvas ref={drawingCanvasRef} width={500} height={350} onDrawEnd={handleDrawingEnd} />
                    )}
                    
                    {gameData.status !== 'drawing' || !isMyTurnToDraw ? (
                      gameData.currentDrawingDataUrl ? (
                        <img src={gameData.currentDrawingDataUrl} alt="Çizim" className="w-full max-w-md mx-auto border rounded-md bg-white" data-ai-hint="player drawing"/>
                      ) : (
                        <div className="w-full max-w-md h-[350px] mx-auto border rounded-md bg-muted flex items-center justify-center">
                          <p className="text-muted-foreground">
                            {gameData.status === 'drawing' && gameData.currentDrawerId ? `${gameData.players[gameData.currentDrawerId]?.displayName} çiziyor...` : "Çizim alanı"}
                          </p>
                        </div>
                      )
                    ): null}


                    {gameData.status === 'round-over' && gameData.roundResults && (
                      <Card className="mt-4 bg-green-50 border-green-200">
                        <CardHeader>
                          <CardTitle className="text-green-700">Tur Bitti!</CardTitle>
                          <CardDescription>Çizilen kelime: <strong className="text-green-600">{gameData.roundResults.word}</strong></CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p>Doğru Tahmin Edenler:</p>
                           {gameData.roundResults.correctGuessers.length > 0 ? (
                            <ul className="list-disc pl-5">
                              {gameData.roundResults.correctGuessers.map(pid => (
                                <li key={pid} className="text-green-700">{gameData.players[pid]?.displayName}</li>
                              ))}
                            </ul>
                           ) : <p className="text-muted-foreground">Kimse doğru tahmin edemedi.</p>}
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
                
                {gameData.status === 'guessing' && !isMyTurnToDraw && (
                  <Card>
                    <CardHeader><CardTitle>Tahminin Ne?</CardTitle></CardHeader>
                    <CardContent className="flex gap-2">
                      <Input 
                        type="text" 
                        placeholder="Tahminini yaz..." 
                        value={userGuess}
                        onChange={(e) => setUserGuess(e.target.value)}
                        disabled={isLoading || gameData.guesses.some(g => g.playerId === userId)}
                        maxLength={50}
                      />
                      <Button onClick={handleGuessSubmit} disabled={isLoading || !userGuess.trim() || gameData.guesses.some(g => g.playerId === userId)}>
                        <Send className="mr-2 h-4 w-4" /> Gönder
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {isHost && (gameData.status === 'drawing' || gameData.status === 'guessing' || gameData.status === 'round-over') && gameData.status !== 'game-over' && (
                  <Button onClick={handleNextTurn} disabled={isLoading} className="w-full mt-4">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} 
                    {gameData.status === 'round-over' ? 'Sıradaki Tur/Çizer' : 'Turu Bitir / Sıradaki Çizer'}
                  </Button>
                )}
                {isMyTurnToDraw && gameData.status === 'drawing' && gameId && (
                   <Button onClick={() => updateGameSession(gameId, { status: 'guessing' })} variant="secondary" className="w-full mt-2">
                    Çizimi Bitirdim, Tahminleri Başlat
                   </Button>
                )}
              </>
            )}
             {gameData.status === 'game-over' && (
                <Card className="text-center">
                  <CardHeader>
                    <CardTitle className="text-3xl text-primary">Oyun Bitti!</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl mb-4">Skorlar:</p>
                    {activePlayers.sort((a,b) => b.score - a.score).map((player, index) => (
                       <div key={player.id} className={`p-2 rounded-md flex justify-between items-center text-lg ${index === 0 ? 'text-amber-500 font-bold' : ''}`}>
                         <span>{index + 1}. {player.displayName} {index === 0 ? <Crown className="inline mr-2 h-5 w-5" /> : ''}</span>
                         <span>{player.score} Puan</span>
                       </div>
                    ))}
                    {isHost && (
                       <Button onClick={handleCreateGame} className="mt-6">
                         <PlusCircle className="mr-2 h-4 w-4" /> Tekrar Lobiye Dön ve Yeni Oyun Oluştur
                       </Button>
                    )}
                     {!isHost && (
                       <Button onClick={() => {
                           setGameId(null);
                           setGameData(null);
                           router.replace('/multiplayer-game');
                       }} className="mt-6">
                         Lobiye Dön
                       </Button>
                    )}
                  </CardContent>
                </Card>
            )}

            {gameData.guesses && gameData.guesses.length > 0 && (gameData.status === 'guessing' || gameData.status === 'round-over' || gameData.status === 'drawing') && (
              <Card>
                <CardHeader><CardTitle>Yapılan Tahminler</CardTitle></CardHeader>
                <CardContent className="max-h-48 overflow-y-auto space-y-1">
                  {gameData.guesses.slice().sort((a,b) => ((a.timestamp as Timestamp)?.toDate().getTime() || 0) - ((b.timestamp as Timestamp)?.toDate().getTime() || 0)).map((g, index) => (
                    <p key={index} className="text-sm">
                      <span className="font-semibold">{g.displayName}:</span> {
                        (gameData.status === 'round-over' || userId === gameData.hostId || userId === g.playerId || (gameData.roundResults?.correctGuessers?.includes(g.playerId) && gameData.roundResults?.word.toLowerCase().trim() === g.guess.toLowerCase().trim())) 
                        ? g.guess 
                        : "******" 
                      }
                      {gameData.status === 'round-over' && gameData.roundResults?.word.toLowerCase().trim() === g.guess.toLowerCase().trim() && <CheckCircle className="inline ml-1 h-4 w-4 text-green-500" />}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
