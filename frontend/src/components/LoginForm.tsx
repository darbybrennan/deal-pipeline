import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";

type LoginFormProps = {
  onSuccess: (username: string) => void;
};

type Mode = "sign-in" | "sign-up";

const inputClass =
  "mt-2 w-full rounded-xl border border-[var(--stroke)] px-3 py-2 text-sm font-medium normal-case tracking-normal text-[var(--navy-dark)] outline-none focus:border-[var(--primary-blue)]";
const labelClass = "mt-4 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]";

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const signUp = mode === "sign-up";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = signUp ? await api.register(username, password) : await api.login(username, password);
      onSuccess(result.username);
    } catch (e) {
      setError(signUp && e instanceof ApiError ? e.message : "Invalid username or password.");
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(signUp ? "sign-in" : "sign-up");
    setError("");
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[28px] border border-[var(--stroke)] bg-white p-8 shadow-[var(--shadow)]"
      >
        <div className="h-1.5 w-12 rounded-full bg-[var(--accent-yellow)]" />
        <h1 className="mt-5 font-display text-3xl font-semibold text-[var(--navy-dark)]">Deal Pipeline</h1>
        <p className="mt-2 text-sm text-[var(--gray-text)]">
          {signUp ? "Create an account to start your own pipelines." : "Sign in to view your acquisitions board."}
        </p>
        <label className={`${labelClass} mt-6`}>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signUp ? "new-password" : "current-password"}
            className={inputClass}
          />
        </label>
        {signUp && <p className="mt-2 text-xs text-[var(--gray-text)]">At least 8 characters.</p>}
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
          {submitting ? "Please wait..." : signUp ? "Create account" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={switchMode}
          className="mt-4 w-full text-center text-xs font-semibold text-[var(--primary-blue)] hover:underline"
        >
          {signUp ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
        {!signUp && (
          <p className="mt-3 text-center text-xs text-[var(--gray-text)]">Demo credentials: user / password</p>
        )}
      </form>
    </main>
  );
};
