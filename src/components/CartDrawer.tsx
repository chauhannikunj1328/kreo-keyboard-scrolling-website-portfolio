import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../lib/cart";
import { catalogImage, findProduct, money, productPath } from "../lib/product";
import styles from "./CartDrawer.module.css";

export function CartDrawer() {
  const { lines, open, setOpen, setQty } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, setOpen]);

  if (!open) return null;
  const rows = lines.flatMap((line) => {
    const item = findProduct(line.handle);
    return item ? [{ line, item }] : [];
  });
  const total = rows.reduce((n, { line, item }) => n + line.qty * item.price, 0);

  return createPortal(
    <div className={styles.scrim} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Your cart">
        <header>
          <h2>Your cart</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close cart">
            ×
          </button>
        </header>
        {rows.length === 0 ? (
          <p className={styles.empty}>Your cart is empty.</p>
        ) : (
          <ul>
            {rows.map(({ line, item }) => (
              <li key={line.handle + line.option}>
                <img src={catalogImage(item.images[0])} alt="" width="80" height="80" />
                <div>
                  <a href={productPath(item.handle)} onClick={() => setOpen(false)}>
                    {item.title}
                  </a>
                  {line.option && <small>{line.option}</small>}
                  <span className={styles.qty}>
                    <button type="button" onClick={() => setQty(line, line.qty - 1)} aria-label="One fewer">
                      −
                    </button>
                    {line.qty}
                    <button type="button" onClick={() => setQty(line, line.qty + 1)} aria-label="One more">
                      +
                    </button>
                  </span>
                </div>
                <strong>{money(item.price * line.qty)}</strong>
              </li>
            ))}
          </ul>
        )}
        <footer>
          <p>
            <span>Total</span>
            <strong>{money(total)}</strong>
          </p>
          <button type="button" disabled>
            Checkout is off in this demo
          </button>
          <small>This is a portfolio concept. Nothing can be bought here.</small>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
