import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";

type LoginFormProps = {
  onSuccess: () => void;
};

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.login(username, password);
      onSuccess();
    } catch {
      setError("Invalid username or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[32px] border border-[var(--stroke)] bg-white p-8 shadow-[var(--shadow)]"
      >
        <div className="h-1.5 w-12 rounded-full bg-[var(--accent-yellow)]" />
        <h1 className="mt-5 font-display text-3xl font-semibold text-[var(--navy-dark)]">
          Deal Pipeline
        </h1>
        <p className="mt-2 text-sm text-[var(--gray-text)]">
          Sign in to view your acquisitions board.
        </p>
        <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="mt-2 w-full rounded-xl border border-[var(--stroke)] px-3 py-2 text-sm font-medium normal-case tracking-normal text-[var(--navy-dark)] outline-none focus:border-[var(--primary-blue)]"
          />
        </label>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-2 w-full rounded-xl border border-[var(--stroke)] px-3 py-2 text-sm font-medium normal-case tracking-normal text-[var(--navy-dark)] outline-none focus:border-[var(--primary-blue)]"
          />
        </label>
        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-[var(--secondary-purple)] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
        <p className="mt-4 text-center text-xs text-[var(--gray-text)]">
          Demo credentials: user / password
        </p>
      </form>
    </main>
  );
};
