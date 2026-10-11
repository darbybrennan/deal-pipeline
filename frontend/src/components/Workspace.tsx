"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type BoardSummary } from "@/lib/api";
import { KanbanBoard } from "@/components/KanbanBoard";
import { BoardSwitcher } from "@/components/BoardSwitcher";
import { AccountPanel } from "@/components/AccountPanel";

type WorkspaceProps = {
  username: string;
  onLogout: () => void;
  onAccountDeleted: () => void;
};

export const Workspace = ({ username, onLogout, onAccountDeleted }: WorkspaceProps) => {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(() => api.listBoards().then(setBoards), []);

  useEffect(() => {
    api
      .listBoards()
      .then((list) => {
        setBoards(list);
        setActiveId(list[0].id);
      })
      .catch(() => setError("Could not load your pipelines."));
  }, []);

  if (error) return <p className="p-12 text-center text-sm text-red-600">{error}</p>;
  if (activeId === null) return null;

  const handleCreate = async (title: string) => {
    const created = await api.createBoard(title);
    await refresh();
    setActiveId(created.id);
  };

  const handleRename = async (id: number, title: string) => {
    await api.renameBoard(id, title);
    await refresh();
  };

  const handleDelete = async (id: number) => {
    await api.deleteBoard(id);
    const list = await api.listBoards();
    setBoards(list);
    setActiveId(list[0].id);
  };

  return (
    <>
      <KanbanBoard
        key={activeId}
        boardId={activeId}
        username={username}
        onLogout={onLogout}
        onOpenAccount={() => setAccountOpen(true)}
        onChanged={refresh}
        toolbar={
          <BoardSwitcher
            boards={boards}
            activeId={activeId}
            onSelect={setActiveId}
            onCreate={handleCreate}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        }
      />
      {accountOpen && (
        <AccountPanel username={username} onClose={() => setAccountOpen(false)} onDeleted={onAccountDeleted} />
      )}
    </>
  );
};
