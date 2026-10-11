import clsx from "clsx";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Card, Column } from "@/lib/kanban";
import { formatCurrency } from "@/lib/deals";
import { KanbanCard } from "@/components/KanbanCard";
import { NewCardForm } from "@/components/NewCardForm";
import type { CardDraft } from "@/components/CardEditor";

// One accent per stage, left to right: early pipeline cool, closed green.
const STAGE_COLORS = ["#209dd7", "#753991", "#ecad0a", "#e07a1f", "#2f9e6a"];

type KanbanColumnProps = {
  column: Column;
  index?: number;
  cards: Card[];
  onRename: (columnId: string, title: string) => void;
  onAddCard: (columnId: string, draft: CardDraft) => void;
  onEditCard: (cardId: string, draft: CardDraft) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
};

export const KanbanColumn = ({
  column,
  index = 0,
  cards,
  onRename,
  onAddCard,
  onEditCard,
  onDeleteCard,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const total = cards.reduce((sum, card) => sum + (card.price ?? 0), 0);
  const color = STAGE_COLORS[index % STAGE_COLORS.length];

  return (
    <section
      ref={setNodeRef}
      className={clsx(
        "flex min-h-[460px] flex-col rounded-2xl border border-[var(--stroke)] bg-[var(--column-bg)] p-3 transition",
        isOver && "ring-2 ring-[var(--accent-yellow)]"
      )}
      data-testid={`column-${column.id}`}
    >
      <div className="h-1 rounded-full" style={{ backgroundColor: color }} />
      <div className="mt-3 flex items-center gap-2">
        <input
          value={column.title}
          onChange={(event) => onRename(column.id, event.target.value)}
          className="min-w-0 flex-1 rounded-md bg-transparent font-display text-base font-semibold text-[var(--navy-dark)] outline-none focus:bg-white focus:px-1"
          aria-label="Column title"
        />
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
          style={{ backgroundColor: color }}
          aria-label={`${cards.length} ${cards.length === 1 ? "deal" : "deals"}`}
        >
          {cards.length}
        </span>
      </div>
      <p className="mt-0.5 text-xs font-medium text-[var(--gray-text)]">{formatCurrency(total)} total</p>
      <div className="mt-3 flex flex-1 flex-col gap-2.5">
        <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={(cardId) => onDeleteCard(column.id, cardId)}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--stroke)] px-3 py-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
            Drop a deal here
          </div>
        )}
      </div>
      <NewCardForm onAdd={(draft) => onAddCard(column.id, draft)} />
    </section>
  );
};
