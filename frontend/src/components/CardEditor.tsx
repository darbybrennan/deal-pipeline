import { useState, type FormEvent } from "react";
import type { Card } from "@/lib/kanban";

export type CardDraft = Omit<Card, "id">;

export const emptyDraft: CardDraft = {
  title: "",
  details: "",
  property_type: null,
  market: null,
  size_sf: null,
  price: null,
  cap_rate: null,
};

type CardEditorProps = {
  initial?: CardDraft;
  submitLabel: string;
  onSubmit: (draft: CardDraft) => void;
  onCancel: () => void;
};

const toText = (value: string | number | null | undefined) => (value == null ? "" : String(value));
const toNumber = (value: string) => (value.trim() === "" ? null : Number(value));
const toNullable = (value: string) => (value.trim() === "" ? null : value.trim());

const inputClass =
  "w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]";

export const CardEditor = ({ initial = emptyDraft, submitLabel, onSubmit, onCancel }: CardEditorProps) => {
  const [form, setForm] = useState({
    title: initial.title,
    details: initial.details,
    property_type: toText(initial.property_type),
    market: toText(initial.market),
    size_sf: toText(initial.size_sf),
    price: toText(initial.price),
    cap_rate: toText(initial.cap_rate),
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    onSubmit({
      title: form.title.trim(),
      details: form.details.trim(),
      property_type: toNullable(form.property_type),
      market: toNullable(form.market),
      size_sf: toNumber(form.size_sf),
      price: toNumber(form.price),
      cap_rate: toNumber(form.cap_rate),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2" onPointerDown={(e) => e.stopPropagation()}>
      <input
        value={form.title}
        onChange={(e) => set("title")(e.target.value)}
        placeholder="Deal name"
        className={`${inputClass} font-medium`}
        required
      />
      <textarea
        value={form.details}
        onChange={(e) => set("details")(e.target.value)}
        placeholder="Notes"
        rows={2}
        className={`${inputClass} resize-none`}
      />
      <div className="grid grid-cols-2 gap-2">
        <input value={form.property_type} onChange={(e) => set("property_type")(e.target.value)} placeholder="Property type" className={inputClass} />
        <input value={form.market} onChange={(e) => set("market")(e.target.value)} placeholder="Market" className={inputClass} />
        <input type="number" min="0" value={form.size_sf} onChange={(e) => set("size_sf")(e.target.value)} placeholder="Size (SF)" className={inputClass} />
        <input type="number" min="0" value={form.price} onChange={(e) => set("price")(e.target.value)} placeholder="Price ($)" className={inputClass} />
        <input type="number" min="0" max="100" step="0.01" value={form.cap_rate} onChange={(e) => set("cap_rate")(e.target.value)} placeholder="Cap rate (%)" className={inputClass} />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          className="rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-[var(--stroke)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--gray-text)] transition hover:text-[var(--navy-dark)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
