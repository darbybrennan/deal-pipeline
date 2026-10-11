import { useState } from "react";
import { CardEditor, type CardDraft } from "@/components/CardEditor";
import { PlusIcon } from "@/components/Icons";

type NewCardFormProps = {
  onAdd: (draft: CardDraft) => void;
};

export const NewCardForm = ({ onAdd }: NewCardFormProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3">
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
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[rgba(3,33,71,0.15)] px-3 py-2 text-xs font-semibold text-[var(--primary-blue)] transition hover:border-[var(--primary-blue)] hover:bg-white"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add a deal
        </button>
      )}
    </div>
  );
};
