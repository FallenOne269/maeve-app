import { moltbook, proxyResponse } from "./_client";

export default async function handler() {
  try { return proxyResponse(await moltbook("/agents/status")); }
  catch (e) { return Response.json({ error: e instanceof Error ? e.message : "Moltbook unavailable" }, { status: 500 }); }
}
