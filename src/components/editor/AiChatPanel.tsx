import { useEffect, useRef, useState } from "react";
import { Bot, Send, User, Sparkles, X, LoaderCircle } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import {
  fetchProjectChats,
  saveChatMessage,
  subscribeToProjectChats,
  generateAiResponse,
  type ChatMessage,
} from "../../services/supabaseChatService";

interface AiChatPanelProps {
  projectId: string;
  activeFileName?: string;
  activeFileContent?: string;
  onClose: () => void;
}

export function AiChatPanel({
  projectId,
  activeFileName,
  activeFileContent,
  onClose,
}: AiChatPanelProps) {
  const { userId, username } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = userId || "dev-user";
  const currentUsername = username || "Developer";

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initChats() {
      setIsFetching(true);
      const initialChats = await fetchProjectChats(projectId);
      setMessages(initialChats);
      setIsFetching(false);

      unsubscribe = subscribeToProjectChats(projectId, (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      });
    }

    void initChats();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSend() {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isLoading) return;

    setPrompt("");
    setIsLoading(true);

    // Save user prompt
    const userMsg = await saveChatMessage(
      projectId,
      currentUserId,
      currentUsername,
      "user",
      cleanPrompt
    );

    setMessages((prev) => [...prev, userMsg]);

    // Generate AI response
    const aiText = await generateAiResponse(
      cleanPrompt,
      activeFileName,
      activeFileContent
    );

    // Save AI response
    const aiMsg = await saveChatMessage(
      projectId,
      "ai-system",
      "Contri AI",
      "model",
      aiText
    );

    setMessages((prev) => [...prev, aiMsg]);
    setIsLoading(false);
  }

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-[var(--color-border)] bg-[#151515]">
      {/* HEADER */}
      <div className="flex h-10 items-center justify-between border-b border-[var(--color-border)] px-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-[var(--color-text-primary)]">
          <Sparkles className="h-4 w-4 text-[var(--color-secondary)]" />
          <span>SHARED AI WORKSPACE</span>
        </div>

        <button
          onClick={onClose}
          className="cursor-pointer bg-transparent text-[var(--color-text-muted)] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* CONTEXT BANNER */}
      <div className="border-b border-[var(--color-border)] bg-[#101010] p-3 text-[10px]">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[var(--color-text-muted)]">ACTIVE CONTEXT</span>
          <span className="rounded bg-[#2b2348] px-2 py-0.5 text-[9px] font-mono text-[#b9a7ff]">
            {activeFileName || "No File Open"}
          </span>
        </div>
      </div>

      {/* MESSAGES LIST */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-3">
        {isFetching ? (
          <div className="flex items-center justify-center py-10 text-xs text-[var(--color-text-muted)]">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin text-[var(--color-primary)]" />
            <span>Syncing shared AI history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--color-border)] p-4 text-center text-xs text-[var(--color-text-muted)]">
            <Bot className="mx-auto mb-2 h-6 w-6 text-[var(--color-secondary)]" />
            <p className="font-medium text-white">No AI chats yet</p>
            <p className="mt-1 text-[11px]">
              Ask a question! Prompts & AI answers are stored on Supabase and shared live with collaborators.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg border p-3 text-xs ${
                msg.role === "user"
                  ? "border-[var(--color-border)] bg-[#1e1e1e]"
                  : "border-[#372b68] bg-[#171329]"
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 font-semibold">
                  {msg.role === "user" ? (
                    <>
                      <User className="h-3 w-3 text-[var(--color-primary)]" />
                      <span className="text-[var(--color-text-primary)]">{msg.username}</span>
                    </>
                  ) : (
                    <>
                      <Bot className="h-3 w-3 text-[var(--color-secondary)]" />
                      <span className="text-[#a78bfa]">Contri AI</span>
                    </>
                  )}
                </div>

                <span className="text-[9px] text-[var(--color-text-disabled)]">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="whitespace-pre-wrap font-sans leading-relaxed text-[var(--color-text-primary)]">
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 rounded-lg border border-[#372b68] bg-[#171329] p-3 text-xs text-[#a78bfa]">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            <span>Contri AI is generating response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* PROMPT INPUT */}
      <div className="border-t border-[var(--color-border)] bg-[#101010] p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI about codebase..."
            disabled={isLoading}
            className="h-9 flex-1 rounded-md border border-[var(--color-border)] bg-[#181818] px-3 text-xs text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-secondary)]"
          />

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-hover)] disabled:opacity-40 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
