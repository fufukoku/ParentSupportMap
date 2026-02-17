# ParentSupportMap

## 概要（日本語）
ParentSupportMapは、子育て中（特にひとり親家庭）の方々が、協力店舗の支援サービスを地図上で素早く探せるようにするための公益目的Webツールです。  
本リポジトリは**発表・デモ用途のフロントエンド**を公開しており、個人情報や実利用データは扱いません。

## Overview (English)
ParentSupportMap is a public-interest web tool that helps parents (especially single-parent families) quickly find participating businesses and their child-support services on a map.  
This repository contains a **presentation/demo front-end** only and does **not** handle personal data or production usage data.

## 主な機能（日本語）
- 地図上に協力店舗を表示（マーカー）
- マーカーをクリックすると、店舗詳細（画像・サービス可否アイコン）を表示
- 対応サービス（例）  
  - おむつ交換スペース  
  - おむつ廃棄（ゴミ箱）  
  - 子ども用トイレ（介助が必要な想定）  
  - 授乳スペース  
  - ベビーカー入店可  
  - 子ども用椅子・食器  
  - 駐車場／駐輪場  
  - お湯（ミルク作り）

## Key Features (English)
- Display participating businesses as markers on a map
- Click a marker to open a detail view (photos + service availability icons)
- Supported service tags (examples)
  - Diaper-changing space
  - Diaper disposal (trash bin)
  - Kids’ toilet (assistance assumed)
  - Nursing/breastfeeding space
  - Stroller-friendly access
  - Kids chair/tableware
  - Car parking / Bicycle parking
  - Hot water (for formula)

## データについて（日本語）
本デモは `src/data/shops.demo.json` の**デモデータ**を読み込みます。  
実在店舗データを掲載する場合は、公開許諾・正確性・更新方法について別途検討してください。

## About Data (English)
This demo loads **demo data** from `src/data/shops.demo.json`.  
If you plan to publish real business data, please separately address permission, accuracy, and update procedures.

## セキュリティ（日本語）
- 本デモは個人情報を扱いません（ログイン、決済、利用履歴等は未実装）。
- Google Maps API Keyはブラウザに配布されるため、**HTTP Referrer制限**と**API制限**を必ず設定してください。
- `.env*` はリポジトリにコミットしないでください。

## Security (English)
- This demo does not handle personal data (no login, payments, or usage history).
- Because Google Maps API keys are delivered to the browser, always enable **HTTP referrer restrictions** and **API restrictions**.
- Never commit `.env*` files to the repository.

## プライバシー（日本語）
本デモは個人情報（氏名、連絡先、位置履歴等）を収集・保存しません。  
将来的に補助券・利用回数管理などを実装する場合は、別リポジトリ／別環境での認証・権限・監査ログ等を含む設計が必要です。

## Privacy (English)
This demo does not collect or store personal information (names, contacts, location history, etc.).  
If future features (e.g., subsidy vouchers, usage limits) are implemented, a separate repository/environment and a privacy-by-design architecture (authz/authn, audit logs, etc.) will be required.

## 使用制限（重要｜日本語）
本リポジトリは公益目的の**デモ／学術・発表用途**として公開しています。  
**無断での商用利用、再配布、ホスティング（第三者向け公開運用）、派生物の公開**は許可しません。  
利用希望がある場合は、事前にご連絡ください。

## Usage Restrictions (Important | English)
This repository is shared for **public-interest demo / academic / presentation purposes** only.  
**Commercial use, redistribution, hosting for third-party production use, or publishing derivatives** is **not permitted** without explicit permission.  
If you would like to use it, please contact the author in advance.

## 起動方法（日本語）
1. Node.js を用意
2. 依存関係をインストール
   - `npm install`
3. 環境変数を設定（例：`.env.local`）
   - `VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY`
4. 開発サーバ起動
   - `npm run dev`

## Getting Started (English)
1. Install Node.js
2. Install dependencies
   - `npm install`
3. Set environment variables (e.g., `.env.local`)
   - `VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY`
4. Start dev server
   - `npm run dev`






