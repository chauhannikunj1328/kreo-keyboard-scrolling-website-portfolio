import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../lib/cart";
import { STORY_HANDLE, productPath } from "../lib/product";
import { navigate, useLocation } from "../lib/router";
import styles from "./Header.module.css";

type Link = readonly [label: string, path: string];

// Only the keyboards exist in this concept; everything else goes to the demo note.
const SHOP: Link[] = [
  ["Keyboards", "/"],
  ["Mouse and Mousepads", "/demo"],
  ["Audio Video & Lights", "/demo"],
  ["Monitor", "/demo"],
  ["Controllers", "/demo"],
  ["Accessories", "/demo"],
];
const SETUPS: Link[] = [
  ["PC builder starter kit", "/demo"],
  ["Work from home essentials", "/demo"],
  ["Streamers essential", "/demo"],
  ["Gaming essentials", "/demo"],
];
const SUPPORT: Link[] = [
  ["Kontrol Web Software", "/demo"],
  ["Software downloads", "/demo"],
  ["Contact us", "/demo"],
];
const POPULAR: Link[] = [
  ["Swarm 75", "/?q=Swarm 75"],
  ["Swarm X", "/?q=Swarm X"],
  ["Hive", "/?q=Hive"],
];

type Menu = "shop" | "support";

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

function Links({ links }: { links: Link[] }) {
  return (
    <ul>
      {links.map(([label, path]) => (
        <li key={label}>
          <a href={path}>{label}</a>
        </li>
      ))}
    </ul>
  );
}

// Kreo's store header, with a better pattern: one row, a Shop menu that groups
// the categories and setups, search that opens anywhere with "/" or Ctrl/⌘ K,
// and a full-height menu on phones. Menus open on hover, click or focus, and
// close on Esc or a click outside.
export function Header({ announce = false }: { announce?: boolean }) {
  const cart = useCart();
  const location = useLocation();
  const [open, setOpen] = useState<Menu | null>(null);
  const [searching, setSearching] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const root = useRef<HTMLElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<number>(0);

  const hold = (menu: Menu) => {
    clearTimeout(closeTimer.current);
    setOpen(menu);
  };
  // a short grace period, so the pointer can cross the gap to the panel
  const release = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(null), 140);
  };

  // going to another page closes whatever was open
  useEffect(() => {
    setOpen(null);
    setSearching(false);
    setDrawer(false);
  }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 8);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.matches("input, textarea") || e.target.isContentEditable);
      if (e.key === "Escape") {
        setOpen(null);
        setSearching(false);
        setDrawer(false);
      } else if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setSearching(true);
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(null);
    };
    addEventListener("keydown", onKey);
    addEventListener("pointerdown", onPointer);
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("pointerdown", onPointer);
    };
  }, []);

  useEffect(() => {
    if (searching) input.current?.focus();
  }, [searching]);

  // the phone menu doesn't exist on wide screens: close it (and unlock the page) if the window grows
  useEffect(() => {
    const wide = matchMedia("(min-width: 901px)");
    const onChange = () => wide.matches && setDrawer(false);
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  // the page behind a full-screen panel shouldn't scroll
  useEffect(() => {
    if (!searching && !drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [searching, drawer]);

  const trigger = (menu: Menu, label: string) => (
    <button
      type="button"
      className={styles.trigger}
      aria-expanded={open === menu}
      aria-haspopup="true"
      // hovering has already opened it by the time a mouse click lands, so a click
      // only toggles on touch screens and from the keyboard
      onClick={(e) => setOpen(open === menu && (e.detail === 0 || !matchMedia("(hover: hover)").matches) ? null : menu)}
      onFocus={() => hold(menu)}
    >
      {label}
      <svg viewBox="0 0 10 6" width="10" height="6" aria-hidden="true">
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  return (
    <header ref={root} className={`${styles.header} ${scrolled || open ? styles.solid : ""} ${announce ? styles.announced : ""}`}>
      {announce && <p className={styles.announce}>Portfolio concept store. No real products, orders or payments.</p>}
      <div className={styles.row}>
        <button type="button" className={`${styles.icon} ${styles.burger}`} aria-label={drawer ? "Close menu" : "Open menu"} aria-expanded={drawer} onClick={() => setDrawer(!drawer)}>
          <Icon>{drawer ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</Icon>
        </button>

        <a className={styles.logo} href="/" aria-label="Keyboards home">
          <img src={`${import.meta.env.BASE_URL}kreo-logo.svg`} alt="Kreo" width="75" height="24" />
        </a>

        <nav className={styles.nav} aria-label="Kreo store">
          <div className={styles.item} onMouseEnter={() => hold("shop")} onMouseLeave={release}>
            {trigger("shop", "Shop")}
            {open === "shop" && (
              <div className={`${styles.panel} ${styles.mega}`} onMouseEnter={() => hold("shop")} onMouseLeave={release}>
                <div>
                  <p className={styles.heading}>Categories</p>
                  <Links links={SHOP} />
                </div>
                <div>
                  <p className={styles.heading}>Shop by setup</p>
                  <Links links={SETUPS} />
                </div>
                <a className={styles.feature} href={productPath(STORY_HANDLE)}>
                  <span>New</span>
                  Swarm 75 · White Purple
                  <small>75% wireless, gasket mounted, with a metal volume knob. ₹4,799</small>
                </a>
              </div>
            )}
          </div>
          <a className={styles.link} href="/">
            Bestsellers
          </a>
          <a className={styles.link} href="/">
            Keyboards
          </a>
          <div className={styles.item} onMouseEnter={() => hold("support")} onMouseLeave={release}>
            {trigger("support", "Software & Support")}
            {open === "support" && (
              <div className={`${styles.panel} ${styles.menu}`} onMouseEnter={() => hold("support")} onMouseLeave={release}>
                <Links links={SUPPORT} />
              </div>
            )}
          </div>
        </nav>

        <div className={styles.tools}>
          <button type="button" className={styles.search} onClick={() => setSearching(true)} aria-label="Search (press /)">
            <Icon>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </Icon>
            <span>Search</span>
            <kbd>/</kbd>
          </button>
          <a className={styles.icon} href="/demo" aria-label="Account and order history">
            <Icon>
              <circle cx="12" cy="8" r="3.6" />
              <path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4" />
            </Icon>
          </a>
          <button type="button" className={styles.icon} onClick={() => cart.setOpen(true)} aria-label={`Cart, ${cart.count} items`}>
            <Icon>
              <path d="M3 4h2.4l2 10.2h9.4L19 7H6.4" />
              <circle cx="9" cy="19" r="1.3" />
              <circle cx="16.5" cy="19" r="1.3" />
            </Icon>
            {cart.count > 0 && <span className={styles.count}>{cart.count}</span>}
          </button>
        </div>
      </div>

      {drawer &&
        createPortal(
        <div className={styles.drawer}>
          <details open>
            <summary>Shop</summary>
            <Links links={SHOP} />
          </details>
          <details>
            <summary>Shop by setup</summary>
            <Links links={SETUPS} />
          </details>
          <a className={styles.drawerLink} href="/">
            Bestsellers
          </a>
          <details>
            <summary>Software & Support</summary>
            <Links links={SUPPORT} />
          </details>
        </div>,
          document.body,
        )}

      {searching &&
        createPortal(
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Search Kreo" onClick={(e) => e.target === e.currentTarget && setSearching(false)}>
          <div className={styles.box}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
                navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
              }}
            >
              <input ref={input} name="q" type="search" placeholder="Search keyboards…" autoComplete="off" aria-label="Search" />
              <button type="submit">Search</button>
            </form>
            <p>
              Popular:{" "}
              {POPULAR.map(([label, path]) => (
                <a key={label} href={path}>
                  {label}
                </a>
              ))}
            </p>
            <button type="button" className={styles.close} onClick={() => setSearching(false)} aria-label="Close search">
              Esc
            </button>
          </div>
        </div>,
          document.body,
        )}
    </header>
  );
}
