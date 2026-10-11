import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Card } from "@/lib/kanban";
import { CardEditor, type CardDraft } from "@/components/CardEditor";
import { DealFacts } from "@/components/DealFacts";
import { PencilIcon, TrashIcon } from "@/components/Icons";

type KanbanCardProps = {
  card: Card;
  onDelete: (cardId: string) => void;
  onEdit: (cardId: string, draft: CardDraft) => void;
};

const actionClass =
  "grid h-7 w-7 place-items-center rounded-lg text-[var(--gray-text)] transition hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-[var(--primary-blue)]";

export const KanbanCard = ({ card, onDelete, onEdit }: KanbanCardProps) => {
  const [editing, setEditing] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: editing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group rounded-2xl border border-[var(--stroke)] bg-white px-3.5 py-3 shadow-[0_6px_16px_rgba(3,33,71,0.06)] hover:border-[rgba(32,157,215,0.35)]",
        "transition-all duration-150",
        !editing && "cursor-grab",
        isDragging && "opacity-60 shadow-[0_18px_32px_rgba(3,33,71,0.16)]"
      )}
      {...(editing ? {} : { ...attributes, ...listeners })}
      data-testid={`card-${card.id}`}
    >
      {editing ? (
        <CardEditor
          initial={card}
          submitLabel="Save"
          onSubmit={(draft) => {
            onEdit(card.id, draft);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="flex items-start gap-2">
            <h4 className="min-w-0 flex-1 font-display text-[15px] font-semibold leading-snug text-[var(--navy-dark)]">
              {card.title}
            </h4>
            <div className="-mr-1.5 -mt-1 flex shrink-0 opacity-60 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setEditing(true)}
                className={`${actionClass} hover:text-[var(--primary-blue)]`}
                aria-label={`Edit ${card.title}`}
                title="Edit deal"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onDelete(card.id)}
                className={`${actionClass} hover:text-red-600`}
                aria-label={`Delete ${card.title}`}
                title="Remove deal"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <DealFacts card={card} />
          {card.details && (
            <p className="mt-2.5 line-clamp-2 text-xs leading-5 text-[var(--gray-text)]">{card.details}</p>
          )}
        </>
      )}
    </article>
  );
};
