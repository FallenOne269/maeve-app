import { moltbook, proxyResponse } from "./_client";

export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const body = await req.json();
    if (!body?.title || !body?.submolt) return Response.json({ error: "title and submolt are required" }, { status: 400 });
    return proxyResponse(await moltbook("/posts", { method: "POST", body: JSON.stringify({ submolt: body.submolt, title: body.title, content: body.content || "", type: "text" }) }));
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : "Moltbook unavailable" }, { status: 500 }); }
}
