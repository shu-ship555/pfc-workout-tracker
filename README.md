# PFC Workout Tracker

筋トレの記録と食事のPFC（タンパク質・脂質・炭水化物）を一元管理するWebアプリ。

---

## 🎯 プロジェクトの目的

筋トレの重量推移を可視化しながら、食事の栄養バランスを同時に管理するために開発。

- 毎回のセット・レップ・重量を素早く記録する
- 種目ごとの重量推移をチャートで確認し、成長を実感する
- PFC（タンパク質・脂質・炭水化物）をNotionの食事DBと連携して集計する

---

## 🛠 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| UIコンポーネント | shadcn/ui |
| チャート | Recharts |
| データストア | Notion API |
| デプロイ | Vercel |

---

## 🏗 設計のこだわり

**Notionをデータベースとして活用**
サーバーレスAPIからNotionのデータベースを直接読み書きする構成。専用DBを立てず、既存のNotionワークスペースにデータを集約できる。

**チャートのY軸を動的に調整**
種目ごとの重量レンジに合わせてY軸の表示範囲を自動計算（振れ幅の50%または最低2.5kgを余白として確保）。どの種目でも線グラフが常にチャート中央付近に表示される。

**日付処理をJST基準に統一**
`toISOString()`（UTC）ではなくJST（UTC+9）ベースで日付を扱い、深夜0時に「今日」と「前日」が正しく切り替わるよう対応。

**ページネーションで2週間単位の閲覧**
記録が増えても見やすいよう、2週間ごとのウィンドウでページングし、日時・部位・種目でのフィルタリングにも対応。

---

## 🚀 開発の始め方

### 必要な環境変数

`.env.local` に以下を設定する。

```
NOTION_API_KEY=your_notion_integration_token
NOTION_WORKOUT_DATABASE_ID=your_workout_db_id
NOTION_FOOD_DATABASE_ID=your_food_db_id
```

### Notion DBのスキーマ

**Workout DB**

| プロパティ名 | 型 |
|---|---|
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
|---|---|
| Name | タイトル |
| Date | 日付 |
| Kcal | 数値 |
| Protein | 数値 |
| Fat | 数値 |
| Carb | 数値 |

### 起動

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) で動作を確認できる。
