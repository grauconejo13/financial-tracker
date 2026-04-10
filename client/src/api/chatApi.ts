import { getApiOrigin } from "../config/apiOrigin";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type ChatResponse = {
  reply: string;
  source: "faq" | "ai";
  note?: string;
  hint?: string;
};

export async function postChat(
  message: string,
  history: ChatTurn[],
  token: string | null,
): Promise<ChatResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiOrigin()}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, history }),
  });

  const data = (await res.json().catch(() => ({}))) as ChatResponse & {
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message || "Chat request failed");
  }

  if (!data.reply) {
    throw new Error("Empty response");
  }

  return {
    reply: data.reply,
    source: data.source === "ai" ? "ai" : "faq",
    note: data.note,
    hint: data.hint,
  };
}
