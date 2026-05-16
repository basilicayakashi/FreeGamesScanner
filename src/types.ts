export type ProviderCode =
  | "STEAM"
  | "GOG"
  | "EPICGAMES"
  | "ITCHIO"; 

export type PromoType =
  | "FREE_TO_KEEP"
  | "PLAY_FOR_FREE";

export type FreeGamePromo = {
  providerCode: ProviderCode;
  title: string;
  promoUrl: string;
  expiresAt: string;
  promoType: PromoType;
};