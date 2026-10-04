import type { Card } from "@/lib/kanban";
import { formatCapRate, formatCurrency, formatSF, pricePerSF } from "@/lib/deals";

export const DealFacts = ({ card }: { card: Card }) => {
  const hasMeta = card.property_type || card.market;
  const hasNumbers = card.price != null || card.cap_rate != null || card.size_sf != null;
  const psf = pricePerSF(card);

  return (
    <>
      {hasMeta && (
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--primary-blue)]">
          {[card.property_type, card.market].filter(Boolean).join(" / ")}
        </p>
      )}
      {hasNumbers && (
        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--stroke)] pt-3 text-xs">
          <div>
            <dt className="text-[var(--gray-text)]">Price</dt>
            <dd className="font-semibold text-[var(--navy-dark)]">{formatCurrency(card.price)}</dd>
          </div>
          <div>
            <dt className="text-[var(--gray-text)]">Cap</dt>
            <dd className="font-semibold text-[var(--navy-dark)]">{formatCapRate(card.cap_rate)}</dd>
          </div>
          <div>
            <dt className="text-[var(--gray-text)]">{psf != null ? "$/SF" : "Size"}</dt>
            <dd className="font-semibold text-[var(--navy-dark)]">
              {psf != null ? `$${psf.toFixed(0)}` : formatSF(card.size_sf)}
            </dd>
          </div>
        </dl>
      )}
    </>
  );
};
