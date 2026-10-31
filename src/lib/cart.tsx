import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// A demo cart: it lives in this browser only, and nothing is ever sold or charged.
export interface CartLine {
  handle: string;
  option: string | null;
  qty: number;
}

interface Cart {
  lines: CartLine[];
  count: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (handle: string, option?: string | null) => void;
  setQty: (line: CartLine, qty: number) => void;
}

const KEY = "kreo-concept-cart";
const CartContext = createContext<Cart | null>(null);

function load(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* the cart just won't survive a reload */
    }
  }, [lines]);

  const value = useMemo<Cart>(() => {
    const same = (a: CartLine, handle: string, option: string | null) => a.handle === handle && a.option === option;
    return {
      lines,
      open,
      setOpen,
      count: lines.reduce((n, l) => n + l.qty, 0),
      add(handle, option = null) {
        setLines((ls) => (ls.some((l) => same(l, handle, option)) ? ls.map((l) => (same(l, handle, option) ? { ...l, qty: l.qty + 1 } : l)) : [...ls, { handle, option, qty: 1 }]));
        setOpen(true);
      },
      setQty(line, qty) {
        setLines((ls) => (qty < 1 ? ls.filter((l) => l !== line) : ls.map((l) => (l === line ? { ...l, qty } : l))));
      },
    };
  }, [lines, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart needs a CartProvider");
  return cart;
}
