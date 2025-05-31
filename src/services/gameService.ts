
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

  if (Object.values(gameData.players).filter(p => p.isActive).length >= gameData.settings.maxPlayers && !gameData.players[player.id]?.isActive) {
    return { success: false, message: "Oyun dolu." };
  }
  
  if (gameData.status !== 'lobby' && !gameData.players[player.id]) { // Allow rejoining active players if they were disconnected
    return { success: false, message: "Oyun zaten başlamış." };
  }

  if (gameData.players[player.id]) {
    // Player is rejoining
    await updateDoc(gameRef, {
      [`players.${player.id}.isActive`]: true,
      // playerOrder should already contain this player
    });
    return { success: true, message: "Oyuna tekrar katıldınız."};
  }

  // New player joining
  const newPlayerOrder = [...gameData.playerOrder, player.id];
  await updateDoc(gameRef, {
    [`players.${player.id}`]: { ...player, score: 0, isActive: true },
    playerOrder: newPlayerOrder,
  });
  return { success: true };
}

export async function getGameSessionStream(gameId: string, onUpdate: (game: Game | null) => void): Promise<Unsubscribe> {
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
  const gameSnap = await getDoc(gameRef);
  if (!gameSnap.exists()) return;
  const gameData = gameSnap.data() as Game;

  const updates: any = {
    [`players.${playerId}.isActive`]: isActive,
  };

  // If host becomes inactive, try to assign a new host
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
      // No other active players to become host, game might need to end or wait
      updates.status = 'lobby'; // Or 'game-over' if no one can host
    }
  }
  
  await updateDoc(gameRef, updates);
}

export async function removePlayerFromGame(gameId: string, playerId: string): Promise<void> {
  // This function might be deprecated in favor of updatePlayerStatus(isActive: false)
  // For now, it mimics setting isActive to false.
  await updatePlayerStatus(gameId, playerId, false);
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

  const activePlayersInOrder = gameData.playerOrder.filter(pid => gameData.players[pid]?.isActive);
  if (activePlayersInOrder.length === 0) throw new Error("Aktif oyuncu yok!");

  const firstDrawerId = activePlayersInOrder[0];
  const firstDrawerGlobalIndex = gameData.playerOrder.indexOf(firstDrawerId);

  await generateAndSetWord(gameId, 'medium'); 

  await updateGameSession(gameId, {
    status: 'drawing',
    currentDrawerId: firstDrawerId,
    currentRound: 1,
    currentPlayerIndexInOrder: firstDrawerGlobalIndex, // Store index in original playerOrder
    guesses: [], 
    roundStartTime: serverTimestamp() as Timestamp,
  });
}

export async function nextTurn(gameId: string): Promise<void> {
  const gameDoc = await getDoc(doc(db, 'games', gameId));
  if (!gameDoc.exists()) throw new Error("Oyun bulunamadı");
  let gameData = gameDoc.data() as Game; // Use let to allow re-assignment if needed after an update

  const activePlayerIdsInOriginalOrder = gameData.playerOrder.filter(pid => gameData.players[pid]?.isActive);

  if (activePlayerIdsInOriginalOrder.length === 0) {
    await updateGameSession(gameId, { status: 'game-over', currentWord: "Aktif oyuncu kalmadı." });
    return;
  }

  let newCurrentPlayerGlobalIndex = gameData.currentPlayerIndexInOrder; // Index in original gameData.playerOrder
  let nextDrawerId: string | undefined = undefined;

  // Find the next active player in the original playerOrder, starting after the current one
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
    // This case should be caught by activePlayerIdsInOriginalOrder.length === 0, but as a fallback:
    await updateGameSession(gameId, { status: 'game-over', currentWord: "Çizecek aktif oyuncu bulunamadı." });
    return;
  }

  let newCurrentRound = gameData.currentRound;
  // A round increments if the new designated drawer's index in the original order
  // is less than or equal to the previous drawer's index, indicating a wrap-around.
  // This also covers the case where the current drawer is the last in playerOrder.
  // Also, if there's only one active player, each of their turns is a new round.
  if (activePlayerIdsInOriginalOrder.length === 1 && gameData.currentRound > 0) {
    // If only one active player, they start a new round each turn (after the first round has started).
    newCurrentRound++;
  } else if (newCurrentPlayerGlobalIndex <= gameData.currentPlayerIndexInOrder && gameData.currentRound > 0 && activePlayerIdsInOriginalOrder.length > 1) {
    // If multiple active players and we've wrapped around the playerOrder list.
    newCurrentRound++;
  }
  
  if (newCurrentRound > gameData.maxRounds) {
    await updateGameSession(gameId, { status: 'game-over', currentWord: "Oyun Bitti!", currentDrawingDataUrl: "", currentDrawerId: "" });
  } else {
    await generateAndSetWord(gameId, 'medium'); // Consider using a difficulty from gameData.settings if available
    await updateGameSession(gameId, {
      status: 'drawing',
      currentDrawerId: nextDrawerId,
      currentRound: newCurrentRound,
      currentPlayerIndexInOrder: newCurrentPlayerGlobalIndex,
      guesses: [],
      currentDrawingDataUrl: "", 
      roundStartTime: serverTimestamp() as Timestamp,
      roundResults: deleteField() // Clear previous round results
    });
  }
}

    