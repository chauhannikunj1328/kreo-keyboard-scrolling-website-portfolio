import { useEffect, useRef, useState } from "react";
import { useCart } from "../lib/cart";
import { CATALOG, type CatalogItem } from "../lib/catalog";
import {
  BANNERS_BOTTOM,
  FAQ,
  ICONS,
  REVIEW_COUNT,
  STATS,
  THEMES,
  bannersTop,
  bulletsOf,
  cardsOf,
  catalogImage,
  chipsOf,
  colourOf,
  colourways,
  discountOf,
  filmOf,
  galleryOf,
  hasStory,
  modelOf,
  money,
  productPath,
  specsOf,
} from "../lib/product";
import { Footer } from "./Footer";
import { ProductCard } from "./ProductCard";
import styles from "./Product.module.css";

const Stars = ({ rating }: { rating: number }) => (
  <span className={styles.stars} role="img" aria-label={`${rating} out of 5 stars`}>
    <span style={{ width: `${(rating / 5) * 100}%` }}>★★★★★</span>★★★★★
  </span>
);

function Banner({ img, photo, title, body, dark, right }: { img: string; photo?: string; title: string; body: string; dark: boolean; right?: boolean }) {
  return (
    <figure className={`${styles.banner} ${dark ? styles.dark : ""} ${right ? styles.right : ""} ${photo ? styles.studio : ""}`}>
      <img src={photo ?? `/sections/${img}.webp`} alt="" loading="lazy" decoding="async" />
      <figcaption>
        <h2>{title}</h2>
        <p>{body}</p>
      </figcaption>
    </figure>
  );
}

// The product page: buy box, scrolling band, stats, specs, image banners, feature cards, film,
// banners, icon row, questions, reviews.
export function Product({ item, under3D = false }: { item: CatalogItem; under3D?: boolean }) {
  const cart = useCart();
  const gallery = galleryOf(item);
  // keyed by handle wherever it's rendered, so these start fresh on each product
  const [shot, setShot] = useState(0);
  const [option, setOption] = useState(item.switches?.[0] ?? null);
  const [stickyOn, setStickyOn] = useState(false);
  const buy = useRef<HTMLElement>(null);
  const model = modelOf(item);
  const story = hasStory(item);
  const reviews = REVIEW_COUNT[item.handle];
  const family = colourways(item);
  const inStock = family.filter((p) => p.available && p.handle !== item.handle);
  // one board from each other line, so the suggestions differ from page to page
  const film = filmOf(item);
  const related = CATALOG.filter((p) => p.available && modelOf(p) !== model)
    .filter((p, i, all) => all.findIndex((o) => modelOf(o) === modelOf(p)) === i)
    .slice(0, 3);

  useEffect(() => {
    const el = buy.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStickyOn(e.boundingClientRect.top < 0 && !e.isIntersecting), { rootMargin: "-80px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`${styles.page} ${under3D ? styles.under3D : ""}`} id="details">
      <section ref={buy} id="buy" className={`${styles.wrap} ${styles.buy}`} aria-labelledby="product-title">
        <div className={styles.gallery}>
          <div className={styles.main}>
            <span className={styles.badge}>macOS compatible</span>
            <img key={gallery[shot]?.src} src={gallery[shot]?.src} alt={gallery[shot]?.alt} width="1000" height="1000" decoding="async" />
          </div>
          <ul className={styles.thumbs} aria-label="Product photos">
            {gallery.map((g, i) => (
              <li key={g.src}>
                <button type="button" onClick={() => setShot(i)} aria-label={`Show photo ${i + 1}`} aria-current={i === shot}>
                  <img src={g.thumb ?? g.src} alt="" width="120" height="120" loading="lazy" decoding="async" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.info}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <a href="/">Keyboards</a>
            <span aria-hidden="true">/</span>
            <span>{model}</span>
          </nav>
          <h1 id="product-title" className={styles.title}>
            {item.title}
          </h1>
          <div className={styles.price}>
            <strong>{money(item.price)}</strong>
            <s>MRP {money(item.mrp)}</s>
            <em>{discountOf(item)}% OFF</em>
          </div>
          <p className={styles.fine}>(Incl. of all taxes)</p>
          {item.rating &&
            (story ? (
              <a className={styles.rating} href="#reviews" onClick={(e) => { e.preventDefault(); document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" }); }}>
                <Stars rating={item.rating} />
                <strong>{item.rating.toFixed(1)}</strong>
                {reviews && <span>{reviews} reviews</span>}
              </a>
            ) : (
              <p className={styles.rating}>
                <Stars rating={item.rating} />
                <strong>{item.rating.toFixed(1)}</strong>
              </p>
            ))}
          <p className={styles.emi}>
            or <strong>{money(Math.ceil(item.price / 3))}/month</strong> for 3 months, 0% EMI
          </p>

          {family.length > 1 && (
            <div className={styles.option}>
              <p>
                Color: <b>{colourOf(item)}</b>
              </p>
              <ul className={styles.swatches}>
                {family.map((p) => (
                  <li key={p.handle}>
                    <a href={productPath(p.handle)} aria-label={colourOf(p)} aria-current={p.handle === item.handle} title={colourOf(p)}>
                      <img src={catalogImage(p.images[0])} alt="" width="64" height="64" loading="lazy" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {item.switches && (
            <div className={styles.option}>
              <p>
                Switch Type: <b>{option}</b>
              </p>
              <div className={styles.pills} role="radiogroup" aria-label="Switch type">
                {item.switches.map((s) => (
                  <button key={s} type="button" role="radio" aria-checked={option === s} onClick={() => setOption(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ul className={styles.chips}>
            {chipsOf(item).map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>

          {item.available ? (
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={() => cart.add(item.handle, option)}>
                Add to cart
              </button>
              <button type="button" className={styles.secondary} onClick={() => cart.add(item.handle, option)}>
                Buy Now
              </button>
            </div>
          ) : (
            <div className={styles.actions}>
              <button type="button" className={styles.primary} disabled>
                Sold Out
              </button>
            </div>
          )}
          {!item.available && inStock.length > 0 && (
            <p className={styles.restock}>
              Sold out in {colourOf(item)}. Try <a href={productPath(inStock[0].handle)}>{colourOf(inStock[0])}</a>
              {inStock.length > 1 && ` or ${inStock.length - 1} other colour${inStock.length > 2 ? "s" : ""}`}, in stock now.
            </p>
          )}

          {story && (
            <div className={styles.bullets}>
              <h2>Features:</h2>
              <ul>
                {bulletsOf(item).map(([k, v]) => (
                  <li key={k}>
                    <b>{k}:</b> {v}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {story ? (
        <>
          <div className={styles.marquee} aria-hidden="true">
            <div>
              {Array.from({ length: 8 }, (_, i) => (
                <span key={i}>WIRELESS MECHANICAL KEYBOARD</span>
              ))}
            </div>
          </div>

          <section className={styles.counters} aria-label="At a glance">
            <ul className={styles.wrap}>
              {STATS.map(([v, l]) => (
                <li key={l}>
                  <strong>{v}</strong>
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="product-specs" className={styles.specs} aria-labelledby="specs-title">
            <div className={styles.wrap}>
              <p className={styles.meta}>{item.title}</p>
              <h2 id="specs-title">Features &amp; Specs</h2>
              <details className={styles.accordion} open>
                <summary>Specifications</summary>
                <div className={styles.groups}>
                  {specsOf(item).map(([group, rows]) => (
                    <div key={group}>
                      <h3>{group}</h3>
                      <dl>
                        {rows.map(([k, v]) => (
                          <div key={k}>
                            <dt>{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              </details>
              <details className={styles.accordion}>
                <summary>Downloads</summary>
                <ul className={styles.downloads}>
                  {[
                    ["Download Software", "Latest version of the software"],
                    ["Web Software", "Web-based version"],
                    ["Download User Manual", "Complete user guide"],
                  ].map(([l, n]) => (
                    <li key={l}>
                      <a href="/demo">
                        <b>{l}</b>
                        <span>{n}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </section>

          <div className={styles.rounded}>
            <div className={`${styles.wrap} ${styles.stack}`}>
              {bannersTop(item).map((b) => (
                <Banner key={b.img} {...b} />
              ))}

              <ul className={styles.cards}>
                {cardsOf(item).map((c) => (
                  <li key={c.img}>
                    <img src={`/sections/${c.img}.webp`} alt="" loading="lazy" decoding="async" />
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                  </li>
                ))}
              </ul>

              <figure className={`${styles.film} ${film.studio ? styles.studio : ""}`}>
                <img src={film.src} alt={film.alt} width="1000" height="1000" loading="lazy" decoding="async" />
                <figcaption>
                  <h2>{film.title}</h2>
                  <p>{film.body}</p>
                </figcaption>
              </figure>

              {BANNERS_BOTTOM.map((b) => (
                <Banner key={b.img} {...b} />
              ))}

              <ul className={styles.icons}>
                {ICONS.map(([icon, label]) => (
                  <li key={icon}>
                    <img src={`/sections/icon-${icon}.svg`} alt="" width="56" height="56" loading="lazy" />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <section id="faq" className={styles.faq} aria-labelledby="faq-title">
            <div className={styles.wrap}>
              <div>
                <h2 id="faq-title">You asked, we answered!</h2>
                <p>If the issue persists, contact our support team.</p>
              </div>
              <div>
                {FAQ.map(([q, a]) => (
                  <details key={q}>
                    <summary>{q}</summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section id="reviews" className={`${styles.wrap} ${styles.reviews}`} aria-labelledby="reviews-title">
            <h2 id="reviews-title">Customer Reviews</h2>
            <div>
              <div className={styles.score}>
                <strong>{(item.rating ?? 0).toFixed(1)}</strong>
                <Stars rating={item.rating ?? 0} />
                {reviews && <span>{reviews} reviews</span>}
              </div>
              <div>
                <h3>Customers often mention</h3>
                <ul className={styles.tags}>
                  {THEMES.good.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <h3>Worth knowing</h3>
                <ul className={styles.notes}>
                  {THEMES.note.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className={`${styles.wrap} ${styles.related}`} aria-labelledby="related-title">
          <h2 id="related-title">You may also like</h2>
          <div>
            {related.map((p) => (
              <ProductCard key={p.handle} item={p} />
            ))}
          </div>
        </section>
      )}

      <Footer />

      {item.available && (
        <div className={`${styles.sticky} ${stickyOn ? styles.show : ""}`} aria-hidden={!stickyOn}>
          <div>
            <strong>{money(item.price)}</strong>
            <span>{model}</span>
          </div>
          <button type="button" tabIndex={stickyOn ? 0 : -1} onClick={() => cart.add(item.handle, option)}>
            Add to cart
          </button>
        </div>
      )}
    </div>
  );
}

