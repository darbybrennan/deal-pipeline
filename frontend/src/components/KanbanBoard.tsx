"use client";

import { useEffect, useRef, useState } from "react";
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

const SAVE_DELAY_MS = 400;

// Use whatever is under the pointer; fall back to overlap when the pointer is between targets.
// (closestCorners picked cards in the wrong column on multi-column boards.)
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

type SaveState = "idle" | "saving" | "saved" | "error";

type KanbanBoardProps = {
  onLogout: () => void;
};

export const KanbanBoard = ({ onLogout }: KanbanBoardProps) => {
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
      .getBoard()
      .then(setBoard)
      .catch(() => setLoadError("Could not load your board."));
  }, []);

  useEffect(() => {
    if (!board || !dirty.current) return;
    const timer = setTimeout(() => {
      dirty.current = false;
      setSaveState("saving");
      api
        .saveBoard(board)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [board]);

  const update = (updater: (prev: BoardData) => BoardData) => {
    dirty.current = true;
    setBoard((prev) => (prev ? updater(prev) : prev));
  };

  const handleServerBoard = (next: BoardData) => {
    dirty.current = false;
    setBoard(next);
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

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <div className="relative mx-auto flex max-w-[1800px] flex-col gap-6 px-6 pb-16 pt-10 xl:flex-row">
        <main className="flex min-w-0 flex-1 flex-col gap-8">
          <header className="flex flex-col gap-6 rounded-[32px] border border-[var(--stroke)] bg-white/80 p-8 shadow-[var(--shadow)] backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
                  Acquisitions
                </p>
                <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--navy-dark)]">
                  Deal Pipeline
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--gray-text)]">
                  Track every deal from sourcing to close. Drag deals between stages, edit the
                  numbers, or ask the AI analyst to do it for you.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  {!chatOpen && (
                    <button
                      type="button"
                      onClick={() => setChatOpen(true)}
                      className="rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110"
                    >
                      AI Analyst
                    </button>
                  )}
                  <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--navy-dark)] transition hover:border-[var(--primary-blue)]"
                >
                    Log out
                  </button>
                </div>
                <span className="text-xs text-[var(--gray-text)]" aria-live="polite">
                  {saveLabel}
                </span>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-5 py-4"
                >
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
                    {stat.label}
                  </dt>
                  <dd className="mt-2 font-display text-2xl font-semibold text-[var(--primary-blue)]">
                    {stat.value}
                  </dd>
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
            <section className="grid auto-cols-[minmax(200px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4">
              {board.columns.map((column) => (
                <KanbanColumn
                  key={column.id}
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

        <ChatSidebar open={chatOpen} onClose={() => setChatOpen(false)} onBoardUpdate={handleServerBoard} />
      </div>
    </div>
  );
};
