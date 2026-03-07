import type { ServiceKey } from "../types";

export const SERVICE_META: Record<ServiceKey, { emoji: string }> = {
  diaper_change: { emoji: "🧷" },
  diaper_trash: { emoji: "🗑️" },
  kids_toilet: { emoji: "🚽" },
  nursing_room: { emoji: "🍼" },
  stroller_access: { emoji: "👶" },
  kids_chair_tableware: { emoji: "🪑" },
  parking_car: { emoji: "🚗" },
  parking_bicycle: { emoji: "🚲" },
  hot_water: { emoji: "♨️" },
};