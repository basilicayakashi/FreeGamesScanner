import "dotenv/config";

import { fetchSteamPromos } from "./providers/steam.js";
import { fetchEpicPromos } from "./providers/epic.js";
//import { fetchItchioPromos } from "./providers/itchio.js";

import { syncProviderGames, deleteExpiredFreeGames } from "./sync.js";

const INTERVAL_MINUTES = 60;

async function scan(): Promise<void> {
  console.log("Scanning providers...");

  const steamGames = await fetchSteamPromos();
  console.log(steamGames);
  syncProviderGames(steamGames);

  const epicGames = await fetchEpicPromos();
  console.log(epicGames);
  syncProviderGames(epicGames);

  /*
  const itchioGames = await fetchItchioPromos();
  console.log(itchioGames);
  syncProviderGames(itchioGames);
  */

  deleteExpiredFreeGames();

  console.log("Done.");
}

async function main(): Promise<void> {
  while (true) {
    try {
      await scan();
    } catch (error) {
      console.error(error);
    }

    await new Promise((resolve) =>
      setTimeout(
        resolve,
        INTERVAL_MINUTES *
          60 *
          1000
      )
    );
  }
}

main();