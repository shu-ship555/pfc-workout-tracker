export type MealAnalysis = {
  name: string;
  kcal: number;
  p: number;
  f: number;
  c: number;
};

const MODEL = "gemini-2.5-flash";

function friendlyMessageForStatus(status: number): string {
  if (status === 400) return "入力内容を認識できませんでした。別の画像やテキストでお試しください。";
  if (status === 401 || status === 403) return "AI解析サービスの認証に失敗しました。時間をおいて再度お試しください。";
  if (status === 404) return "AI解析モデルが利用できません。時間をおいて再度お試しください。";
  if (status === 408 || status === 504) return "AI解析がタイムアウトしました。もう一度お試しください。";
  if (status === 413) return "画像サイズが大きすぎます。もう少し小さい画像でお試しください。";
  if (status === 429) return "アクセスが集中しています。少し待ってから再度お試しください。";
  if (status >= 500) return "AI解析サービスで一時的な問題が発生しています。時間をおいて再度お試しください。";
  return "AI解析に失敗しました。もう一度お試しください。";
}

async function callGemini(parts: unknown[]): Promise<MealAnalysis> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("AI解析サービスが利用できません。管理者にお問い合わせください。");

  let res: Response;
  try {
    res = await fetch(
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
  } catch {
    throw new Error("ネットワークに接続できませんでした。通信環境を確認してもう一度お試しください。");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Gemini API error ${res.status}: ${body}`);
    throw new Error(friendlyMessageForStatus(res.status));
  }

  try {
    const json = await res.json();
    const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("empty response");
    return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
  } catch (e) {
    console.error("Gemini response parse error:", e);
    throw new Error("AIの応答を解釈できませんでした。別の内容でお試しください。");
  }
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
