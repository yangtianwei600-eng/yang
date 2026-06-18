import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { User } from "@/types/api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      window.location.href = "/";
    }
  }, []);

  return { user, loading, setUser, logout };
}
