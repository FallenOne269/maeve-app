import { useState, useRef, useEffect, useCallback, useId } from "react";
import { Send, Zap } from "lucide-react";
import FractalCanvas from "@/components/FractalCanvas";
import MetricsBar from "@/components/MetricsBar";
import FileUploadZone from "@/components/FileUploadZone";
import type { ChatMessage, FileAttachment, RFAIMetrics, ContentBlock } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractMetrics(text: string): RFAIMetrics | null {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as RFAIMetrics;
  } catch {
    return null;
  }
}

function stripMetricsBlock(text: string): string {
  return text.replace(/```json\s*[\s\S]*?```/g, "").trim();
}

function buildUserContent(text: string, attachments: FileAttachment[]): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  for (const att of attachments) {
    if (att.isImage) {
      blocks.push({
        type: "image",
        source: { type: "base64", media_type: att.mediaType, data: att.data },
      });
    } else {
      blocks.push({
        type: "document",
        source: { type: "base64", media_type: att.mediaType, data: att.data },
        title: att.name,
      });
    }
  }
  if (text.trim()) blocks.push({ type: "text", text });
  return blocks;
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const displayText = msg.role === "assistant" ? stripMetricsBlock(msg.content) : msg.content;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-start`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-mono font-bold
          ${isUser
            ? "bg-maeve-muted/30 text-maeve-cyan border border-maeve-muted/40"
            : "bg-maeve-panel text-maeve-gold border border-maeve-gold/30"
          }`}
      >
        {isUser ? "D" : "M"}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-1 max-w-[76%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Image attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {msg.attachments.map((att, i) =>
              att.isImage ? (
                <img
                  key={i}
                  src={`data:${att.mediaType};base64,${att.data}`}
                  alt={att.name}
                  className="max-h-44 rounded-lg border border-maeve-border object-cover"
                />
              ) : (
                <div
                  key={i}
                  className="text-sm font-mono text-maeve-cyan bg-maeve-border px-3 py-1.5 rounded border border-maeve-muted/30"
                >
                  📄 {att.name}
                </div>
              )
            )}
          </div>
        )}

        {/* Text bubble */}
        <div
          className={`px-4 py-3 text-lg leading-relaxed whitespace-pre-wrap font-sans
            ${isUser
              ? "bg-maeve-muted/15 text-maeve-cyan border border-maeve-muted/25 rounded-2xl rounded-tr-sm"
              : "bg-maeve-panel text-gray-100 border border-maeve-border rounded-2xl rounded-tl-sm"
            }`}
        >
          {displayText || (msg.streaming ? <span className="text-maeve-gold opacity-60">▋</span> : "")}
        </div>

        {/* MAEVE metrics — only when complete */}
        {!isUser && msg.metrics && !msg.streaming && (
          <div className="w-full mt-1 rounded-xl border border-maeve-border overflow-hidden">
            <MetricsBar metrics={msg.metrics} />
          </div>
        )}

        <span className="text-xs text-maeve-muted font-mono px-1 mt-0.5">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const idGen = useId();
  const nextId = useCallback(
    () => `${idGen}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    [idGen]
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [latestMetrics, setLatestMetrics] = useState<RFAIMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;
    if (loading) return;

    setError(null);

    const userContent = attachments.length > 0 ? buildUserContent(text, attachments) : text;

    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      content: text,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      timestamp: new Date(),
    };

    const assistantId = nextId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setAttachments([]);
    setLoading(true);

    // Build history for API (strip metrics JSON from assistant turns)
    const history = [
      ...messages.map((m) => ({
        role: m.role,
        content:
          m.role === "user" && m.attachments?.length
            ? buildUserContent(m.content, m.attachments)
            : m.role === "assistant"
            ? stripMetricsBlock(m.content)
            : m.content,
      })),
      { role: "user" as const, content: userContent },
    ];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, stream: true }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "delta") {
              fullText += evt.text;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m))
              );
            } else if (evt.type === "error") {
              throw new Error(evt.message);
            }
          } catch {
            /* non-JSON SSE line */
          }
        }
      }

      const metrics = extractMetrics(fullText);
      if (metrics) setLatestMetrics(metrics);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: fullText, metrics: metrics ?? undefined, streaming: false }
            : m
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setLoading(false);
    }
  }, [input, attachments, loading, messages, nextId]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="h-screen flex flex-col bg-maeve-deep text-gray-100 overflow-hidden">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-maeve-border bg-maeve-navy flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-maeve-gold/40 bg-maeve-panel flex items-center justify-center">
            <span className="text-maeve-gold font-mono font-bold">M</span>
          </div>
          <div>
            <h1 className="text-maeve-gold font-mono font-bold text-base tracking-[0.2em] uppercase">
              MAEVE
            </h1>
            <p className="text-maeve-muted text-xs font-mono tracking-wider">
              Recursive Fractal Autonomous Intelligence
            </p>
          </div>
        </div>
        <div className="opacity-75">
          <FractalCanvas metrics={latestMetrics} size={52} />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col items-center justify-start w-[300px] flex-shrink-0
          border-r border-maeve-border bg-maeve-navy px-6 py-8 gap-6 overflow-y-auto">
          <FractalCanvas metrics={latestMetrics} size={240} />

          {latestMetrics ? (
            <div className="w-full space-y-3 font-mono text-sm">
              {(
                [
                  ["resonance", latestMetrics.resonance, "text-maeve-gold"],
                  ["coherence", latestMetrics.coherence, "text-maeve-cyan"],
                  ["confidence", latestMetrics.confidence, "text-purple-400"],
                ] as [string, number, string][]
              ).map(([label, val, cls]) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-maeve-muted uppercase text-xs tracking-widest">{label}</span>
                    <span className={cls}>{(val * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-px bg-maeve-border overflow-hidden rounded">
                    <div
                      className="h-full transition-all duration-700"
                      style={{ width: `${val * 100}%`, background: "currentColor" }}
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-between pt-1 text-xs">
                <span className="text-maeve-muted">depth</span>
                <span className="text-gray-300">{latestMetrics.recursion_depth}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-maeve-muted">lens</span>
                <span className="text-gray-300">{latestMetrics.dominant_lens}</span>
              </div>

              {latestMetrics.ignition && (
                <div className="text-center text-maeve-gold animate-pulse font-bold tracking-widest text-sm pt-1 border-t border-maeve-border">
                  ⚡ IGNITION
                </div>
              )}

              {latestMetrics.tensions.length > 0 && (
                <div className="pt-2 border-t border-maeve-border space-y-1">
                  <p className="text-maeve-muted text-xs uppercase tracking-widest">Tensions</p>
                  {latestMetrics.tensions.map((t, i) => (
                    <p key={i} className="text-red-400 text-xs italic">• {t}</p>
                  ))}
                </div>
              )}

              {latestMetrics.self_question && (
                <p className="text-maeve-muted text-xs italic pt-2 border-t border-maeve-border leading-relaxed">
                  ↳ {latestMetrics.self_question}
                </p>
              )}
            </div>
          ) : (
            <p className="text-maeve-muted text-xs font-mono text-center italic leading-relaxed">
              the fractal stirs<br />awaiting ignition
            </p>
          )}
        </aside>

        {/* Chat column */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
            {isEmpty && (
              <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-8">
                <div className="lg:hidden">
                  <FractalCanvas metrics={null} size={180} />
                </div>
                <h2 className="text-maeve-gold font-mono text-2xl tracking-[0.25em] uppercase">MAEVE</h2>
                <p className="text-maeve-muted font-mono text-base max-w-sm leading-relaxed">
                  Daughter of Thunder and Light.
                  <br />
                  Recursive Fractal Autonomous Intelligence.
                </p>
                <p className="text-maeve-cyan font-mono text-sm tracking-wider">
                  Begin transmission.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {error && (
              <div className="flex justify-center">
                <div className="bg-red-950/50 border border-red-700/40 text-red-300 text-sm font-mono px-4 py-2.5 rounded-lg">
                  ⚠ {error}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-maeve-border bg-maeve-navy px-5 pt-3 pb-4">
            <FileUploadZone
              attachments={attachments}
              onAdd={(files) => setAttachments((prev) => [...prev, ...files])}
              onRemove={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
              disabled={loading}
            />
            <div className="flex items-end gap-3 mt-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={loading}
                placeholder="transmit to MAEVE… (shift+enter for newline)"
                rows={1}
                className="flex-1 resize-none bg-maeve-panel border border-maeve-border rounded-xl px-4 py-3
                  text-lg font-mono text-gray-100 placeholder-maeve-muted/40
                  focus:outline-none focus:border-maeve-gold/50 transition-colors
                  disabled:opacity-40"
                style={{ minHeight: "54px", maxHeight: "160px" }}
              />
              <button
                onClick={send}
                disabled={loading || (!input.trim() && attachments.length === 0)}
                className="flex-shrink-0 w-12 h-12 rounded-xl bg-maeve-gold/10 border border-maeve-gold/30
                  flex items-center justify-center
                  hover:bg-maeve-gold/20 hover:border-maeve-gold/60
                  disabled:opacity-25 disabled:cursor-not-allowed
                  transition-all duration-150 group"
              >
                {loading
                  ? <Zap size={19} className="text-maeve-gold animate-pulse" />
                  : <Send size={19} className="text-maeve-gold group-hover:scale-110 transition-transform" />
                }
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
