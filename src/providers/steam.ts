import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { FreeGamePromo } from "../types.js";
import { DateTime } from "luxon";

import {
  FREE_GAME_PROVIDERS,
  FREE_GAME_PROMO_TYPES,
} from "free-games-shared";

const STEAM_SEARCH_URL =
  "https://store.steampowered.com/search/results/?query&start=0&count=100&dynamic_data=&sort_by=Released_DESC&maxprice=free&specials=1&infinite=1";

function extractSteamAppId(url: string): string | undefined {
  return url.match(/\/app\/(\d+)/)?.[1];
}

function parseFrenchSteamDateToUtc(value: string): string | undefined {
  const match = value.match(
    /(\d{1,2})\s+([a-zéû]+)\s+à\s+(\d{1,2})h(\d{2})/i
  );

  if (!match) return undefined;

  const [, dayRaw, monthRaw, hourRaw, minuteRaw] = match;

  const months: Record<string, number> = {
    janvier: 1,
    février: 2,
    fevrier: 2,
    mars: 3,
    avril: 4,
    mai: 5,
    juin: 6,
    juillet: 7,
    août: 8,
    aout: 8,
    septembre: 9,
    octobre: 10,
    novembre: 11,
    décembre: 12,
    decembre: 12
  };

  const month = months[monthRaw.toLowerCase()];
  if (!month) return undefined;

  let date = DateTime.fromObject(
    {
      year: DateTime.now().year,
      month,
      day: Number(dayRaw),
      hour: Number(hourRaw),
      minute: Number(minuteRaw)
    },
    {
      zone: "America/Los_Angeles"
    }
  );

  if (date < DateTime.now().setZone("America/Los_Angeles")) {
    date = date.plus({ years: 1 });
  }

  return date.toUTC().toISO() ?? undefined;
}

async function fetchSteamAppPromotionEnd(
  appId: string
): Promise<string | undefined> {
  const url = `https://store.steampowered.com/app/${appId}/?l=french&cc=FR`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 FreeGamesScanner/1.0",
      Accept: "text/html"
    }
  });

  if (!response.ok) {
    console.warn(`[STEAM] app ${appId} HTTP ${response.status}`);
    return undefined;
  }

  const html = await response.text();

  const match = html.match(
    /Obtenez-le avant le\s+(.+?)\s+pour le garder gratuitement/i
  );

  if (!match) {
    console.warn(`[STEAM] app ${appId}: no promotion end found`);
    return undefined;
  }

  console.log(`[STEAM] app ${appId} raw end text:`, match[1]);
  return parseFrenchSteamDateToUtc(match[1]);
}

export async function fetchSteamPromos(): Promise<FreeGamePromo[]> {
  const response = await fetch(STEAM_SEARCH_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 FreeGamesScanner/1.0",
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Steam Store HTTP ${response.status}`);
  }

  const json = (await response.json()) as {
    results_html?: string;
  };

  if (!json.results_html) {
    return [];
  }

  const $ = cheerio.load(json.results_html);
  const promos: FreeGamePromo[] = [];

  const rows = $("a.search_result_row").toArray();

  for (const element of rows as Element[]) {
    const title = $(element).find(".title").text().trim();
    const promoUrl = $(element).attr("href")?.split("?")[0];

    if (!title || !promoUrl) continue;

    const appId = extractSteamAppId(promoUrl);

    const expiresAt = appId
      ? await fetchSteamAppPromotionEnd(appId)
      : undefined;

    if (!expiresAt) {
      console.warn(`[STEAM] skipped ${title}: missing expiresAt`);
      continue;
    }

    const imageUrl = appId
        ? `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`
        : "";

    promos.push({
      image_url: imageUrl,
      providerCode: FREE_GAME_PROVIDERS.STEAM.code,
      title,
      promoUrl,
      expiresAt,
      promoType: FREE_GAME_PROMO_TYPES.FREE_TO_KEEP.code
    });
  }

  console.log(`[STEAM] promos found: ${promos.length}`);

  return promos;
}