"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

type StoredAuth = {
  id?: string;
  name?: string;
  role?: string;
};

type UseAuthOptions = {
  autoFetch?: boolean;
};

let cachedUser: StoredAuth | null = null;
let cachedLoaded = false;
let cachedPromise: Promise<StoredAuth | null> | null = null;

const fetchAuthUser = async () => {
  try {
    const result = await api.get("/api/auth/me");
    const payload = (result.data?.result ?? result.data) as StoredAuth;
    cachedUser = payload ?? null;
    cachedLoaded = true;
    return cachedUser;
  } catch {
    cachedUser = null;
    cachedLoaded = true;
    return null;
  } finally {
    cachedPromise = null;
  }
};

export const useAuth = (options: UseAuthOptions = {}) => {
  const [user, setUser] = useState<StoredAuth | null>(null);
  const { autoFetch = true } = options;
  const [loading, setLoading] = useState(() => autoFetch);

  useEffect(() => {
    if (!autoFetch) {
      return;
    }
    let cancelled = false;
    const loadUser = async () => {
      if (cachedLoaded) {
        if (!cancelled) {
          setUser(cachedUser);
          setLoading(false);
        }
        return;
      }

      if (!cachedPromise) {
        cachedPromise = fetchAuthUser();
      }

      const resolved = await cachedPromise;
      if (!cancelled) {
        setUser(resolved);
        setLoading(false);
      }
    };

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [autoFetch]);

  const login = useCallback((data: StoredAuth) => {
    cachedUser = data;
    cachedLoaded = true;
    setUser(data);
  }, []);

  const logout = useCallback(() => {
    cachedUser = null;
    cachedLoaded = true;
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user_id: user?.id,
      user_name: user?.name,
      isAuthenticated: Boolean(user),
      role: user?.role,
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout],
  );

  return value;
};
