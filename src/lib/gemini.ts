export type MealAnalysis = {
  name: string;
  kcal: number;
  p: number;
  f: number;
  c: number;
};

const MODEL = "gemini-2.5-flash";

async function callGemini(parts: unknown[]): Promise<MealAnalysis> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { response_mime_type: "application/json" },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const text: string = json.candidates[0].content.parts[0].text;
  return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
}

export async function analyzeText(text: string): Promise<MealAnalysis> {
  return callGemini([
    {
      text: `${text} のカロリーとPFCを推測しJSONで回答して。形式：{"name":"料理名", "kcal":0, "p":0, "f":0, "c":0}`,
    },
  ]);
}

export async function analyzeImage(
  base64: string,
  mimeType: string
): Promise<MealAnalysis> {
  return callGemini([
    {
      text: "この画像から料理名、kcal, p, f, cを推測しJSON形式で答えて。キーは name, kcal, p, f, c。数値は必ず半角数字。量が不明確でも0にはせず、一般的な量で必ず数値を推定して入れてください。",
    },
    { inline_data: { mime_type: mimeType, data: base64 } },
  ]);
}

export async function refineWithContext(
  prev: MealAnalysis,
  supplement: string
): Promise<MealAnalysis> {
  return callGemini([
    {
      text: `以下のJSONデータは画像から推定された食事データです: ${JSON.stringify(prev)}\nユーザーから補足情報がありました: 「${supplement}」\nこの補足情報を加味して、料理名、カロリー、PFCを修正・再計算してください。JSON形式のみで出力してください。キーは name, kcal, p, f, c`,
    },
  ]);
}
