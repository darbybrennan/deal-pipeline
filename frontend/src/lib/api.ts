import type { BoardData } from "@/lib/kanban";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatResult = { reply: string; board: BoardData | null };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? res.statusText);
  }
  return res.json();
};

export const api = {
  login: (username: string, password: string) =>
    request<{ username: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  me: () => request<{ username: string }>("/api/auth/me"),
  getBoard: () => request<BoardData>("/api/board"),
  saveBoard: (board: BoardData) =>
    request<BoardData>("/api/board", { method: "PUT", body: JSON.stringify(board) }),
  chat: (message: string, history: ChatMessage[]) =>
    request<ChatResult>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
};
