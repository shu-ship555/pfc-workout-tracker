import type { WorkoutEntry, MealEntry, LifeLogEntry } from "./types";
import type { MealAnalysis } from "./gemini";

export const DEMO_WORKOUTS: WorkoutEntry[] = [
  // 04/07 (Mon) - 胸
  { id: "demo-w-001", created: "2026-04-07T10:00:00.000Z", parts: "胸", exercise: "ベンチプレス", set: 1, rep: 15, weight: 30, goal: 15, memo: "", negative: false, warmup: true, hasRebound: false, notStable: false },
  { id: "demo-w-002", created: "2026-04-07T10:05:00.000Z", parts: "胸", exercise: "ベンチプレス", set: 2, rep: 10, weight: 60, goal: 10, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-003", created: "2026-04-07T10:08:00.000Z", parts: "胸", exercise: "ベンチプレス", set: 3, rep: 8, weight: 65, goal: 10, memo: "少ししんどかった", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-004", created: "2026-04-07T10:12:00.000Z", parts: "胸", exercise: "インクラインベンチプレス", set: 1, rep: 10, weight: 45, goal: 10, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-005", created: "2026-04-07T10:15:00.000Z", parts: "胸", exercise: "インクラインベンチプレス", set: 2, rep: 10, weight: 50, goal: 10, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-006", created: "2026-04-07T10:18:00.000Z", parts: "胸", exercise: "インクラインベンチプレス", set: 3, rep: 9, weight: 50, goal: 10, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-007", created: "2026-04-07T10:22:00.000Z", parts: "胸", exercise: "ペックデックフライ", set: 1, rep: 12, weight: 40, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-008", created: "2026-04-07T10:25:00.000Z", parts: "胸", exercise: "ペックデックフライ", set: 2, rep: 12, weight: 40, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-009", created: "2026-04-07T10:28:00.000Z", parts: "胸", exercise: "ペックデックフライ", set: 3, rep: 11, weight: 40, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },

  // 04/08 (Tue) - 背中
  { id: "demo-w-010", created: "2026-04-08T10:00:00.000Z", parts: "背中", exercise: "ラットプルダウン", set: 1, rep: 15, weight: 40, goal: 15, memo: "", negative: false, warmup: true, hasRebound: false, notStable: false },
  { id: "demo-w-011", created: "2026-04-08T10:04:00.000Z", parts: "背中", exercise: "ラットプルダウン", set: 2, rep: 10, weight: 60, goal: 10, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-012", created: "2026-04-08T10:07:00.000Z", parts: "背中", exercise: "ラットプルダウン", set: 3, rep: 8, weight: 65, goal: 10, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-013", created: "2026-04-08T10:11:00.000Z", parts: "背中", exercise: "シーテッドロウ", set: 1, rep: 10, weight: 55, goal: 10, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-014", created: "2026-04-08T10:14:00.000Z", parts: "背中", exercise: "シーテッドロウ", set: 2, rep: 10, weight: 55, goal: 10, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-015", created: "2026-04-08T10:17:00.000Z", parts: "背中", exercise: "シーテッドロウ", set: 3, rep: 9, weight: 55, goal: 10, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-016", created: "2026-04-08T10:21:00.000Z", parts: "背中", exercise: "デッドリフト", set: 1, rep: 8, weight: 80, goal: 8, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-017", created: "2026-04-08T10:25:00.000Z", parts: "背中", exercise: "デッドリフト", set: 2, rep: 6, weight: 90, goal: 8, memo: "重かった", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-018", created: "2026-04-08T10:29:00.000Z", parts: "背中", exercise: "デッドリフト", set: 3, rep: 5, weight: 90, goal: 8, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },

  // 04/10 (Thu) - 脚
  { id: "demo-w-019", created: "2026-04-10T10:00:00.000Z", parts: "脚", exercise: "スクワット", set: 1, rep: 12, weight: 40, goal: 12, memo: "", negative: false, warmup: true, hasRebound: false, notStable: false },
  { id: "demo-w-020", created: "2026-04-10T10:04:00.000Z", parts: "脚", exercise: "スクワット", set: 2, rep: 8, weight: 70, goal: 8, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-021", created: "2026-04-10T10:08:00.000Z", parts: "脚", exercise: "スクワット", set: 3, rep: 6, weight: 75, goal: 8, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-022", created: "2026-04-10T10:12:00.000Z", parts: "脚", exercise: "スクワット", set: 4, rep: 6, weight: 75, goal: 8, memo: "ギリギリ", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-023", created: "2026-04-10T10:17:00.000Z", parts: "脚", exercise: "レッグプレス", set: 1, rep: 12, weight: 100, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-024", created: "2026-04-10T10:20:00.000Z", parts: "脚", exercise: "レッグプレス", set: 2, rep: 10, weight: 110, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-025", created: "2026-04-10T10:23:00.000Z", parts: "脚", exercise: "レッグプレス", set: 3, rep: 10, weight: 110, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-026", created: "2026-04-10T10:27:00.000Z", parts: "脚", exercise: "レッグカール", set: 1, rep: 12, weight: 35, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-027", created: "2026-04-10T10:30:00.000Z", parts: "脚", exercise: "レッグカール", set: 2, rep: 10, weight: 40, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-028", created: "2026-04-10T10:33:00.000Z", parts: "脚", exercise: "レッグカール", set: 3, rep: 10, weight: 40, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },

  // 04/11 (Fri) - 肩
  { id: "demo-w-029", created: "2026-04-11T10:00:00.000Z", parts: "肩", exercise: "ショルダープレス", set: 1, rep: 10, weight: 40, goal: 10, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-030", created: "2026-04-11T10:04:00.000Z", parts: "肩", exercise: "ショルダープレス", set: 2, rep: 8, weight: 45, goal: 10, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-031", created: "2026-04-11T10:07:00.000Z", parts: "肩", exercise: "ショルダープレス", set: 3, rep: 7, weight: 45, goal: 10, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-032", created: "2026-04-11T10:11:00.000Z", parts: "肩", exercise: "サイドレイズ", set: 1, rep: 15, weight: 10, goal: 15, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-033", created: "2026-04-11T10:13:00.000Z", parts: "肩", exercise: "サイドレイズ", set: 2, rep: 12, weight: 12, goal: 15, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-034", created: "2026-04-11T10:15:00.000Z", parts: "肩", exercise: "サイドレイズ", set: 3, rep: 12, weight: 12, goal: 15, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-035", created: "2026-04-11T10:19:00.000Z", parts: "肩", exercise: "フェイスプル", set: 1, rep: 15, weight: 20, goal: 15, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-036", created: "2026-04-11T10:22:00.000Z", parts: "肩", exercise: "フェイスプル", set: 2, rep: 12, weight: 22, goal: 15, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-037", created: "2026-04-11T10:25:00.000Z", parts: "肩", exercise: "フェイスプル", set: 3, rep: 12, weight: 22, goal: 15, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },

  // 04/12 (Sat) - 腕
  { id: "demo-w-038", created: "2026-04-12T10:00:00.000Z", parts: "腕", exercise: "バイセップカール", set: 1, rep: 12, weight: 12, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-039", created: "2026-04-12T10:03:00.000Z", parts: "腕", exercise: "バイセップカール", set: 2, rep: 10, weight: 14, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-040", created: "2026-04-12T10:06:00.000Z", parts: "腕", exercise: "バイセップカール", set: 3, rep: 9, weight: 14, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-041", created: "2026-04-12T10:09:00.000Z", parts: "腕", exercise: "ハンマーカール", set: 1, rep: 12, weight: 12, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-042", created: "2026-04-12T10:12:00.000Z", parts: "腕", exercise: "ハンマーカール", set: 2, rep: 10, weight: 14, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-043", created: "2026-04-12T10:15:00.000Z", parts: "腕", exercise: "ハンマーカール", set: 3, rep: 10, weight: 14, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-044", created: "2026-04-12T10:19:00.000Z", parts: "腕", exercise: "スカルクラッシャー", set: 1, rep: 12, weight: 24, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-045", created: "2026-04-12T10:22:00.000Z", parts: "腕", exercise: "スカルクラッシャー", set: 2, rep: 10, weight: 26, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
  { id: "demo-w-046", created: "2026-04-12T10:25:00.000Z", parts: "腕", exercise: "スカルクラッシャー", set: 3, rep: 9, weight: 26, goal: 12, memo: "", negative: false, warmup: false, hasRebound: false, notStable: false },
];

export const DEMO_MEALS: MealEntry[] = [
  // 04/07 (Mon)
  { id: "demo-m-001", date: "2026-04-07", name: "オートミール + プロテイン", kcal: 300, protein: 30, fat: 8, carb: 35 },
  { id: "demo-m-002", date: "2026-04-07", name: "チキンサラダ", kcal: 350, protein: 28, fat: 12, carb: 30 },
  { id: "demo-m-003", date: "2026-04-07", name: "鶏胸肉のソテー + 白米 + ブロッコリー", kcal: 550, protein: 45, fat: 10, carb: 55 },
  { id: "demo-m-004", date: "2026-04-07", name: "プロテインシェイク", kcal: 120, protein: 25, fat: 2, carb: 5 },
  // 04/08 (Tue)
  { id: "demo-m-005", date: "2026-04-08", name: "白米 + 納豆 + 味噌汁", kcal: 380, protein: 18, fat: 7, carb: 60 },
  { id: "demo-m-006", date: "2026-04-08", name: "チキンカツカレー", kcal: 750, protein: 35, fat: 22, carb: 90 },
  { id: "demo-m-007", date: "2026-04-08", name: "サバ塩焼き + 野菜炒め + 白米", kcal: 600, protein: 38, fat: 18, carb: 58 },
  // 04/09 (Wed)
  { id: "demo-m-008", date: "2026-04-09", name: "食パン + ゆで卵 + ヨーグルト", kcal: 350, protein: 22, fat: 10, carb: 42 },
  { id: "demo-m-009", date: "2026-04-09", name: "ざるそば", kcal: 350, protein: 12, fat: 3, carb: 65 },
  { id: "demo-m-010", date: "2026-04-09", name: "豚しゃぶサラダ + 白米", kcal: 480, protein: 30, fat: 12, carb: 52 },
  { id: "demo-m-011", date: "2026-04-09", name: "プロテインバー", kcal: 200, protein: 20, fat: 8, carb: 18 },
  // 04/10 (Thu)
  { id: "demo-m-012", date: "2026-04-10", name: "オートミール + バナナ + プロテイン", kcal: 420, protein: 32, fat: 8, carb: 58 },
  { id: "demo-m-013", date: "2026-04-10", name: "牛丼（並）", kcal: 680, protein: 22, fat: 18, carb: 90 },
  { id: "demo-m-014", date: "2026-04-10", name: "鶏もも肉の照り焼き + 白米 + サラダ", kcal: 620, protein: 40, fat: 16, carb: 62 },
  { id: "demo-m-015", date: "2026-04-10", name: "プロテインシェイク", kcal: 120, protein: 25, fat: 2, carb: 5 },
  // 04/11 (Fri)
  { id: "demo-m-016", date: "2026-04-11", name: "白米 + 卵焼き + 味噌汁", kcal: 400, protein: 20, fat: 10, carb: 55 },
  { id: "demo-m-017", date: "2026-04-11", name: "チキンサラダ", kcal: 350, protein: 28, fat: 12, carb: 30 },
  { id: "demo-m-018", date: "2026-04-11", name: "マグロ刺身定食", kcal: 580, protein: 42, fat: 8, carb: 68 },
  { id: "demo-m-019", date: "2026-04-11", name: "プロテインシェイク", kcal: 120, protein: 25, fat: 2, carb: 5 },
  // 04/12 (Sat)
  { id: "demo-m-020", date: "2026-04-12", name: "パンケーキ + ヨーグルト", kcal: 450, protein: 18, fat: 14, carb: 58 },
  { id: "demo-m-021", date: "2026-04-12", name: "親子丼", kcal: 650, protein: 32, fat: 16, carb: 78 },
  { id: "demo-m-022", date: "2026-04-12", name: "和牛ステーキ + 野菜 + 白米", kcal: 800, protein: 52, fat: 28, carb: 55 },
  // 04/13 (Sun)
  { id: "demo-m-023", date: "2026-04-13", name: "ヨーグルト + グラノーラ + バナナ", kcal: 380, protein: 12, fat: 8, carb: 62 },
  { id: "demo-m-024", date: "2026-04-13", name: "ラーメン（醤油）", kcal: 700, protein: 28, fat: 22, carb: 85 },
  { id: "demo-m-025", date: "2026-04-13", name: "鶏胸肉の蒸し鶏 + サラダ + 白米", kcal: 520, protein: 42, fat: 6, carb: 58 },
  { id: "demo-m-026", date: "2026-04-13", name: "プロテインシェイク", kcal: 120, protein: 25, fat: 2, carb: 5 },
];

export const DEMO_LIFE_LOGS: LifeLogEntry[] = [
  {
    id: "demo-l-001",
    date: "2026/04/07",
    mood: 4,
    sleepTime: "23:30",
    wakeTime: "07:00",
    weather: "晴れ",
    tempMax: 18,
    tempMin: 10,
    humidity: 45,
    steps: 8200,
    city: "東京",
    consumedKcal: 580,
    moodSelect: "良い",
  },
  {
    id: "demo-l-002",
    date: "2026/04/08",
    mood: 3,
    sleepTime: "00:00",
    wakeTime: "07:30",
    weather: "曇り",
    tempMax: 16,
    tempMin: 9,
    humidity: 60,
    steps: 6500,
    city: "東京",
    consumedKcal: 620,
    moodSelect: "普通",
  },
  {
    id: "demo-l-003",
    date: "2026/04/09",
    mood: 2,
    sleepTime: "01:00",
    wakeTime: "08:00",
    weather: "雨",
    tempMax: 13,
    tempMin: 8,
    humidity: 80,
    steps: 3200,
    city: "東京",
    consumedKcal: 520,
    moodSelect: "疲れ気味",
  },
  {
    id: "demo-l-004",
    date: "2026/04/10",
    mood: 5,
    sleepTime: "23:00",
    wakeTime: "06:30",
    weather: "晴れ",
    tempMax: 20,
    tempMin: 12,
    humidity: 40,
    steps: 9100,
    city: "東京",
    consumedKcal: 680,
    moodSelect: "快調",
  },
  {
    id: "demo-l-005",
    date: "2026/04/11",
    mood: 4,
    sleepTime: "23:30",
    wakeTime: "07:00",
    weather: "晴れ時々曇り",
    tempMax: 19,
    tempMin: 11,
    humidity: 50,
    steps: 7800,
    city: "東京",
    consumedKcal: 600,
    moodSelect: "良い",
  },
  {
    id: "demo-l-006",
    date: "2026/04/12",
    mood: 5,
    sleepTime: "00:30",
    wakeTime: "08:00",
    weather: "晴れ",
    tempMax: 22,
    tempMin: 13,
    humidity: 38,
    steps: 11200,
    city: "東京",
    consumedKcal: 720,
    moodSelect: "快調",
  },
  {
    id: "demo-l-007",
    date: "2026/04/13",
    mood: 3,
    sleepTime: "01:30",
    wakeTime: "09:00",
    weather: "曇り",
    tempMax: 17,
    tempMin: 10,
    humidity: 65,
    steps: 5400,
    city: "東京",
    consumedKcal: 550,
    moodSelect: "普通",
  },
];

export const DEMO_MOOD_OPTIONS: string[] = ["快調", "良い", "普通", "疲れ気味", "眠い"];

export const DEMO_MEAL_ANALYSIS: MealAnalysis = {
  name: "鶏胸肉のサラダ",
  kcal: 350,
  p: 32,
  f: 10,
  c: 28,
};

export function generateDemoId(): string {
  return `demo-new-${Date.now()}`;
}
