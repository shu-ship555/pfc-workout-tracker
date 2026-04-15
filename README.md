# PFC Workout Tracker

筋トレの記録・食事のPFC管理・生活ログを一元管理するWebアプリ。Notionをデータストアとして活用し、Vercelにデプロイするサーバーレス構成。

---

## 機能概要

| 機能 | 説明 |
| --- | --- |
| **ワークアウト記録** | 部位・種目・セット・レップ・重量を素早く入力。編集・削除（ソフトデリート）対応 |
| **重量推移チャート** | 種目ごとの重量推移をLineChartで可視化。Y軸を動的スケーリングで常に見やすく表示 |
| **食事記録（AI分析）** | Gemini APIで食事内容を入力するだけでPFC・カロリーを自動推定。確認・調整後に保存 |
| **PFCサマリー** | Notionの食事DBと連携し、今日/前日/3日/7日単位でタンパク質・脂質・炭水化物・カロリーを集計 |
| **ライフログチャート** | 気分スコア・睡眠時間・気温・湿度・歩数をComposedChartで複合表示 |
| **ワークアウト一覧** | 2週間ウィンドウのページネーション。日付・部位・種目でフィルタリング可能 |
| **PWA対応** | ホーム画面へのインストール対応（スタンドアロンモード） |

---

## 技術スタック

| カテゴリ | 技術 |
| --- | --- |
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript 5 |
| スタイリング | Tailwind CSS 4 |
| UIコンポーネント | shadcn/ui (base-nova) |
| アイコン | lucide-react |
| チャート | Recharts 3 |
| データストア | Notion API (@notionhq/client) |
| AI分析 | Google Gemini API |
| デプロイ | Vercel |

---

## ディレクトリ構成

```
src/
├── app/
│   ├── api/
│   │   ├── workouts/              # GET(一覧) / POST(作成)
│   │   │   └── [id]/              # PUT(更新) / DELETE(アーカイブ)
│   │   ├── meals/                 # GET(一覧) / POST(作成)
│   │   │   ├── [id]/              # PATCH(更新) / DELETE(削除)
│   │   │   ├── analyze/           # POST(Gemini分析)
│   │   │   └── latest/            # DELETE(最新記録削除)
│   │   ├── lifelog/               # GET(一覧)
│   │   │   ├── [id]/              # PATCH(気分更新)
│   │   │   └── options/           # GET(気分セレクト選択肢)
│   │   └── daily-summary/         # GET(ライフログ・天気・Fitbit集約)
│   ├── layout.tsx                 # ルートレイアウト（フォント設定）
│   ├── page.tsx                   # メインダッシュボード
│   ├── globals.css                # Tailwindテーマ変数
│   └── manifest.ts                # PWAマニフェスト
├── components/
│   ├── ui/                        # shadcn/uiコンポーネント群
│   ├── workout-form.tsx           # ワークアウト追加・編集フォーム
│   ├── workout-list.tsx           # ページネーション付きワークアウト一覧
│   ├── workout-chart.tsx          # 重量推移LineChart
│   ├── workout-selects.tsx        # 部位・種目セレクトボックス
│   ├── meal-form.tsx              # 食事記録フォーム（Gemini AI分析付き）
│   ├── pfc-summary.tsx            # PFC集計カード
│   ├── pfc-grid.tsx               # PFCグリッド表示（コンパクト4列・読み取り専用）
│   ├── pfc-input-grid.tsx         # PFC数値入力グリッド（4列・編集用）
│   ├── date-range-input.tsx       # 日付範囲選択コンポーネント
│   ├── lifelog-summary.tsx        # ライフログComposedChart
│   ├── scrollable-chart.tsx       # 横スクロール可能チャートコンテナ（共通）
│   └── chart-tooltip.tsx          # カスタムRechartsツールチップ
└── lib/
    ├── types.ts                   # WorkoutEntry / MealEntry / LifeLogEntry / PFCValues / MealLike
    ├── notion.ts                  # NotionAPIクライアント・クエリ関数
    ├── exercises.ts               # PARTS・EXERCISESマッピング
    ├── gemini.ts                  # Google Gemini APIクライアント
    ├── weather.ts                 # OpenWeather APIクライアント
    ├── fitbit.ts                  # Fitbit APIクライアント
    ├── date-utils.ts              # JST日付ユーティリティ
    ├── color-constants.ts         # セマンティックカラー定数（一元管理）
    ├── api-utils.ts               # IS_DEMO定数・APIエラー変換・Mealボディパース
    ├── demo-data.ts               # デモ用フィクスチャデータ・日付シフトヘルパー
    └── utils.ts                   # cn()ユーティリティ
```

---

## 設計のこだわり

**Notionをデータベースとして活用**
サーバーレスAPIからNotionのDBを直接読み書き。専用DBサーバーを立てず、既存のNotionワークスペースにデータを集約できる。

**Y軸の動的スケーリング**
フィルタ後の重量データから最小・最大値を算出し、振れ幅の50%（最低2.5kg）を余白として付与。どの種目でも線グラフが常にチャート中央付近に収まる。

**JST基準の日付処理**
`toISOString()`（UTC）ではなく `Date.now() + 9 * 60 * 60 * 1000` でJSTに統一。深夜0時に「今日」と「前日」が正確に切り替わる。

**2週間ウィンドウのページネーション**
最古レコードから動的にページ数を算出し、2週間ごとに分割表示。日付・部位・種目の同時フィルタリングにも対応。

**色の一元管理**
`src/lib/color-constants.ts` でP/F/C/kcal・気分スコア・フラグなどのセマンティックカラーを一元定義。コンポーネントにTailwindクラスを直書きせず、保守性を高めている。

---

## プレビュー（デモ環境）

Notion / Gemini APIキーなしでアプリの動作を確認できるデモ環境を用意している。

**URL:** https://pfc-workout-tracker-git-preview-shu-ship555s-projects.vercel.app/

- 追加・編集・削除の操作もUIとして動作する（ページ再読み込みでリセット）
- AI食事分析はダミーの固定レスポンスを返す
- 画面上部に「デモモード」バナーが表示される

### デモ環境の仕組み

`preview` ブランチに Vercel 環境変数 `NEXT_PUBLIC_DEMO_MODE=true` を設定している。この変数が有効なとき、すべての API ルートが Notion / Gemini を呼ばずにダミーデータを返す。

### デモ環境の更新手順

```bash
git checkout preview
git merge main
git push
# Vercel が自動デプロイ → 同じURLに最新内容が反映される
```

### デモ環境をローカルで再現する

```bash
# .env.local に以下を追加
NEXT_PUBLIC_DEMO_MODE=true

npm run dev
```

---

## セットアップ

### 必要な環境変数

`.env.local` に以下を設定する。テンプレートファイルをコピーして使うと便利。

```bash
cp .env.local.example .env.local
```

`.env.local` に実際の値を入力する。

```
NOTION_API_KEY=your_notion_integration_token
NOTION_WORKOUT_DATABASE_ID=your_workout_db_id
NOTION_FOOD_DATABASE_ID=your_food_db_id
NOTION_LIFELOG_DATABASE_ID=your_lifelog_db_id
GEMINI_API_KEY=your_gemini_api_key
```

> `.env.local` はgit管理対象外のため、各自で作成すること。

### Vercelへのデプロイ

Vercelダッシュボードの **Settings → Environment Variables** で上記の変数を設定する。
コードの変更は不要で、Vercelがビルド・実行時に自動で環境変数を注入する。

### Notion DBスキーマ

**Workout DB**

| プロパティ名 | 型 | 説明 |
| --- | --- | --- |
| Memo | タイトル | 記録のメモ |
| Parts | セレクト | 部位（胸・腕・背中・脚・肩） |
| Exercise | セレクト | 種目名 |
| Set | 数値 | セット数 |
| Rep | 数値 | レップ数 |
| Weight | 数値 | 重量（kg） |
| Goal | 数値 | 目標重量（kg） |
| Negative | チェックボックス | ネガティブ強調フラグ |
| Warmup | チェックボックス | ウォームアップフラグ |
| hasRebound | チェックボックス | 反動ありフラグ |
| notStable | チェックボックス | 静止できていないフラグ |

**Food DB**

| プロパティ名 | 型 |
| --- | --- |
| Name | タイトル |
| Date | 日付 |
| Kcal | 数値 |
| Protein | 数値 |
| Fat | 数値 |
| Carb | 数値 |

**LifeLog DB**

| プロパティ名 | 型 | 説明 |
| --- | --- | --- |
| Date | タイトル | 日付（YYYY/MM/DD） |
| MoodSelect | セレクト | 気分選択肢 |
| Mood | 数値（数式） | 気分スコア（0–10） |
| SleepTime | テキスト | 就寝時刻 |
| WakeTime | テキスト | 起床時刻 |
| Weather | テキスト | 天気 |
| TempMax | 数値 | 最高気温 |
| TempMin | 数値 | 最低気温 |
| Humidity | 数値 | 湿度（%） |
| Steps | 数値 | 歩数 |
| City | テキスト | 地域 |
| ConsumedKcal | 数値 | 消費カロリー |

### 起動

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) で動作を確認できる。
