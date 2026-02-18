import type { Shop } from "../../types";
import type { ShopRepo } from "./types";

const LS_SHOPS = "psm_shops_v1";

function load(): Shop[] {
  const raw = localStorage.getItem(LS_SHOPS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Shop[];
  } catch {
    return [];
  }
}

function save(shops: Shop[]) {
  localStorage.setItem(LS_SHOPS, JSON.stringify(shops));
}

export function localShopRepo(): ShopRepo {
  return {
    async list() {
      return load();
    },

    async seedIfEmpty(seed: Shop[]) {
      const current = load();
      if (current.length > 0) return;
      save(seed);
    },

    async upsert(shop: Shop) {
      const current = load();
      const idx = current.findIndex((s) => s.id === shop.id);
      if (idx >= 0) current[idx] = shop;
      else current.push(shop);
      save(current);
    },

    async remove(id: string) {
      const current = load().filter((s) => s.id !== id);
      save(current);
    },
  };
}
