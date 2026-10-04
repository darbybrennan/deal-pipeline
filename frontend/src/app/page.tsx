"use client";

import { useEffect, useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LoginForm } from "@/components/LoginForm";
import { api } from "@/lib/api";

type AuthState = "loading" | "signed-out" | "signed-in";

export default function Home() {
  const [auth, setAuth] = useState<AuthState>("loading");

  useEffect(() => {
    api
      .me()
      .then(() => setAuth("signed-in"))
      .catch(() => setAuth("signed-out"));
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setAuth("signed-out");
  };

  if (auth === "loading") {
    return null;
  }
  if (auth === "signed-out") {
    return <LoginForm onSuccess={() => setAuth("signed-in")} />;
  }
  return <KanbanBoard onLogout={handleLogout} />;
}
