# ParentSupportMap

## 概要（日本語）
ParentSupportMap は、子育て中の家庭、特にひとり親家庭の方々が、協力店舗・支援施設・子育て関連サービスを地図上で探しやすくするための公益目的 Web アプリです。  
地図・検索・絞り込み・施設詳細表示に加え、管理画面から施設情報や画像を追加・更新できる構成になっています。

本リポジトリは、公開デモ兼ポートフォリオ用途の実装です。  
現時点では小規模な公開版であり、本番業務システムとしての運用を前提としたものではありません。

---

## Overview (English)
ParentSupportMap is a public-interest web application that helps families raising children, especially single-parent households, find participating businesses, support facilities, and child-friendly services on a map.

In addition to map display, search, filtering, and facility detail views, the application includes an admin interface for adding and updating facility information and images.

This repository is published as a public demo and portfolio project.  
The current version is a small-scale public release and is not intended to represent a full production-grade operational system.

---

## 主な機能（日本語）
- 地図上に施設・店舗を表示
- 検索機能（施設名・住所・タイプ）
- カテゴリ表示（例：レストラン、カフェ、スーパー、ドラッグストア、公共施設 など）
- 対応サービスによる絞り込み
- 施設詳細表示
  - 施設タイプ
  - 画像
  - 対応サービス一覧
  - メモ
- レスポンシブ UI（スマートフォン対応）
- 管理画面
  - 施設追加
  - 施設編集
  - 施設削除
  - 画像アップロード
  - 地図上での位置選択
  - 現在地取得
  - 住所検索
- 認証機能
  - ユーザー登録
  - ログイン
  - メール確認
  - 管理者権限による保護

---

## Key Features (English)
- Display facilities and businesses on a map
- Search by facility name, address, or type
- Category labels (e.g. restaurant, cafe, supermarket, drugstore, public facility)
- Filter by supported child-friendly services
- Facility detail view
  - Category/type
  - Images
  - Service availability
  - Notes
- Responsive UI for mobile devices
- Admin interface
  - Add facilities
  - Edit facilities
  - Delete facilities
  - Upload images
  - Select location on map
  - Use current location
  - Search by address
- Authentication
  - User registration
  - Login
  - Email verification
  - Admin-protected actions

---

## 対応サービス例（日本語）
- おむつ交換スペース
- おむつ廃棄（ゴミ箱）
- 子ども用トイレ
- 授乳スペース
- ベビーカー入店可
- 子ども用椅子・食器
- 駐車場
- 駐輪場
- お湯（ミルク用）

---

## Example Service Tags (English)
- Diaper-changing space
- Diaper disposal bin
- Kids’ toilet
- Nursing / breastfeeding space
- Stroller-friendly access
- Kids chair / tableware
- Car parking
- Bicycle parking
- Hot water for formula

---

## システム構成（日本語）
現在の構成は以下の通りです。

- Frontend: Vite + React + TypeScript
- Map: Google Maps JavaScript API
- Auth: Amazon Cognito
- API: Amazon API Gateway + AWS Lambda
- Data: Amazon DynamoDB
- Images: Amazon S3
- Hosting: Amazon S3 + CloudFront

---

## Architecture (English)
The current stack includes:

- Frontend: Vite + React + TypeScript
- Map: Google Maps JavaScript API
- Auth: Amazon Cognito
- API: Amazon API Gateway + AWS Lambda
- Data: Amazon DynamoDB
- Images: Amazon S3
- Hosting: Amazon S3 + CloudFront

---

## データについて（日本語）
このプロジェクトでは、施設データを DynamoDB に保存し、画像を S3 に保存します。  
公開版では、施設情報の管理は管理画面経由で行います。

なお、実運用を行う場合は以下の追加検討が必要です。

- データの正確性・更新フロー
- 掲載許可
- 誤情報修正手順
- 運営ポリシー
- 問い合わせ窓口

---

## About Data (English)
Facility data is stored in DynamoDB, and images are stored in S3.  
In the current public version, facility information is managed through the admin interface.

For real-world operational use, additional considerations would be required, including:

- data accuracy and update workflow
- publication permissions
- correction procedures
- operating policy
- contact/support process

---

## セキュリティ（日本語）
- 管理画面の追加・更新・削除処理は認証付き API を前提としています
- フロントエンドで利用する公開環境変数には、ブラウザ配布前提の値のみを使用してください
- `.env*` はリポジトリにコミットしないでください
- Google Maps API Key は必ず HTTP Referrer 制限および API 制限を設定してください
- 本格運用する場合は、権限管理・監査ログ・入力検証・レート制限等の強化が必要です

---

## Security (English)
- Admin create/update/delete operations are protected through authenticated API access
- Only browser-safe public environment variables should be exposed to the frontend
- Never commit `.env*` files to the repository
- Always apply HTTP referrer restrictions and API restrictions to the Google Maps API key
- A production-grade deployment would require stronger authorization, audit logging, input validation, and rate limiting

---

## プライバシー（日本語）
現時点の公開版では、一般ユーザー向けの複雑な利用履歴管理や決済機能は実装していません。  
ただし、認証機能を利用するため、登録時には Cognito を通じた認証情報（例：メールアドレス）が扱われます。

将来的に以下を実装する場合は、別途厳密な設計が必要です。

- 利用履歴管理
- 補助制度やクーポン機能
- 詳細なユーザープロフィール
- 行動ログ収集
- 本格的な管理運営機能

---

## Privacy (English)
The current public release does not implement advanced end-user history tracking or payment functions.  
However, because authentication is enabled, account-related identity data (such as email addresses) is handled through Cognito.

If future features are added, such as:

- usage history
- subsidy / coupon systems
- detailed user profiles
- behavioral logging
- full operational management features

then a stricter privacy and security design would be required.

---

## 使用制限（重要｜日本語）
本リポジトリは、公益目的のデモ・学習・発表・ポートフォリオ用途として公開しています。  
無断での商用利用、再配布、第三者向け本番運用、派生物の公開は許可しません。  
利用を希望する場合は、事前に作者へご連絡ください。

---

## Usage Restrictions (Important | English)
This repository is shared for public-interest demo, study, presentation, and portfolio purposes only.  
Commercial use, redistribution, production hosting for third parties, or public release of derivatives is not permitted without prior permission from the author.

Please contact the author in advance if you wish to use it.

---
