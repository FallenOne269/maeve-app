/**
 * Dev-only API server that serves the Netlify-style functions from /api
 * using Node's built-in Request/Response (Web API) support.
 * Not used in production — production uses Netlify/Vercel serverless.
 */
import http from "node:http";
import chat from "./api/chat";
import heartbeat from "./api/heartbeat";
import feed from "./api/moltbook/feed";
import post from "./api/moltbook/post";
import status from "./api/moltbook/status";

type Handler = (req: Request) => Promise<Response>;

const routes: Record<string, Handler> = {
  "/api/chat": chat,
  "/api/heartbeat": heartbeat,
  "/api/moltbook/feed": feed,
  "/api/moltbook/post": post,
  "/api/moltbook/status": status,
};

const PORT = 8888;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${PORT}`);

  // Simple health check
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  const handler = routes[url.pathname];
  if (!handler) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  // Read request body
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const body = Buffer.concat(chunks);

  // Build Web API Request
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  const webReq = new Request(url, {
    method: req.method,
    headers,
    body: body.length > 0 ? body : undefined,
  });

  try {
    const webRes = await handler(webReq);

    // Convert response headers
    const respHeaders: Record<string, string> = {};
    webRes.headers.forEach((value, key) => {
      respHeaders[key] = value;
    });

    res.writeHead(webRes.status, respHeaders);

    // Stream the response body (important for SSE streaming)
    if (webRes.body) {
      const reader = webRes.body.getReader();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
    }
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : "Server error" }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`API dev server listening on http://0.0.0.0:${PORT}`);
});
