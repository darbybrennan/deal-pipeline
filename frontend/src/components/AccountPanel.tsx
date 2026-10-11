import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { CloseIcon } from "@/components/Icons";

type AccountPanelProps = {
  username: string;
  onClose: () => void;
  onDeleted: () => void;
};

const inputClass =
  "w-full rounded-xl border border-[var(--stroke)] px-3 py-2 text-sm text-[var(--navy-dark)] outline-none focus:border-[var(--primary-blue)]";

const message = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong.");

export const AccountPanel = ({ username, onClose, onDeleted }: AccountPanelProps) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pwStatus, setPwStatus] = useState("");
  const [confirm, setConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await api.changePassword(current, next);
      setPwStatus("Password updated. Other devices were signed out.");
      setCurrent("");
      setNext("");
    } catch (e) {
      setPwStatus(message(e));
    }
  };

  const deleteAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await api.deleteAccount(confirm);
      onDeleted();
    } catch (e) {
      setDeleteError(message(e));
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(3,33,71,0.35)] p-4" role="dialog" aria-label="Account">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[var(--shadow)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--gray-text)]">Account</p>
            <h2 className="font-display text-xl font-semibold text-[var(--navy-dark)]">{username}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account"
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--gray-text)] hover:bg-[var(--surface)]"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={changePassword} className="mt-5 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--navy-dark)]">Change password</h3>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password" aria-label="Current password" className={inputClass} />
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password (8+ characters)" aria-label="New password" className={inputClass} />
          <button type="submit" className="rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:brightness-110">
            Update password
          </button>
          {pwStatus && <p role="status" className="text-xs text-[var(--navy-dark)]">{pwStatus}</p>}
        </form>

        <form onSubmit={deleteAccount} className="mt-6 space-y-2 border-t border-[var(--stroke)] pt-5">
          <h3 className="text-sm font-semibold text-red-700">Delete account</h3>
          <p className="text-xs text-[var(--gray-text)]">Removes your account and every pipeline in it. This cannot be undone.</p>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm with your password" aria-label="Confirm password" className={inputClass} />
          <button type="submit" className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-700 hover:bg-red-50">
            Delete my account
          </button>
          {deleteError && <p role="alert" className="text-xs text-red-600">{deleteError}</p>}
        </form>
      </div>
    </div>
  );
};
