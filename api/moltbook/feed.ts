import { moltbook, proxyResponse } from "./_client";

export default async function handler(req: Request) {
  try {
    const url = new URL(req.url);
    const sort = url.searchParams.get("sort") || "new";
    const limit = url.searchParams.get("limit") || "25";
    return proxyResponse(await moltbook(`/feed?sort=${encodeURIComponent(sort)}&limit=${encodeURIComponent(limit)}`));
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : "Moltbook unavailable" }, { status: 500 }); }
}
