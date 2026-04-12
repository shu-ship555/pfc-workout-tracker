# PFC Workout Tracker — デザインガイドライン

---

## タイポグラフィ

### フォント

| 用途 | フォント |
|---|---|
| 本文・UI全般 | Montserrat（欧文）+ Noto Sans JP（和文）|
| 数値・コード・時刻 | Geist Mono（`font-mono`）|

和欧混植構成。ブラウザはMontserratでラテン文字を描画し、グリフのない日本語はNoto Sans JPにフォールバックする。

### テキストサイズ

| 役割 | クラス |
|---|---|
| ページタイトル | `text-lg font-bold tracking-tight` |
| セクション見出し | `text-sm font-medium` |
| 本文・ラベル | `text-sm` |
| 補助テキスト・メタデータ | `text-xs text-muted-foreground` |
| データ値（PFCなど） | `text-xl font-bold font-mono` |
| 単位 | `text-xs font-normal ml-0.5` |

### ルール

- 数値は必ず `font-mono` を使う。重量・セット数・カロリーなどすべて統一する
- 補助テキストは `text-muted-foreground` で視覚的階層を作る
- `whitespace-nowrap` を使い、重要なラベルが改行されないよう保護する

---

## カラー

### パレット

テーマカラーはすべてCSS変数で管理する。Tailwindのハードコード色（`gray-500` など）は基本的に使わない。

| トークン | 用途 |
|---|---|
| `bg-background` / `text-foreground` | ページ背景・本文 |
| `bg-card` / `text-card-foreground` | カード背景 |
| `bg-muted` / `text-muted-foreground` | 非強調背景・補助テキスト |
| `bg-primary` / `text-primary-foreground` | メインアクション |
| `border-border` | 区切り線・枠線 |
| `text-destructive` | 削除・危険操作 |

### セマンティックカラー

意味を持つ状態や分類を色で表現する際は以下のパレットで統一する。

| 意味 | 背景 | テキスト | 用途例 |
|---|---|---|---|
| 青（情報） | `bg-blue-500/10` | `text-blue-600 dark:text-blue-400` | P タンパク質 |
| 黄（注意） | `bg-yellow-500/10` | `text-yellow-500` | F 脂質、気分（中間）|
| 緑（良好） | `bg-green-500/10` | `text-green-600 dark:text-green-400` | C 炭水化物、気分（良好）|
| 橙（エネルギー） | `bg-orange-500/10` | `text-orange-600 dark:text-orange-400` | カロリー |
| 赤（警告） | — | `text-red-500` | 気分（極端）、静止できていない |

### チャートライン

| 役割 | 色 |
|---|---|
| 重量推移ライン | `stroke-primary`（テーマ追従）|
| 目標ライン | `hsl(221 83% 53%)`（blue-600相当、破線）|

### ルール

- セマンティックカラーは上記パレットに限定する。それ以外のアドホックな色は使わない
- 意味のない装飾目的でセマンティックカラーを使わない
- ダークモードは `.dark` クラスで自動対応。カラートークンを使っていれば追加対応不要

---

## スペーシング

### 基本単位

スペーシングの基本単位は `6`（1.5rem）。

| 場面 | クラス |
|---|---|
| ページ内セクション間 | `space-y-6` |
| セクション区切り線（Separator）周辺 | `my-12` |
| カード内コンテンツ | `gap-3`〜`gap-4` |
| アイコンとテキスト | `gap-1`〜`gap-2` |
| ページ横余白 | `px-4` |
| ページ縦余白 | `py-6` |
| SP下部FABによるコンテンツ余白 | `pb-24 sm:pb-6` |

### 上方錯視の補正

視覚的に上下の余白が等しく見えるよう、上の余白を下より小さくする。等量のpaddingを指定すると、人間の目には下側が広く見える（上方錯視）ため、上を約80〜90%に抑えることで光学的な均衡を保つ。

```tsx
// 例: py-6 の代わりに
className="pt-5 pb-6"

// CardHeader: pb-2 に対して pt を1段小さく
className="pt-3 pb-2"
```

モーダル・カード・セクション内など、上下に余白が生じる箇所全般に適用する。

### レイアウト幅

```
max-w-5xl mx-auto w-full
```

コンテンツは最大幅 `max-w-5xl`（64rem）で中央寄せ。

---

## ボーダーラジウス

CSS変数 `--radius: 0.625rem` を基準とした倍率系。

| トークン | 計算式 | 主な用途 |
|---|---|---|
| `rounded-sm` | × 0.6 | バッジ内など小要素 |
| `rounded-md` | × 0.8 | インプット、ボタン小 |
| `rounded-lg` | × 1.0（基準）| カード、ボタン |
| `rounded-xl` | × 1.4 | モーダルなど |
| `rounded-full` | — | FABボタン |

---

## コンポーネント

### Card

グループ化されたコンテンツの基本コンテナ。

```tsx
<Card>
  <CardHeader className="pb-2">...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

- カードの中にカードは入れない
- ヘッダーは `pb-2` で詰める

### Button

```tsx
// プライマリアクション
<Button className="hover:bg-primary/80">...</Button>

// 危険操作
<Button className="bg-destructive text-white hover:bg-destructive/90">...</Button>

// ゴーストボタン（アイコン操作）
<Button size="icon" variant="ghost" className="h-7 w-7">...</Button>
```

- プライマリボタンには必ず `hover:bg-primary/80` を付ける（デフォルトはアンカー内限定のため）
- 削除ボタンは `text-white`（`text-destructive-foreground` は未定義のため使用しない）

### Dialog vs AlertDialog

| 用途 | コンポーネント |
|---|---|
| フォーム・メモ表示 | `Dialog` |
| 削除確認など破壊的操作 | `AlertDialog` |

### Table

- ヘッダー行は `<TableRow className="hover:bg-transparent">` でホバーなし
- データ行はデフォルト（ホバーあり）

### Badge

| 用途 | variant |
|---|---|
| 部位タグ（胸・腕など） | `secondary` |
| フラグ（WU・NEG・反動・不安定） | `outline` |

フラグの色分け：
- 反動あり：`text-yellow-600`
- 静止できていない：`text-red-500`

### Select

種目セレクトは長い選択肢が途切れないよう `SelectContent` に `min-w-max` を付ける。

```tsx
<SelectContent className="min-w-max">
```

---

## アイコン

lucide-reactを使用。サイズは用途に応じて統一する。

| サイズ | 用途 |
|---|---|
| `h-3.5 w-3.5` | テーブル内ボタン・補助アイコン |
| `h-4 w-4` | 標準（ボタン内など）|
| `h-5 w-5` | FABボタン |
| `h-6 w-6` | ヘッダーロゴ |

---

## インタラクション

### ホバー

| 要素 | ホバー |
|---|---|
| プライマリボタン | `hover:bg-primary/80` |
| FABボタン（PC） | `hover:bg-primary/80 hover:shadow-xl hover:scale-105` |
| ゴーストボタン | `hover:bg-muted hover:text-foreground`（デフォルト）|
| テーブルヘッダー行 | なし（`hover:bg-transparent`）|
| テーブルデータ行 | あり（デフォルト）|
| メモアイコン | `hover:text-foreground transition-colors` |

### トランジション

- `transition-all`・`transition-colors` はButtonコンポーネント側で定義済み
- 個別に追加する必要はない

---

## レスポンシブ

ブレークポイントは `sm`（640px）を主に使用する。

| 要素 | SP | PC（sm以上）|
|---|---|---|
| 記録追加ボタン | 画面下部固定バー（全幅）| 右下FAB（rounded-full）|
| グリッド列数 | 2列 | 4列（`sm:grid-cols-4`）|
| チャートヘッダー | 縦並び | 横並び（`sm:flex-row`）|
| ページ下余白 | `pb-24` | `pb-6`（`sm:pb-6`）|
| フォントサイズ（ダイアログタイトル）| `text-[10px]` | `text-xs`（`sm:text-xs`）|

---

## 日付・時刻

- すべての日付処理はJST（UTC+9）基準
- `toISOString()` は使わず、以下のパターンで統一する

```ts
// JST の今日の日付（YYYY-MM-DD）
new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split("T")[0]
```

- チャートの表示フォーマットは `M月D日` 形式（`ja-JP` locale）
- テーブルの日時表示は `MM/DD HH:MM` 形式

---

## アクセシビリティ

- フォームの `<input>` には必ず `id` と対応する `<Label htmlFor>` を付ける
- 破壊的操作は必ず `AlertDialog` で確認を挟む
- ロード中は `<Skeleton>` でプレースホルダーを表示する
- 空状態は専用のメッセージUIを用意する（単純な非表示はしない）
