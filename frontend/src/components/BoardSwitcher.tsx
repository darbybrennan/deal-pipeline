import { useState, type FormEvent } from "react";
import type { BoardSummary } from "@/lib/api";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/Icons";

type BoardSwitcherProps = {
  boards: BoardSummary[];
  activeId: number;
  onSelect: (id: number) => void;
  onCreate: (title: string) => void;
  onRename: (id: number, title: string) => void;
  onDelete: (id: number) => void;
};

type Editing = { kind: "new" } | { kind: "rename"; id: number } | null;

const iconClass =
  "grid h-8 w-8 place-items-center rounded-lg text-[var(--gray-text)] transition hover:bg-[var(--surface)] hover:text-[var(--navy-dark)] disabled:opacity-30";

export const BoardSwitcher = ({ boards, activeId, onSelect, onCreate, onRename, onDelete }: BoardSwitcherProps) => {
  const [editing, setEditing] = useState<Editing>(null);
  const [title, setTitle] = useState("");
  const active = boards.find((b) => b.id === activeId);

  const start = (next: Editing) => {
    setEditing(next);
    setTitle(next?.kind === "rename" ? (active?.title ?? "") : "");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = title.trim();
    if (!value || !editing) return;
    if (editing.kind === "new") onCreate(value);
    else onRename(editing.id, value);
    setEditing(null);
  };

  if (editing) {
    return (
      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          placeholder={editing.kind === "new" ? "New pipeline name" : "Pipeline name"}
          aria-label="Pipeline name"
          className="w-56 rounded-xl border border-[var(--primary-blue)] px-3 py-1.5 text-sm text-[var(--navy-dark)] outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-[var(--secondary-purple)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
        >
          {editing.kind === "new" ? "Create" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="text-xs font-semibold text-[var(--gray-text)] hover:text-[var(--navy-dark)]"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={activeId}
        onChange={(e) => onSelect(Number(e.target.value))}
        aria-label="Pipeline"
        className="max-w-[240px] rounded-xl border border-[var(--stroke)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--navy-dark)] outline-none focus:border-[var(--primary-blue)]"
      >
        {boards.map((b) => (
          <option key={b.id} value={b.id}>
            {b.title} ({b.deals})
          </option>
        ))}
      </select>
      <button type="button" className={iconClass} onClick={() => start({ kind: "new" })} aria-label="New pipeline" title="New pipeline">
        <PlusIcon />
      </button>
      <button
        type="button"
        className={iconClass}
        onClick={() => start({ kind: "rename", id: activeId })}
        aria-label="Rename pipeline"
        title="Rename pipeline"
      >
        <PencilIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className={`${iconClass} hover:text-red-600`}
        onClick={() => {
          if (active && window.confirm(`Delete "${active.title}" and all its deals?`)) onDelete(activeId);
        }}
        disabled={boards.length <= 1}
        aria-label="Delete pipeline"
        title={boards.length <= 1 ? "You need at least one pipeline" : "Delete pipeline"}
      >
        <TrashIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
