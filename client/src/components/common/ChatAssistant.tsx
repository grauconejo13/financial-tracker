import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { HiXMark, HiPaperAirplane } from "react-icons/hi2";
import { useAuth } from "../../context/AuthContext";
import { postChat, type ChatTurn } from "../../api/chatApi";

/** Friendly robot-in-bubble artwork (public asset). */
const CHATBOT_IMG = "/chatbot-assistant.png";

/** Short labels + full questions sent to Trumpbot (FAQ quick picks). */
const FAQ_SUGGESTIONS = [
  { label: "Transactions", query: "How do I add, filter, or delete transactions?" },
  { label: "Budget", query: "How does the budget feature work?" },
  { label: "Debts & savings", query: "How do I track debts and savings goals?" },
  { label: "Accountability", query: "What is accountability history and how do reasons work?" },
  { label: "Profile & 2FA", query: "How do I update my profile, password, or two-factor login?" },
  { label: "Ghost spending", query: "What is Ghost spending for?" },
  { label: "Live site issues", query: "My deployed app has errors or blank page on Vercel" },
] as const;

function formatReply(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) {
      return <strong key={i}>{m[1]}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatAssistant() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || loading) return;

      setError(null);
      setInput("");

      const priorHistory = messages;
      const userTurn: ChatTurn = { role: "user", content: text };
      setMessages((prev) => [...prev, userTurn]);
      setLoading(true);

      try {
        const { reply } = await postChat(text, priorHistory, token);
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setMessages((prev) => prev.slice(0, -1));
        setInput(text);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, token],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <>
      <button
        type="button"
        className="cp-chat-fab btn rounded-circle cp-chat-fab-bot"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="cp-chat-panel"
        aria-label={open ? "Close Trumpbot" : "Open Trumpbot"}
      >
        {open ? (
          <HiXMark size={26} strokeWidth={2} aria-hidden className="cp-chat-fab-close-icon" />
        ) : (
          <img
            src={CHATBOT_IMG}
            alt=""
            width={800}
            height={800}
            decoding="async"
            draggable={false}
            className="cp-chat-fab-bot-img"
          />
        )}
      </button>

      {open && (
        <div
          id="cp-chat-panel"
          className="cp-chat-panel shadow-lg border d-flex flex-column"
          role="dialog"
          aria-label="Trumpbot — ClearPath help chat"
        >
          <div className="cp-chat-header d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <span className="cp-chat-header-icon d-flex align-items-center justify-content-center rounded-3 overflow-hidden">
                <img
                  src={CHATBOT_IMG}
                  alt=""
                  width={800}
                  height={800}
                  decoding="async"
                  draggable={false}
                  className="cp-chat-header-bot-img"
                />
              </span>
              <div>
                <div className="fw-bold small">Trumpbot</div>
                <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                  {token ? "FAQ + optional AI when configured" : "Quick answers about ClearPath"}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-link text-muted p-0"
              onClick={() => setOpen(false)}
              aria-label="Close Trumpbot"
            >
              <HiXMark size={22} strokeWidth={2} />
            </button>
          </div>

          <div ref={listRef} className="cp-chat-messages flex-grow-1 px-3 py-2">
            {messages.length === 0 && !loading && (
              <p className="text-muted small mb-2">
                Pick a topic below or type your own question.{" "}
                {!token && (
                  <span className="d-block mt-1" style={{ fontSize: "0.72rem" }}>
                    Log in for AI replies when your server has <code>OPENAI_API_KEY</code>.
                  </span>
                )}
              </p>
            )}
            {messages.map((m, idx) => (
              <div
                key={`${idx}-${m.role}`}
                className={`cp-chat-bubble mb-2 ${m.role === "user" ? "cp-chat-bubble-user" : "cp-chat-bubble-bot"}`}
              >
                <div className="small cp-chat-bubble-inner">
                  {m.role === "assistant" ? formatReply(m.content) : m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-muted small py-1" aria-live="polite">
                Thinking…
              </div>
            )}
            {error && <div className="alert alert-danger py-1 px-2 small mb-0">{error}</div>}
          </div>

          <div className="cp-chat-faq border-top px-3 py-2">
            <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.06em" }}>
              Suggested questions
            </div>
            <div className="d-flex flex-wrap gap-1">
              {FAQ_SUGGESTIONS.map(({ label, query }) => (
                <button
                  key={label}
                  type="button"
                  className="btn btn-sm cp-chat-faq-chip"
                  disabled={loading}
                  onClick={() => void sendMessage(query)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="cp-chat-input border-top p-2">
            <div className="input-group input-group-sm">
              <textarea
                className="form-control cp-chat-textarea"
                rows={2}
                placeholder="Or type your question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={loading}
                aria-label="Message"
              />
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center justify-content-center px-3"
                onClick={() => void sendMessage(input)}
                disabled={loading || !input.trim()}
                aria-label="Send"
              >
                <HiPaperAirplane size={18} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
