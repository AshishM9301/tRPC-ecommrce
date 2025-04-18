"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { useCartStore } from "~/store/cartStore";
import { useAuth } from "~/context/AuthContext";

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const store = useCartStore();
  const prevUserRef = useRef(user);

  // Handle user state changes
  useEffect(() => {
    if (!user && prevUserRef.current) {
      store.resetCart();
    }
    prevUserRef.current = user;
  }, [user, store]);

  return <>{children}</>;
}
