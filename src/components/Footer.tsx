import styles from "./Footer.module.css";

const QUICK = ["Downloads", "FAQs", "Track Order", "Return & Exchanges", "Warranty", "Contact Us"];
const SOCIAL = ["X", "Instagram", "Youtube", "Discord"];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.cols}>
        <div>
          <h2>Quick Links</h2>
          <ul>
            {QUICK.map((l) => (
              <li key={l}>
                <a href="/demo">{l}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Socials</h2>
          <ul>
            {SOCIAL.map((l) => (
              <li key={l}>
                <a href="/demo">{l}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>About this project</h2>
          <p>A portfolio concept: a store redesign with a real-time 3D product story. There are no real products, orders or payments here.</p>
        </div>
      </div>
      <p className={styles.legal}>Unofficial portfolio concept. Not affiliated with or endorsed by Kreo. Product names and photos belong to their owners.</p>
    </footer>
  );
}
