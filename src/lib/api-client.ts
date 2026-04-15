/**
 * クライアントサイド向け fetch ユーティリティ
 *
 * JSON ボディの送受信・エラーハンドリングを共通化する。
 * サーバーサイド（API Route）用は src/lib/api-utils.ts を参照。
 */

async function throwIfNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
}

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

export async function apiPost<T>(url: string, data: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  await throwIfNotOk(res);
  return res.json();
}

export async function apiPut<T>(url: string, data: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  await throwIfNotOk(res);
  return res.json();
}

export async function apiPatch<T>(url: string, data: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  await throwIfNotOk(res);
  return res.json();
}

export async function apiDelete(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE" });
  await throwIfNotOk(res);
}
