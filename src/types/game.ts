
import type { Timestamp } from 'firebase/firestore';

export interface Player {
  id: string;
  displayName: string;
  score: number;
  isHost?: boolean;
  isActive: boolean; // Oyuncunun aktif olup olmadığını belirtir
}

export interface GameGuessEntry {
  playerId: string;
  displayName: string;
  guess: string;
  isCorrect?: boolean;
  timestamp: Timestamp;
}

export interface Game {
  id: string; // Firestore document ID
  status: 'lobby' | 'starting' | 'drawing' | 'guessing' | 'round-over' | 'game-over';
  players: { [playerId: string]: Player }; // Map of playerId to Player object
  hostId: string;
  currentDrawerId?: string;
  currentWord?: string; // Çizilecek kelime (Türkçe)
  currentDrawingDataUrl?: string; // Çizimin data URL'i
  guesses: GameGuessEntry[]; // Mevcut turdaki tahminler
  currentRound: number;
  maxRounds: number;
  roundStartTime?: Timestamp;
  drawTimeSeconds: number;
  createdAt: Timestamp;
  // Oyun ayarları
  settings: {
    maxPlayers: number;
    gameMode: 'classic'; // Gelecekte farklı modlar eklenebilir
    language: 'tr'; // Oyun dili
  };
  // Tur sonuçları (örneğin, kim doğru tahmin etti)
  roundResults?: {
    word: string;
    drawerId: string;
    correctGuessers: string[]; // playerId listesi
  };
  // Sonraki çizerin kim olacağını belirlemek için sıra
  playerOrder: string[]; // Oyuncu ID'lerinin sıralı listesi
  currentPlayerIndexInOrder: number; // playerOrder'daki mevcut çizerin indeksi
}
