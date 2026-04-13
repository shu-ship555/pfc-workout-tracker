# PFC Workout Tracker

筋トレの記録・食事のPFC管理・生活ログを一元管理するWebアプリ。Notionをデータストアとして活用し、Vercelにデプロイするサーバーレス構成。

---

## 機能概要

| 機能 | 説明 |
| --- | --- |
| **ワークアウト記録** | 部位・種目・セット・レップ・重量を素早く入力。編集・削除（ソフトデリート）対応 |
| **重量推移チャート** | 種目ごとの重量推移をLineChartで可視化。Y軸を動的スケーリングで常に見やすく表示 |
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
| デプロイ | Vercel |

---

## ディレクトリ構成

```
src/
├── app/
│   ├── api/
│   │   ├── workouts/          # GET(一覧) / POST(作成)
│   │   │   └── [id]/          # PUT(更新) / DELETE(アーカイブ)
│   │   ├── meals/             # GET(PFC集計用)
│   │   └── lifelog/           # GET(一覧) / PATCH(気分更新)
│   │       └── options/       # GET(気分セレクト選択肢)
│   ├── layout.tsx             # ルートレイアウト（フォント設定）
│   ├── page.tsx               # メインダッシュボード
│   ├── globals.css            # Tailwindテーマ変数
│   └── manifest.ts            # PWAマニフェスト
├── components/
│   ├── ui/                    # shadcn/uiコンポーネント群
│   ├── workout-form.tsx       # ワークアウト追加・編集フォーム
│   ├── workout-list.tsx       # ページネーション付きワークアウト一覧
│   ├── workout-chart.tsx      # 重量推移LineChart
│   ├── pfc-summary.tsx        # PFC集計カード
│   ├── lifelog-summary.tsx    # ライフログComposedChart
│   └── chart-tooltip.tsx      # カスタムRechartsツールチップ
└── lib/
    ├── types.ts               # WorkoutEntry / MealEntry / LifeLogEntry
    ├── notion.ts              # NotionAPIクライアント・クエリ関数
    ├── exercises.ts           # PARTS・EXERCISESマッピング
    └── utils.ts               # cn()ユーティリティ
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

| プロパティ名 | 型 |
| --- | --- |
| Memo | タイトル |
| Parts | セレクト |
| Exercise | セレクト |
| Set | 数値 |
| Rep | 数値 |
| Weight | 数値 |
| Goal | 数値 |
| Negative | チェックボックス |
| Warmup | チェックボックス |
| hasRebound | チェックボックス |
| notStable | チェックボックス |

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

| プロパティ名 | 型 |
| --- | --- |
| Date | タイトル |
| MoodSelect | セレクト |
| Mood | 数値（数式） |
| SleepTime | テキスト |
| WakeTime | テキスト |
| Weather | テキスト |
| TempMax | 数値 |
| TempMin | 数値 |
| Humidity | 数値 |
| Steps | 数値 |
| City | テキスト |
| ConsumedKcal | 数値 |

### 起動

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) で動作を確認できる。
