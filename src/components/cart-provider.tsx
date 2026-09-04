"use client";

import type { Cart } from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CartContextValue = {
  cart: Cart;
  count: number;
  refresh: () => Promise<void>;
  addItem: (merchandiseId: string, quantity?: number) => Promise<void>;
  updateQty: (lineId: string, quantity: number) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

const empty: Cart = { id: null, checkoutUrl: null, lines: [] };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(empty);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/cart");
    if (res.ok) setCart(await res.json());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (merchandiseId: string, quantity = 1) => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchandiseId, quantity }),
      });
      if (res.ok) {
        setCart(await res.json());
      }
    },
    [],
  );

  const updateQty = useCallback(async (lineId: string, quantity: number) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", lineId, quantity }),
    });
    if (res.ok) setCart(await res.json());
  }, []);

  const count = cart.lines.reduce((sum, line) => sum + line.quantity, 0);

  const value = useMemo(
    () => ({ cart, count, refresh, addItem, updateQty }),
    [cart, count, refresh, addItem, updateQty],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
