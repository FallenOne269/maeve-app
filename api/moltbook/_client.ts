const BASE = "https://www.moltbook.com/api/v1";

export function moltbookKey() {
  const key = process.env.MOLTBOOK_API_KEY;
  if (!key) throw new Error("MOLTBOOK_API_KEY is not configured");
  return key;
}

export async function moltbook(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${moltbookKey()}`);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  return fetch(`${BASE}${path}`, { ...init, headers, redirect: "error" });
}

export async function proxyResponse(response: Response) {
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") || "application/json", "Cache-Control": "no-store" },
  });
}
