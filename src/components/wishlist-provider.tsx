"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "scentoria_wishlist";

type Item = { handle: string; title: string; brand: string; image?: string };

type WishlistContextValue = {
  items: Item[];
  has: (handle: string) => boolean;
  toggle: (item: Item) => void;
};

const WishlistContext = createContext<WishlistContextValue>({
  items: [],
  has: () => false,
  toggle: () => {},
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as Item[]);
    } catch {
      setItems([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      has: (handle) => items.some((item) => item.handle === handle),
      toggle: (item) => {
        setItems((current) =>
          current.some((entry) => entry.handle === item.handle)
            ? current.filter((entry) => entry.handle !== item.handle)
            : [...current, item],
        );
      },
    }),
    [items],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}
