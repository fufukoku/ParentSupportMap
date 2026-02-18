import type { Shop } from "../../types";

export type ShopRepo = {
  list(): Promise<Shop[]>;
  upsert(shop: Shop): Promise<void>;
  remove(id: string): Promise<void>;
  seedIfEmpty(seed: Shop[]): Promise<void>;
};
