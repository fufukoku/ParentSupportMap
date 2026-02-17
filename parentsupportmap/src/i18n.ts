export type Lang = "ja" | "en";

export const t = {
  ja: {
    appTitle: "子育て支援マップ（デモ）",
    demoNotice: "※本サイトはデモです。個人情報は収集しません。",
    servicesTitle: "提供サービス",
    yes: "あり",
    no: "なし",
    address: "住所",
    note: "メモ",
    language: "言語",

    // ✅ 你 ShopDrawer 里会用到的 key（之前缺了）
    howToTitle: "使い方",
    howToBody: "地図のピンをクリックすると、施設の提供サービスを確認できます。",
    demoDataOnly: "※デモデータのみ（表示内容はサンプルです）。",

    // ✅ 统一用 snake_case（和你的 Shop.services 字段一致）
    services: {
      diaper_change: "おむつ交換スペース",
      diaper_trash: "おむつ廃棄（ゴミ箱）",
      kids_toilet: "子ども用トイレ",
      nursing_room: "授乳スペース",
      stroller_access: "ベビーカー入店可",
      kids_chair_tableware: "子ども用椅子・食器",
      parking_car: "駐車場",
      parking_bicycle: "駐輪場",
      hot_water: "お湯（ミルク用）",
      notAvailableTitle: "未対応（クリックで表示）",
    },

    // ✅ 兼容你旧代码里 t[lang].svc 的写法（避免你别处也用到了）
    svc: {
      diaper_change: "おむつ交換スペース",
      diaper_trash: "おむつ廃棄（ゴミ箱）",
      kids_toilet: "子ども用トイレ",
      nursing_room: "授乳スペース",
      stroller_access: "ベビーカー入店可",
      kids_chair_tableware: "子ども用椅子・食器",
      parking_car: "駐車場",
      parking_bicycle: "駐輪場",
      hot_water: "お湯（ミルク用）",
      notAvailableTitle: "未対応（クリックで表示）",
    },
  },

  en: {
    appTitle: "Parent Support Map (Demo)",
    demoNotice: "This is a demo. No personal data is collected.",
    servicesTitle: "Services",
    yes: "Yes",
    no: "No",
    address: "Address",
    note: "Note",
    language: "Language",

    // ✅ 你 ShopDrawer 里会用到的 key（之前缺了）
    howToTitle: "How to use",
    howToBody: "Click a pin on the map to view available services at that place.",
    demoDataOnly: "Demo data only (sample content).",

    // ✅ snake_case
    services: {
      diaper_change: "Diaper-changing space",
      diaper_trash: "Diaper disposal (trash bin)",
      kids_toilet: "Kids’ toilet",
      nursing_room: "Nursing / breastfeeding space",
      stroller_access: "Stroller-friendly access",
      kids_chair_tableware: "Kids chair / tableware",
      parking_car: "Car parking",
      parking_bicycle: "Bicycle parking",
      hot_water: "Hot water (for formula)",
      notAvailableTitle: "Not available (click to expand)",
    },

    // ✅ 兼容旧写法
    svc: {
      diaper_change: "Diaper-changing space",
      diaper_trash: "Diaper disposal (trash bin)",
      kids_toilet: "Kids’ toilet",
      nursing_room: "Nursing / breastfeeding space",
      stroller_access: "Stroller-friendly access",
      kids_chair_tableware: "Kids chair / tableware",
      parking_car: "Car parking",
      parking_bicycle: "Bicycle parking",
      hot_water: "Hot water (for formula)",
      notAvailableTitle: "Not available (click to expand)",
    },
  },
} as const;