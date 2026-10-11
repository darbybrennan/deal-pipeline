import type { BoardData } from "@/lib/kanban";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatResult = { reply: string; board: BoardData | null };
export type BoardSummary = { id: number; title: string; deals: number };

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

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const api = {
  login: (username: string, password: string) =>
    request<{ username: string }>("/api/auth/login", json("POST", { username, password })),
  register: (username: string, password: string) =>
    request<{ username: string }>("/api/auth/register", json("POST", { username, password })),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  me: () => request<{ username: string }>("/api/auth/me"),
  changePassword: (current_password: string, new_password: string) =>
    request<{ ok: boolean }>("/api/auth/password", json("POST", { current_password, new_password })),
  deleteAccount: (password: string) =>
    request<{ ok: boolean }>("/api/auth/account", json("DELETE", { password })),
  listBoards: () => request<BoardSummary[]>("/api/boards"),
  createBoard: (title: string) => request<BoardSummary>("/api/boards", json("POST", { title })),
  renameBoard: (id: number, title: string) =>
    request<{ ok: boolean }>(`/api/boards/${id}`, json("PATCH", { title })),
  deleteBoard: (id: number) => request<{ ok: boolean }>(`/api/boards/${id}`, { method: "DELETE" }),
  getBoard: (id: number) => request<BoardData>(`/api/boards/${id}/data`),
  saveBoard: (id: number, board: BoardData) =>
    request<BoardData>(`/api/boards/${id}/data`, json("PUT", board)),
  chat: (id: number, message: string, history: ChatMessage[]) =>
    request<ChatResult>(`/api/boards/${id}/chat`, json("POST", { message, history })),
};
