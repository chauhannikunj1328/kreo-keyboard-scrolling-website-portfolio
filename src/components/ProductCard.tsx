import { useCart } from "../lib/cart";
import type { CatalogItem } from "../lib/catalog";
import { catalogImage, discountOf, money, productPath } from "../lib/product";
import styles from "./ProductCard.module.css";

export function ProductCard({ item }: { item: CatalogItem }) {
  const cart = useCart();
  const path = productPath(item.handle);
  return (
    <article className={styles.card}>
      <a className={styles.media} href={path} aria-label={item.title}>
        <img src={catalogImage(item.images[0])} alt="" width="800" height="800" loading="lazy" decoding="async" />
        {item.images[1] && <img className={styles.alt} src={catalogImage(item.images[1])} alt="" width="800" height="800" loading="lazy" decoding="async" />}
        <span className={item.available ? styles.save : styles.out}>{item.available ? `Save ${discountOf(item)}%` : "Out of stock"}</span>
        {item.rating && (
          <span className={styles.rating}>
            <i aria-hidden="true">★</i> {item.rating}
          </span>
        )}
      </a>
      <div className={styles.body}>
        <h2>
          <a href={path}>{item.title}</a>
        </h2>
        <p className={styles.price}>
          <strong>{money(item.price)}</strong> <s>MRP {money(item.mrp)}</s>
        </p>
        {!item.available ? (
          <button type="button" className={styles.action} disabled>
            Sold out
          </button>
        ) : item.switches ? (
          <a className={styles.action} href={path}>
            Choose options
          </a>
        ) : (
          <button type="button" className={styles.action} onClick={() => cart.add(item.handle)}>
            Add to cart
          </button>
        )}
      </div>
    </article>
  );
}
