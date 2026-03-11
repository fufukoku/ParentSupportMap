import type { Shop } from "../../types";

export interface ShopRepo {
  list(): Promise<Shop[]>;
  seedIfEmpty(seed: Shop[]): Promise<void>;
  upsert(shop: Shop): Promise<void>;
  remove(id: string): Promise<void>;
}
