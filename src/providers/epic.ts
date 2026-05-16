import type { FreeGamePromo } from "../types.js";

type EpicCatalogResponse = {
  data?: {
    Catalog?: {
      searchStore?: {
        elements?: EpicGame[];
      };
    };
  };
};

type EpicGame = {
  title: string;
  productSlug?: string;
  urlSlug?: string;

  promotions?: {
    promotionalOffers?: Array<{
      promotionalOffers?: Array<{
        startDate: string;
        endDate: string;
      }>;
    }>;
  };

  price?: {
    totalPrice?: {
      discountPrice?: number;
    };
  };
};

const EPIC_API_URL =
  "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=fr&country=FR&allowCountries=FR";

export async function fetchEpicPromos(): Promise<FreeGamePromo[]> {
  const response = await fetch(EPIC_API_URL, {
    headers: {
      "User-Agent": "FreeGamesScanner/1.0",
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Epic HTTP ${response.status}`);
  }

  const json =
    (await response.json()) as EpicCatalogResponse;

  const games = json.data?.Catalog?.searchStore?.elements ?? [];

  const promos: FreeGamePromo[] = [];

  for (const game of games) {
    const offer =
      game.promotions?.promotionalOffers?.[0]
        ?.promotionalOffers?.[0];

    if (!offer) {
      continue;
    }

    // seulement les jeux vraiment gratuits
    if (
      game.price?.totalPrice?.discountPrice !== 0
    ) {
      continue;
    }

    const slug =
      game.productSlug ??
      game.urlSlug;

    if (!slug) {
      continue;
    }

    promos.push({
      providerCode: "EPICGAMES",
      title: game.title,
      promoUrl: `https://store.epicgames.com/fr/p/${slug}`,
      expiresAt: offer.endDate,
      promoType: "FREE_TO_KEEP"
    });
  }

  console.log(
    `[EPIC] promos found: ${promos.length}`
  );

  return promos;
}