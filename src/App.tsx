import { useState, useCallback } from "react";
import Dashboard from "@/components/Dashboard";
import ChatView from "@/components/ChatView";
import { useSessions } from "@/hooks/useSessions";
import type { ChatMessage } from "@/types";

export default function App() {
  const { sessions, createSession, updateSession, deleteSession } = useSessions();
  const [openId, setOpenId] = useState<string | null>(null);

  const handleMessagesChange = useCallback(
    (sessionId: string, msgs: ChatMessage[]) => {
      updateSession(sessionId, { messages: msgs, lastActivity: Date.now() });
    },
    [updateSession]
  );

  const handleNew = useCallback(() => {
    const session = createSession();
    setOpenId(session.id);
  }, [createSession]);

  const session = openId ? sessions.find((s) => s.id === openId) : null;

  if (session) {
    return (
      <ChatView
        key={session.id}
        session={session}
        onMessagesChange={(msgs) => handleMessagesChange(session.id, msgs)}
        onBack={() => setOpenId(null)}
      />
    );
  }

  return (
    <Dashboard
      sessions={sessions}
      onOpen={setOpenId}
      onNew={handleNew}
      onDelete={deleteSession}
    />
  );
}
