"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { Workspace } from "@/components/Workspace";
import { api } from "@/lib/api";

type AuthState = { status: "loading" } | { status: "signed-out" } | { status: "signed-in"; username: string };

export default function Home() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    api
      .me()
      .then((me) => setAuth({ status: "signed-in", username: me.username }))
      .catch(() => setAuth({ status: "signed-out" }));
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setAuth({ status: "signed-out" });
  };

  if (auth.status === "loading") return null;
  if (auth.status === "signed-out") {
    return <LoginForm onSuccess={(username) => setAuth({ status: "signed-in", username })} />;
  }
  return (
    <Workspace
      username={auth.username}
      onLogout={handleLogout}
      onAccountDeleted={() => setAuth({ status: "signed-out" })}
    />
  );
}
