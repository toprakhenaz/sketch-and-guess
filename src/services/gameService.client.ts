import { db } from '@/lib/firebase';
import type { Game } from '@/types/game';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';

export async function getGameSessionStream(gameId: string, onUpdate: (game: Game | null) => void): Promise<Unsubscribe> {
  const gameRef = doc(db, 'games', gameId);
  return onSnapshot(gameRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as Game);
    } else {
      onUpdate(null);
    }
  }, (error) => {
    console.error("Error in getGameSessionStream listener:", error);
    onUpdate(null);
  });
} 