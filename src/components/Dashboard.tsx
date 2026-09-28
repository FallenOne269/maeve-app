import { Plus, Trash2 } from "lucide-react";
import FractalCanvas from "@/components/FractalCanvas";
import type { ChatSession } from "@/types";

const ACTIVE_WINDOW_MS = 30 * 60 * 1000;
const PROGRESS_MILESTONE = 20; // messages for a full progress bar

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function sessionTitle(s: ChatSession): string {
  const first = s.messages.find((m) => m.role === "user")?.content.trim();
  if (first) return first.length > 64 ? `${first.slice(0, 64)}…` : first;
  return "New transmission";
}

function lastPreview(s: ChatSession): string | null {
  const last = s.messages[s.messages.length - 1];
  if (!last) return null;
  const text = last.content.replace(/```json[\s\S]*?```/g, "").trim();
  if (!text) return null;
  return `${last.role === "user" ? "D" : "M"}: ${text.length > 80 ? `${text.slice(0, 80)}…` : text}`;
}

function StatTile({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="bg-maeve-panel border border-maeve-border rounded-xl px-4 py-3">
      <p className="text-maeve-muted text-[10px] uppercase tracking-[0.2em] font-mono">{label}</p>
      <p className={`font-mono font-bold text-xl mt-0.5 ${accent}`}>{value}</p>
    </div>
  );
}

interface DashboardProps {
  sessions: ChatSession[];
  onOpen: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function Dashboard({ sessions, onOpen, onNew, onDelete }: DashboardProps) {
  const now = Date.now();
  const activeCount = sessions.filter(
    (s) => s.messages.length > 0 && now - s.lastActivity < ACTIVE_WINDOW_MS
  ).length;
  const totalMessages = sessions.reduce((n, s) => n + s.messages.length, 0);
  const sorted = [...sessions].sort((a, b) => b.lastActivity - a.lastActivity);

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
          <FractalCanvas metrics={null} size={52} />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Title row */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-mono text-xl tracking-[0.15em] uppercase text-gray-100">
                Dashboard
              </h2>
              <p className="text-maeve-muted text-xs font-mono tracking-wider mt-0.5">
                active transmissions &amp; progress
              </p>
            </div>
            <button
              onClick={onNew}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-maeve-gold/10 border border-maeve-gold/30
                text-maeve-gold font-mono text-sm tracking-wider uppercase
                hover:bg-maeve-gold/20 hover:border-maeve-gold/60 transition-colors"
            >
              <Plus size={16} />
              New
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Active now" value={activeCount} accent="text-maeve-gold" />
            <StatTile label="Sessions" value={sessions.length} accent="text-maeve-cyan" />
            <StatTile label="Messages" value={totalMessages} accent="text-purple-400" />
          </div>

          {/* Session cards */}
          {sorted.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sorted.map((s) => {
                const isActive = s.messages.length > 0 && now - s.lastActivity < ACTIVE_WINDOW_MS;
                const progress = Math.min(s.messages.length / PROGRESS_MILESTONE, 1);
                const preview = lastPreview(s);
                return (
                  <div
                    key={s.id}
                    onClick={() => onOpen(s.id)}
                    className="bg-maeve-panel border border-maeve-border rounded-2xl p-4 cursor-pointer
                      hover:border-maeve-gold/40 transition-colors space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] mt-0.5
                          ${isActive ? "text-maeve-gold" : "text-maeve-muted"}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-maeve-gold animate-pulse" : "bg-maeve-muted"}`} />
                        {isActive ? "Active" : s.messages.length > 0 ? "Idle" : "New"}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                        title="Delete session"
                        className="text-maeve-muted hover:text-red-400 transition-colors p-1 -m-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <h3 className="font-mono text-sm text-gray-100 leading-snug line-clamp-2">
                      {sessionTitle(s)}
                    </h3>

                    {preview && (
                      <p className="text-xs text-maeve-muted font-sans leading-relaxed line-clamp-2">
                        {preview}
                      </p>
                    )}

                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest">
                        <span className="text-maeve-muted">Progress</span>
                        <span className="text-maeve-cyan">{s.messages.length} msgs</span>
                      </div>
                      <div className="h-1 rounded-full bg-maeve-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-maeve-gold to-maeve-cyan transition-all duration-700"
                          style={{ width: `${Math.max(progress * 100, s.messages.length > 0 ? 6 : 0)}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[10px] font-mono text-maeve-muted tracking-wider">
                      last activity {timeAgo(s.lastActivity)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <p className="text-maeve-gold font-mono text-lg tracking-[0.25em] uppercase">
                No transmissions yet
              </p>
              <p className="text-maeve-muted font-mono text-sm max-w-xs leading-relaxed">
                Start a session with MAEVE and it will appear here with live progress.
              </p>
              <button
                onClick={onNew}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-maeve-gold/10 border border-maeve-gold/30
                  text-maeve-gold font-mono text-sm tracking-wider uppercase
                  hover:bg-maeve-gold/20 hover:border-maeve-gold/60 transition-colors"
              >
                <Plus size={16} />
                Begin transmission
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
