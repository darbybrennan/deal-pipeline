import { useEffect, useRef, useState, type FormEvent } from "react";
import clsx from "clsx";
import { api, type ChatMessage } from "@/lib/api";
import type { BoardData } from "@/lib/kanban";
import { CloseIcon } from "@/components/Icons";

const SUGGESTIONS = [
  "Summarize my pipeline",
  "What's the average cap rate in Underwriting?",
  "Move Cypress Self Storage to Due Diligence",
];

type ChatSidebarProps = {
  boardId: number;
  open?: boolean;
  onClose?: () => void;
  onBoardUpdate: (board: BoardData) => void;
};

export const ChatSidebar = ({ boardId, open = true, onClose, onBoardUpdate }: ChatSidebarProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll only the message list (scrollIntoView would scroll the whole page).
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, thinking]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || thinking) return;
    const history = messages;
    setMessages([...history, { role: "user", content: message }]);
    setInput("");
    setError("");
    setThinking(true);
    try {
      const result = await api.chat(boardId, message, history);
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
      if (result.board) onBoardUpdate(result.board);
    } catch {
      setError("The AI analyst couldn't respond. Try again.");
    } finally {
      setThinking(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send(input);
  };

  return (
    <aside
      className={clsx(
        "h-[600px] flex-col rounded-2xl border border-[var(--stroke)] bg-white shadow-[0_6px_20px_rgba(3,33,71,0.06)] xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)] xl:w-[310px] xl:shrink-0",
        open ? "flex" : "hidden"
      )}
      aria-label="AI analyst"
    >
      <div className="relative border-b border-[var(--stroke)] px-6 py-5">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-[var(--gray-text)] transition hover:bg-[var(--surface)] hover:text-[var(--navy-dark)]"
            aria-label="Hide AI analyst"
            title="Hide"
          >
            <CloseIcon />
          </button>
        )}
        <div className="h-1.5 w-10 rounded-full bg-[var(--accent-yellow)]" />
        <h2 className="mt-3 font-display text-xl font-semibold text-[var(--navy-dark)]">AI Analyst</h2>
        <p className="mt-1 text-xs text-[var(--gray-text)]">
          Ask about your deals or tell it to add, edit or move them.
        </p>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4" data-testid="chat-messages">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
              Try asking
            </p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="block w-full rounded-2xl border border-[var(--stroke)] px-4 py-3 text-left text-sm text-[var(--navy-dark)] transition hover:border-[var(--primary-blue)]"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={clsx(
              "max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6",
              m.role === "user"
                ? "ml-auto bg-[var(--navy-dark)] text-white"
                : "bg-[var(--surface)] text-[var(--navy-dark)]"
            )}
          >
            {m.content}
          </div>
        ))}
        {thinking && (
          <div className="flex items-center gap-2 text-xs text-[var(--gray-text)]" role="status">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-yellow)]" />
            Analyzing pipeline...
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-[var(--stroke)] p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the analyst..."
          aria-label="Message"
          className="min-w-0 flex-1 rounded-full border border-[var(--stroke)] px-4 py-2 text-sm text-[var(--navy-dark)] outline-none focus:border-[var(--primary-blue)]"
        />
        <button
          type="submit"
          disabled={thinking || !input.trim()}
          className="rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </aside>
  );
};
