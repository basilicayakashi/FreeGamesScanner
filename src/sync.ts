import {
  getFreeGameStmt,
  insertFreeGameStmt,
  updateFreeGameStmt,
  deleteExpiredFreeGamesStmt
} from "./db.js";

import type { FreeGamePromo } from "./types.js";

export function syncProviderGames(fetchedGames: FreeGamePromo[]): void {
  for (const game of fetchedGames) {
    const existing = getFreeGameStmt.get(
      game.providerCode,
      game.promoUrl,
      game.promoType
    );

    if (!existing) {
      insertFreeGameStmt.run(
        game.image_url,
        game.providerCode,
        game.title,
        game.promoUrl,
        game.expiresAt,
        game.promoType
      );

      console.log(`[NEW] ${game.title}`);
    } else {
      updateFreeGameStmt.run(
        game.image_url,
        game.title,
        game.expiresAt,
        game.providerCode,
        game.promoUrl,
        game.promoType
      );
    }
  }
}

export function deleteExpiredFreeGames(): void {
  const now = new Date().toISOString();

  const result = deleteExpiredFreeGamesStmt.run(now);

  console.log(`[DB] expired promos deleted: ${result.changes}`);
}