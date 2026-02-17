export type Lang = "ja" | "en";

export const t = {
  ja: {
    appTitle: "子育て支援マップ（デモ）",
    demoNotice: "※本サイトはデモです。個人情報は収集しません。",
    langLabel: "言語",
    servicesTitle: "提供サービス",
    yes: "あり",
    no: "なし",
    address: "住所",
    note: "メモ",
    services: {
      diaper_change: "おむつ交換スペース",
      diaper_trash: "おむつ廃棄（ゴミ箱）",
      kids_toilet: "子ども用トイレ",
      nursing_room: "授乳スペース",
      stroller_access: "ベビーカー入店可",
      kids_chair_tableware: "子ども用椅子・食器",
      parking_car: "駐車場",
      parking_bicycle: "駐輪場",
      hot_water: "お湯（ミルク用）"
    }
  },
  en: {
    appTitle: "Parent Support Map (Demo)",
    demoNotice: "This is a demo. No personal data is collected.",
    langLabel: "Language",
    servicesTitle: "Services",
    yes: "Yes",
    no: "No",
    address: "Address",
    note: "Note",
    services: {
      diaper_change: "Diaper-changing space",
      diaper_trash: "Diaper disposal (trash bin)",
      kids_toilet: "Kids’ toilet",
      nursing_room: "Nursing/breastfeeding space",
      stroller_access: "Stroller-friendly access",
      kids_chair_tableware: "Kids chair/tableware",
      parking_car: "Car parking",
      parking_bicycle: "Bicycle parking",
      hot_water: "Hot water (for formula)"
    }
  }
} as const;