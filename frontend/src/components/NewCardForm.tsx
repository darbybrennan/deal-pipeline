import { useState } from "react";
import { CardEditor, type CardDraft } from "@/components/CardEditor";

type NewCardFormProps = {
  onAdd: (draft: CardDraft) => void;
};

export const NewCardForm = ({ onAdd }: NewCardFormProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4">
      {isOpen ? (
        <CardEditor
          submitLabel="Add deal"
          onSubmit={(draft) => {
            onAdd(draft);
            setIsOpen(false);
          }}
          onCancel={() => setIsOpen(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full rounded-full border border-dashed border-[var(--stroke)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--primary-blue)] transition hover:border-[var(--primary-blue)]"
        >
          Add a deal
        </button>
      )}
    </div>
  );
};
