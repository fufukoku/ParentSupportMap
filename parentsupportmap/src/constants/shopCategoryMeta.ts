import type { Lang } from "../i18n";
import type { ShopCategory } from "../types";

export const SHOP_CATEGORY_OPTIONS: ShopCategory[] = [
  "restaurant",
  "cafe",
  "supermarket",
  "drugstore",
  "shopping_mall",
  "public_facility",
  "baby_goods",
  "other",
];

export const SHOP_CATEGORY_META: Record<
  ShopCategory,
  { emoji: string; ja: string; en: string }
> = {
  restaurant: {
    emoji: "🍽️",
    ja: "レストラン",
    en: "Restaurant",
  },
  cafe: {
    emoji: "☕",
    ja: "カフェ",
    en: "Cafe",
  },
  supermarket: {
    emoji: "🛒",
    ja: "スーパー",
    en: "Supermarket",
  },
  drugstore: {
    emoji: "💊",
    ja: "ドラッグストア",
    en: "Drugstore",
  },
  shopping_mall: {
    emoji: "🏬",
    ja: "商業施設",
    en: "Shopping mall",
  },
  public_facility: {
    emoji: "🏢",
    ja: "公共施設",
    en: "Public facility",
  },
  baby_goods: {
    emoji: "🧸",
    ja: "ベビー用品",
    en: "Baby goods",
  },
  other: {
    emoji: "📍",
    ja: "その他",
    en: "Other",
  },
};

export function getShopCategoryLabel(
  lang: Lang,
  category: ShopCategory
): string {
  return lang === "ja"
    ? SHOP_CATEGORY_META[category].ja
    : SHOP_CATEGORY_META[category].en;
}
