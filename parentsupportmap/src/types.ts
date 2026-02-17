export type ServiceKey =
  | "diaper_change"
  | "diaper_trash"
  | "kids_toilet"
  | "nursing_room"
  | "stroller_access"
  | "kids_chair_tableware"
  | "parking_car"
  | "parking_bicycle"
  | "hot_water";

export type Services = Record<ServiceKey, boolean>;

export type Shop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  photos?: string[];
  services: Services;
  note?: string;
};