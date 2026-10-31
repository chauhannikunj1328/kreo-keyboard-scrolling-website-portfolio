import { Footer } from "../components/Footer";
import styles from "./Demo.module.css";

// Where links outside this concept's scope lead, so nothing leaves the project.
export function Demo() {
  return (
    <div className={styles.page}>
      <main>
        <h1>This page isn't part of the demo</h1>
        <p>This portfolio concept covers the keyboard list and the product pages.</p>
        <a href="/">Back to keyboards</a>
      </main>
      <Footer />
    </div>
  );
}
