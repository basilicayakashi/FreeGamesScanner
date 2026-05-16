import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import { DateTime } from "luxon";
import type { FreeGamePromo } from "../types.js";

const ITCHIO_ON_SALE_URL = "https://itch.io/games/on-sale";
const ITCHIO_NEVER_EXPIRES = "9999-12-31T23:59:59.999Z";

function normalizeItchioUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `https://itch.io${href}`;
}

function extractDiscount(text: string): number | undefined {
  const match = text.match(/-(\d+)%/);
  return match ? Number(match[1]) : undefined;
}

function isZeroPrice(text: string): boolean {
  return /\$0|€0|£0|0€|0\s*USD|0\s*EUR/i.test(text);
}

export async function fetchItchioPromos(): Promise<FreeGamePromo[]> {
  const response = await fetch(ITCHIO_ON_SALE_URL, {
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://itch.io/"
        }
  });

    if (response.status === 403) {
    console.warn("[ITCHIO] HTTP 403: provider skipped");
    return [];
    }

    if (!response.ok) {
    throw new Error(`itch.io HTTP ${response.status}`);
    }

  const html = await response.text();
  const $ = cheerio.load(html);

  const promos: FreeGamePromo[] = [];

  $(".game_cell").each((index: number, element: Element) => {
    const cell = $(element);
    const text = cell.text().replace(/\s+/g, " ").trim();

    const discount = extractDiscount(text);

    if (discount !== 100 || !isZeroPrice(text)) {
      return;
    }

    const title =
      cell.find(".title").first().text().trim() ||
      cell.find("a.title").first().text().trim();

    const href =
      cell.find("a.title").first().attr("href") ||
      cell.find("a.game_link").first().attr("href") ||
      cell.find("a").first().attr("href");

    if (!title || !href) {
      return;
    }

    promos.push({
      providerCode: "ITCHIO",
      title,
      promoUrl: normalizeItchioUrl(href),
      expiresAt: ITCHIO_NEVER_EXPIRES,
      promoType: "FREE_TO_KEEP"
    });
  });

  console.log(`[ITCHIO] promos found: ${promos.length}`);

  return promos;
}