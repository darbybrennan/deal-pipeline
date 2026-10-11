"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { ChatSidebar } from "@/components/ChatSidebar";
import type { CardDraft } from "@/components/CardEditor";
import { createId, moveCard, type BoardData } from "@/lib/kanban";
import { formatCapRate, formatCurrency, pipelineMetrics } from "@/lib/deals";
import { api } from "@/lib/api";
import { ChatIcon, LogoutIcon, UserIcon } from "@/components/Icons";

const SAVE_DELAY_MS = 400;

// Use whatever is under the pointer; fall back to overlap when the pointer is between targets.
// (closestCorners picked cards in the wrong column on multi-column boards.)
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

type SaveState = "idle" | "saving" | "saved" | "error";

type KanbanBoardProps = {
  boardId: number;
  onLogout: () => void;
  username?: string;
  toolbar?: ReactNode;
  onOpenAccount?: () => void;
  onChanged?: () => void;
};

export const KanbanBoard = ({ boardId, onLogout, username, toolbar, onOpenAccount, onChanged }: KanbanBoardProps) => {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  // True when the latest board change came from the user (needs saving),
  // false when it came from the server (load or AI update).
  const dirty = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  useEffect(() => {
    api
      .getBoard(boardId)
      .then(setBoard)
      .catch(() => setLoadError("Could not load your board."));
  }, [boardId]);

  useEffect(() => {
    if (!board || !dirty.current) return;
    const timer = setTimeout(() => {
      dirty.current = false;
      setSaveState("saving");
      api
        .saveBoard(boardId, board)
        .then(() => {
          setSaveState("saved");
          onChanged?.();
        })
        .catch(() => setSaveState("error"));
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [board, boardId, onChanged]);

  const update = (updater: (prev: BoardData) => BoardData) => {
    dirty.current = true;
    setBoard((prev) => (prev ? updater(prev) : prev));
  };

  const handleServerBoard = (next: BoardData) => {
    dirty.current = false;
    setBoard(next);
    onChanged?.();
  };

  if (loadError) {
    return <p className="p-12 text-center text-sm text-red-600">{loadError}</p>;
  }
  if (!board) {
    return <p className="p-12 text-center text-sm text-[var(--gray-text)]">Loading pipeline...</p>;
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);
    if (!over || active.id === over.id) return;
    update((prev) => ({
      ...prev,
      columns: moveCard(prev.columns, active.id as string, over.id as string),
    }));
  };

  const handleRenameColumn = (columnId: string, title: string) => {
    update((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => (column.id === columnId ? { ...column, title } : column)),
    }));
  };

  const handleAddCard = (columnId: string, draft: CardDraft) => {
    const id = createId("deal");
    update((prev) => ({
      ...prev,
      cards: { ...prev.cards, [id]: { id, ...draft } },
      columns: prev.columns.map((column) =>
        column.id === columnId ? { ...column, cardIds: [...column.cardIds, id] } : column
      ),
    }));
  };

  const handleEditCard = (cardId: string, draft: CardDraft) => {
    update((prev) => ({
      ...prev,
      cards: { ...prev.cards, [cardId]: { id: cardId, ...draft } },
    }));
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
    update((prev) => ({
      ...prev,
      cards: Object.fromEntries(Object.entries(prev.cards).filter(([id]) => id !== cardId)),
      columns: prev.columns.map((column) =>
        column.id === columnId
          ? { ...column, cardIds: column.cardIds.filter((id) => id !== cardId) }
          : column
      ),
    }));
  };

  const activeCard = activeCardId ? board.cards[activeCardId] : null;
  const metrics = pipelineMetrics(board);
  const stats = [
    { label: "Active deals", value: String(metrics.activeDeals) },
    { label: "Active pipeline", value: formatCurrency(metrics.activeValue) },
    { label: "Avg cap rate (active)", value: formatCapRate(metrics.avgCapRate) },
    { label: "Closed volume", value: formatCurrency(metrics.closedValue) },
  ];
  const saveLabel = {
    idle: "",
    saving: "Saving...",
    saved: "All changes saved",
    error: "Save failed - check connection",
  }[saveState];

  const iconButton =
    "grid h-9 w-9 place-items-center rounded-xl border border-[var(--stroke)] bg-white text-[var(--navy-dark)] transition hover:border-[var(--primary-blue)] hover:text-[var(--primary-blue)]";

  return (
    <div className="relative min-h-screen">
      <div className="relative mx-auto flex max-w-[1920px] flex-col gap-4 px-4 pb-10 pt-4 sm:px-6 xl:flex-row">
        <main className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex flex-col gap-4 rounded-2xl border border-[var(--stroke)] bg-white px-5 py-4 shadow-[0_6px_20px_rgba(3,33,71,0.06)]">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-1.5 rounded-full bg-[var(--accent-yellow)]" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--gray-text)]">
                  Acquisitions
                </p>
                <h1 className="font-display text-2xl font-semibold leading-tight text-[var(--navy-dark)]">
                  Deal Pipeline
                </h1>
              </div>
            </div>
            <div className="flex-1">{toolbar}</div>
            <div className="flex items-center gap-2">
              <span className="mr-1 text-xs text-[var(--gray-text)]" aria-live="polite">
                {saveLabel}
              </span>
              {!chatOpen && (
                <button
                  type="button"
                  onClick={() => setChatOpen(true)}
                  className={`${iconButton} border-transparent bg-[var(--secondary-purple)] text-white hover:text-white hover:brightness-110`}
                  aria-label="AI Analyst"
                  title="Open AI analyst"
                >
                  <ChatIcon />
                </button>
              )}
              {onOpenAccount && (
                <button
                  type="button"
                  onClick={onOpenAccount}
                  className="flex h-9 items-center gap-2 rounded-xl border border-[var(--stroke)] bg-white px-3 text-sm font-semibold text-[var(--navy-dark)] transition hover:border-[var(--primary-blue)]"
                  aria-label="Account"
                  title="Account"
                >
                  <UserIcon />
                  <span className="hidden sm:inline">{username}</span>
                </button>
              )}
              <button type="button" onClick={onLogout} className={iconButton} aria-label="Log out" title="Log out">
                <LogoutIcon />
              </button>
            </div>
            </div>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl bg-[var(--surface)] px-3.5 py-2">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--gray-text)]">
                    {stat.label}
                  </dt>
                  <dd className="font-display text-lg font-semibold text-[var(--primary-blue)]">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </header>

          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveCardId(null)}
          >
            <section className="grid auto-cols-[minmax(192px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
              {board.columns.map((column, index) => (
                <KanbanColumn
                  key={column.id}
                  index={index}
                  column={column}
                  cards={column.cardIds.map((cardId) => board.cards[cardId])}
                  onRename={handleRenameColumn}
                  onAddCard={handleAddCard}
                  onEditCard={handleEditCard}
                  onDeleteCard={handleDeleteCard}
                />
              ))}
            </section>
            <DragOverlay>
              {activeCard ? (
                <div className="w-[220px]">
                  <KanbanCardPreview card={activeCard} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>

        <ChatSidebar key={boardId} boardId={boardId} open={chatOpen} onClose={() => setChatOpen(false)} onBoardUpdate={handleServerBoard} />
      </div>
    </div>
  );
};
