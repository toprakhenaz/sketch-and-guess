
'use server';
import { db } from '@/lib/firebase';
import type { Game, Player, GameGuessEntry } from '@/types/game';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  serverTimestamp, 
  arrayUnion,
  onSnapshot,
  type Unsubscribe,
  deleteField
} from 'firebase/firestore';
import { generateDrawingPrompt } from '@/ai/flows/generate-drawing-prompt'; // Kelime üretmek için

const gamesCollection = collection(db, 'games');

export async function createGameSession(hostPlayer: Player, maxRounds: number = 3, drawTimeSeconds: number = 60, maxPlayers: number = 8): Promise<string> {
  const gameId = doc(gamesCollection).id;
  const initialPlayerOrder = [hostPlayer.id];

  const newGame: Game = {
    id: gameId,
    status: 'lobby',
    players: {
      [hostPlayer.id]: { ...hostPlayer, isHost: true, score: 0, isActive: true }
    },
    hostId: hostPlayer.id,
    currentRound: 0,
    maxRounds,
    guesses: [],
    createdAt: serverTimestamp() as Timestamp, // Firestore'a yazarken atanacak
    settings: {
      maxPlayers,
      gameMode: 'classic',
      language: 'tr',
    },
    drawTimeSeconds,
    playerOrder: initialPlayerOrder,
    currentPlayerIndexInOrder: 0,
  };
  await setDoc(doc(db, 'games', gameId), newGame);
  return gameId;
}

export async function joinGameSession(gameId: string, player: Player): Promise<{success: boolean, message?: string}> {
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);

  if (!gameSnap.exists()) {
    return { success: false, message: "Oyun bulunamadı." };
  }

  const gameData = gameSnap.data() as Game;

  if (Object.keys(gameData.players).length >= gameData.settings.maxPlayers) {
    return { success: false, message: "Oyun dolu." };
  }
  
  if (gameData.status !== 'lobby') {
    return { success: false, message: "Oyun zaten başlamış." };
  }

  if (gameData.players[player.id]) {
     // Oyuncu zaten oyunda, isActive durumunu güncelle
    await updateDoc(gameRef, {
      [`players.${player.id}.isActive`]: true,
    });
    return { success: true, message: "Oyuna tekrar katıldınız."};
  }


  const newPlayerOrder = [...gameData.playerOrder, player.id];
  await updateDoc(gameRef, {
    [`players.${player.id}`]: { ...player, score: 0, isActive: true },
    playerOrder: newPlayerOrder,
  });
  return { success: true };
}

export function getGameSessionStream(gameId: string, onUpdate: (game: Game | null) => void): Unsubscribe {
  const gameRef = doc(db, 'games', gameId);
  return onSnapshot(gameRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as Game);
    } else {
      onUpdate(null);
    }
  });
}

export async function updateGameSession(gameId: string, updates: Partial<Game>): Promise<void> {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, updates);
}

export async function addGuessToGame(gameId: string, playerId: string, displayName: string, guess: string): Promise<void> {
  const gameRef = doc(db, 'games', gameId);
  const newGuess: GameGuessEntry = {
    playerId,
    displayName,
    guess,
    timestamp: serverTimestamp() as Timestamp,
  };
  await updateDoc(gameRef, {
    guesses: arrayUnion(newGuess)
  });
}

export async function updatePlayerStatus(gameId: string, playerId: string, isActive: boolean): Promise<void> {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, {
    [`players.${playerId}.isActive`]: isActive,
  });
}

export async function removePlayerFromGame(gameId: string, playerId: string): Promise<void> {
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);
  if (gameSnap.exists()) {
    const gameData = gameSnap.data() as Game;
    const newPlayerOrder = gameData.playerOrder.filter(id => id !== playerId);
    
    // Eğer ayrılan oyuncu host ise ve başka oyuncu varsa yeni host ata
    let newHostId = gameData.hostId;
    if (gameData.hostId === playerId && newPlayerOrder.length > 0) {
      newHostId = newPlayerOrder[0]; // Sıradaki ilk oyuncu yeni host olur
    }

    const updates: any = {
      [`players.${playerId}`]: deleteField(), // Oyuncuyu sil
      playerOrder: newPlayerOrder,
    };

    if (newHostId !== gameData.hostId) {
      updates.hostId = newHostId;
      if (gameData.players[newHostId]) {
        updates[`players.${newHostId}.isHost`] = true;
      }
    }
    
    // Eğer host değiştiyse ve eski host artık oyuncu değilse, isHost flag'ini kaldır
    if (gameData.hostId === playerId && gameData.players[newHostId] && newHostId !== playerId) {
         updates[`players.${gameData.hostId}.isHost`] = false; // Bu satır gereksiz çünkü oyuncu siliniyor
    }


    await updateDoc(gameRef, updates);
  }
}


export async function generateAndSetWord(gameId: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<string | null> {
  try {
    const result = await generateDrawingPrompt({ difficulty });
    if (result.prompt) {
      await updateGameSession(gameId, { currentWord: result.prompt });
      return result.prompt;
    }
    return null;
  } catch (error) {
    console.error("Error generating word:", error);
    // Fallback to a simple word list if AI fails
    const fallbackWords = ["kedi", "ev", "güneş", "ağaç", "araba", "kitap", "masa", "sandalye", "top", "balık"];
    const randomWord = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
    await updateGameSession(gameId, { currentWord: randomWord });
    return randomWord;
  }
}

export async function startGame(gameId: string): Promise<void> {
  const gameDoc = await getDoc(doc(db, 'games', gameId));
  if (!gameDoc.exists()) throw new Error("Oyun bulunamadı");
  const gameData = gameDoc.data() as Game;

  if (gameData.playerOrder.length === 0) throw new Error("Oyuncu yok!");

  const firstDrawerId = gameData.playerOrder[0];
  await generateAndSetWord(gameId, 'medium'); // Kelimeyi oluştur ve ata

  await updateGameSession(gameId, {
    status: 'drawing',
    currentDrawerId: firstDrawerId,
    currentRound: 1,
    currentPlayerIndexInOrder: 0,
    guesses: [], // Tahminleri sıfırla
    roundStartTime: serverTimestamp() as Timestamp,
  });
}

export async function nextTurn(gameId: string): Promise<void> {
  const gameDoc = await getDoc(doc(db, 'games', gameId));
  if (!gameDoc.exists()) throw new Error("Oyun bulunamadı");
  const gameData = gameDoc.data() as Game;

  let nextPlayerIndex = (gameData.currentPlayerIndexInOrder + 1);
  let nextRound = gameData.currentRound;

  // Eğer tüm oyuncular bu turda çizdiyse, yeni bir raunda geç
  if (nextPlayerIndex >= gameData.playerOrder.length) {
    nextPlayerIndex = 0;
    nextRound += 1;
  }
  
  // Oyuncuları filtrele (aktif olmayanları çıkar)
  const activePlayers = gameData.playerOrder.filter(pid => gameData.players[pid]?.isActive);
  if (activePlayers.length === 0) {
    await updateGameSession(gameId, { status: 'game-over', currentWord: "Aktif oyuncu kalmadı." });
    return;
  }
  
  // Eğer index aktif oyuncu listesinin dışındaysa sıfırla
  if (nextPlayerIndex >= activePlayers.length) {
      nextPlayerIndex = 0;
      // Eğer tur da ilerlemiyorsa ve index sıfırlanıyorsa bu bir sorun olabilir, ama şimdilik böyle bırakalım.
  }


  if (nextRound > gameData.maxRounds) {
    // Oyun bitti
    await updateGameSession(gameId, { status: 'game-over', currentWord: "Oyun Bitti!", currentDrawingDataUrl: "", currentDrawerId: "" });
  } else {
    const nextDrawerId = activePlayers[nextPlayerIndex];
    await generateAndSetWord(gameId, 'medium');
    await updateGameSession(gameId, {
      status: 'drawing',
      currentDrawerId: nextDrawerId,
      currentRound: nextRound,
      currentPlayerIndexInOrder: gameData.playerOrder.indexOf(nextDrawerId), // Orijinal playerOrder'daki indexini kullan
      guesses: [],
      currentDrawingDataUrl: "", // Önceki çizimi temizle
      roundStartTime: serverTimestamp() as Timestamp,
    });
  }
}
