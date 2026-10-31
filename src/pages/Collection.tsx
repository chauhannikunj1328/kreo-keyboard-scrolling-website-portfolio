import { useMemo, useState } from "react";
import { Footer } from "../components/Footer";
import { ProductCard } from "../components/ProductCard";
import { CATALOG } from "../lib/catalog";
import { isWireless } from "../lib/product";
import styles from "./Collection.module.css";

type Sort = "featured" | "low" | "high" | "discount";
type Connection = "all" | "wireless" | "wired";

const PRICE_CEILING = Math.max(...CATALOG.map((p) => p.price));

// The starting page: every keyboard, with search results from the header (?q=) and a filter sheet.
export function Collection({ query }: { query: string }) {
  const [sheet, setSheet] = useState(false);
  const [sort, setSort] = useState<Sort>("featured");
  const [connection, setConnection] = useState<Connection>("all");
  const [inStock, setInStock] = useState(false);
  const [maxPrice, setMaxPrice] = useState(PRICE_CEILING);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = CATALOG.filter(
      (p) =>
        (!q || p.title.toLowerCase().includes(q)) &&
        (connection === "all" || isWireless(p) === (connection === "wireless")) &&
        (!inStock || p.available) &&
        p.price <= maxPrice,
    );
    if (sort === "low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "discount") return [...list].sort((a, b) => a.price / a.mrp - b.price / b.mrp);
    return list;
  }, [query, sort, connection, inStock, maxPrice]);

  const reset = () => {
    setSort("featured");
    setConnection("all");
    setInStock(false);
    setMaxPrice(PRICE_CEILING);
  };

  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <img className={styles.backdrop} src="/sections/banner.webp" alt="" />
        <img className={styles.photo} src="/sections/banner.webp" alt="Swarm 75 keyboards in black and white on a lavender stand" />
      </div>

      <main className={styles.sheet}>
        <header className={styles.toolbar}>
          <div>
            <p>Collections / Keyboards</p>
            <h1>{query ? `Results for “${query}”` : "Keyboards"}</h1>
          </div>
          <button type="button" className={styles.filterButton} onClick={() => setSheet(true)} aria-haspopup="dialog">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
              <circle cx="16" cy="7" r="2" />
              <circle cx="8" cy="17" r="2" />
            </svg>
            Filter and sort
          </button>
        </header>
        {items.length ? (
          <div className={styles.grid}>
            {items.map((item) => (
              <ProductCard key={item.handle} item={item} />
            ))}
          </div>
        ) : (
          <div className={styles.none}>
            <h2>No keyboards match</h2>
            <p>Try a different search, or clear the filters.</p>
            <a href="/" onClick={reset}>
              Show all keyboards
            </a>
          </div>
        )}
      </main>

      {sheet && (
        <div className={styles.scrim} onClick={(e) => e.target === e.currentTarget && setSheet(false)}>
          <section className={styles.filters} role="dialog" aria-modal="true" aria-label="Filter and sort">
            <header>
              <h2>Filter and sort</h2>
              <button type="button" onClick={() => setSheet(false)} aria-label="Close">
                ×
              </button>
            </header>
            <fieldset>
              <legend>Sort by</legend>
              {(
                [
                  ["featured", "Featured"],
                  ["low", "Price, low to high"],
                  ["high", "Price, high to low"],
                  ["discount", "Biggest discount"],
                ] as [Sort, string][]
              ).map(([v, l]) => (
                <label key={v}>
                  <input type="radio" name="sort" checked={sort === v} onChange={() => setSort(v)} /> {l}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>Connection</legend>
              {(
                [
                  ["all", "All"],
                  ["wireless", "Wireless"],
                  ["wired", "Wired"],
                ] as [Connection, string][]
              ).map(([v, l]) => (
                <label key={v}>
                  <input type="radio" name="connection" checked={connection === v} onChange={() => setConnection(v)} /> {l}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>Price up to ₹{maxPrice.toLocaleString("en-IN")}</legend>
              <input type="range" min="2000" max={PRICE_CEILING} step="100" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} aria-label="Maximum price" />
            </fieldset>
            <fieldset>
              <legend>Availability</legend>
              <label>
                <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> In stock only
              </label>
            </fieldset>
            <footer>
              <button type="button" onClick={reset}>
                Clear all
              </button>
              <button type="button" onClick={() => setSheet(false)}>
                Show {items.length} {items.length === 1 ? "keyboard" : "keyboards"}
              </button>
            </footer>
          </section>
        </div>
      )}

      <Footer />
    </div>
  );
}
