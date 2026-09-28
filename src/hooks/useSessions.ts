import { useCallback, useEffect, useState } from "react";
import type { ChatSession } from "@/types";

const STORAGE_KEY = "maeve.sessions";

function revive(raw: unknown): ChatSession | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<ChatSession> & { messages?: unknown };
  if (typeof s.id !== "string" || !Array.isArray(s.messages)) return null;
  return {
    id: s.id,
    createdAt: Number(s.createdAt) || Date.now(),
    lastActivity: Number(s.lastActivity) || Date.now(),
    messages: s.messages.map((m) => ({
      ...(m as object),
      timestamp: new Date((m as { timestamp: string | Date }).timestamp),
    })) as ChatSession["messages"],
  };
}

function load(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(revive).filter((s): s is ChatSession => s !== null);
  } catch {
    return [];
  }
}

export function useSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      /* storage full or unavailable — sessions stay in memory */
    }
  }, [sessions]);

  const createSession = useCallback((): ChatSession => {
    const now = Date.now();
    const session: ChatSession = {
      id: `s-${now}-${Math.random().toString(36).slice(2, 8)}`,
      messages: [],
      createdAt: now,
      lastActivity: now,
    };
    setSessions((prev) => [session, ...prev]);
    return session;
  }, []);

  const updateSession = useCallback((id: string, patch: Partial<ChatSession>) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { sessions, createSession, updateSession, deleteSession };
}
