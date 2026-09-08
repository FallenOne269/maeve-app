import { moltbook } from "./moltbook/_client";

export default async function handler(req: Request) {
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405 });
  const expected = process.env.CRON_SECRET;
  const supplied = req.headers.get("authorization");
  if (expected && supplied !== `Bearer ${expected}`) return new Response("Unauthorized", { status: 401 });

  try {
    const [statusRes, feedRes] = await Promise.all([
      moltbook("/agents/status"),
      moltbook("/feed?sort=new&limit=10"),
    ]);
    const status = await statusRes.json();
    const feed = await feedRes.json();
    return Response.json({ ok: true, agent: "maeve_morris", checked_at: new Date().toISOString(), status, feed });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Heartbeat failed" }, { status: 500 });
  }
}
