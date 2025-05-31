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
  deleteField,
  type Timestamp
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
    createdAt: serverTimestamp() as Timestamp,
    settings: {
      maxPlayers,
      gameMode: 'classic',
      language: 'tr',
    },
    drawTimeSeconds,
    playerOrder: initialPlayerOrder,
    currentPlayerIndexInOrder: 0,
  };

  try {
    await setDoc(doc(db, 'games', gameId), newGame);
    return gameId;
  } catch (error) {
    console.error("Error in createGameSession service (writing to Firestore):", error);
    // Re-throw the error so it can be caught by the calling client-side function
    throw error; 
  }
}

export async function joinGameSession(gameId: string, player: Player): Promise<{success: boolean, message?: string}> {
  const gameRef = doc(db, 'games', gameId);
  try {
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      return { success: false, message: "Oyun bulunamadı." };
    }

    const gameData = gameSnap.data() as Game;

    if (Object.values(gameData.players).filter(p => p.isActive).length >= gameData.settings.maxPlayers && !gameData.players[player.id]?.isActive) {
      return { success: false, message: "Oyun dolu." };
    }
    
    if (gameData.status !== 'lobby' && !gameData.players[player.id]) { 
      return { success: false, message: "Oyun zaten başlamış." };
    }

    if (gameData.players[player.id]) {
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
  } catch (error) {
    console.error("Error in joinGameSession service:", error);
    // Provide a generic error message, but the console log will have details
    return { success: false, message: "Oyuna katılırken bir sunucu hatası oluştu." };
  }
}

export async function updateGameSession(gameId: string, updates: Partial<Game>): Promise<void> {
  const gameRef = doc(db, 'games', gameId);
  try {
    await updateDoc(gameRef, updates);
  } catch (error) {
    console.error("Error in updateGameSession service:", error);
    throw error;
  }
}

export async function addGuessToGame(gameId: string, playerId: string, displayName: string, guess: string): Promise<void> {
  const gameRef = doc(db, 'games', gameId);
  const newGuess: GameGuessEntry = {
    playerId,
    displayName,
    guess,
    timestamp: new Date() as any,
  };
  try {
    await updateDoc(gameRef, {
      guesses: arrayUnion(newGuess)
    });
  } catch (error) {
    console.error("Error in addGuessToGame service:", error);
    throw error;
  }
}

export async function updatePlayerStatus(gameId: string, playerId: string, isActive: boolean): Promise<void> {
  const gameRef = doc(db, 'games', gameId);
  try {
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) {
      console.warn(`updatePlayerStatus: Game ${gameId} not found.`);
      return;
    }
    const gameData = gameSnap.data() as Game;

    const updates: any = {
      [`players.${playerId}.isActive`]: isActive,
    };

    if (playerId === gameData.hostId && !isActive) {
      const activePlayers = gameData.playerOrder.filter(id => id !== playerId && gameData.players[id]?.isActive);
      if (activePlayers.length > 0) {
        const newHostId = activePlayers[0];
        updates.hostId = newHostId;
        updates[`players.${newHostId}.isHost`] = true;
        if(gameData.players[playerId]) {
          updates[`players.${playerId}.isHost`] = false; 
        }
      } else {
        updates.status = 'lobby'; 
      }
    }
    
    await updateDoc(gameRef, updates);
  } catch (error) {
    console.error("Error in updatePlayerStatus service:", error);
    throw error;
  }
}

export async function removePlayerFromGame(gameId: string, playerId: string): Promise<void> {
  await updatePlayerStatus(gameId, playerId, false);
}

export async function generateAndSetWord(gameId: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<string | null> {
  // Multiplayer için sadece kısa kelimelerden rastgele seç
  const fallbackWords = [
    "kedi", "ev", "güneş", "ağaç", "araba", "kitap", "masa", "sandalye", "top", "balık",
    "elma", "uçak", "telefon", "çanta", "kuş", "köpek", "çiçek", "yıldız", "kalp", "dağ"
  ];
  const randomWord = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
  try {
    await updateGameSession(gameId, { currentWord: randomWord });
    return randomWord;
  } catch (updateError) {
    console.error("Error setting fallback word:", updateError);
    throw updateError;
  }
}

export async function startGame(gameId: string): Promise<void> {
  try {
    const gameDoc = await getDoc(doc(db, 'games', gameId));
    if (!gameDoc.exists()) throw new Error("Oyun bulunamadı");
    const gameData = gameDoc.data() as Game;

    const activePlayersInOrder = gameData.playerOrder.filter(pid => gameData.players[pid]?.isActive);
    if (activePlayersInOrder.length === 0) throw new Error("Aktif oyuncu yok!");

    const firstDrawerId = activePlayersInOrder[0];
    const firstDrawerGlobalIndex = gameData.playerOrder.indexOf(firstDrawerId);

    await generateAndSetWord(gameId, 'medium'); 

    await updateGameSession(gameId, {
      status: 'drawing',
      currentDrawerId: firstDrawerId,
      currentRound: 1,
      currentPlayerIndexInOrder: firstDrawerGlobalIndex,
      guesses: [], 
      roundStartTime: serverTimestamp() as Timestamp,
    });
  } catch (error) {
    console.error("Error in startGame service:", error);
    throw error;
  }
}

export async function nextTurn(gameId: string): Promise<void> {
  try {
    const gameDoc = await getDoc(doc(db, 'games', gameId));
    if (!gameDoc.exists()) throw new Error("Oyun bulunamadı");
    let gameData = gameDoc.data() as Game;

    const activePlayerIdsInOriginalOrder = gameData.playerOrder.filter(pid => gameData.players[pid]?.isActive);

    if (activePlayerIdsInOriginalOrder.length === 0) {
      await updateGameSession(gameId, { status: 'game-over', currentWord: "Aktif oyuncu kalmadı." });
      return;
    }

    let newCurrentPlayerGlobalIndex = gameData.currentPlayerIndexInOrder; 
    let nextDrawerId: string | undefined = undefined;

    for (let i = 1; i <= gameData.playerOrder.length; i++) {
      const potentialGlobalIndex = (gameData.currentPlayerIndexInOrder + i) % gameData.playerOrder.length;
      const potentialPlayerId = gameData.playerOrder[potentialGlobalIndex];
      if (gameData.players[potentialPlayerId]?.isActive) {
        nextDrawerId = potentialPlayerId;
        newCurrentPlayerGlobalIndex = potentialGlobalIndex;
        break;
      }
    }

    if (!nextDrawerId) {
      await updateGameSession(gameId, { status: 'game-over', currentWord: "Çizecek aktif oyuncu bulunamadı." });
      return;
    }

    let newCurrentRound = gameData.currentRound;
    if (activePlayerIdsInOriginalOrder.length === 1 && gameData.currentRound > 0) {
      newCurrentRound++;
    } else if (newCurrentPlayerGlobalIndex <= gameData.currentPlayerIndexInOrder && gameData.currentRound > 0 && activePlayerIdsInOriginalOrder.length > 1) {
      newCurrentRound++;
    }
    
    if (newCurrentRound > gameData.maxRounds) {
      await updateGameSession(gameId, { status: 'game-over', currentWord: "Oyun Bitti!", currentDrawingDataUrl: "", currentDrawerId: "" });
    } else {
      await generateAndSetWord(gameId, 'medium'); 
      await updateGameSession(gameId, {
        status: 'drawing',
        currentDrawerId: nextDrawerId,
        currentRound: newCurrentRound,
        currentPlayerIndexInOrder: newCurrentPlayerGlobalIndex,
        guesses: [],
        currentDrawingDataUrl: "", 
        roundStartTime: serverTimestamp() as Timestamp,
        roundResults: deleteField() 
      });
    }
  } catch (error) {
    console.error("Error in nextTurn service:", error);
    throw error;
  }
}
