import { useEffect } from "react";
import { CartDrawer } from "./components/CartDrawer";
import { Header } from "./components/Header";
import { Product } from "./components/Product";
import { Story } from "./components/Story";
import { CartProvider } from "./lib/cart";
import { STORY_HANDLE, findProduct } from "./lib/product";
import { installLinkHandling, useLocation } from "./lib/router";
import { Collection } from "./pages/Collection";
import { Demo } from "./pages/Demo";
import storyStyles from "./components/Story.module.css";

const Bars = () => (
  <div className={storyStyles.bars}>
    <Header announce />
  </div>
);

function Page() {
  const location = useLocation();
  const url = new URL(location, "http://local");
  const path = url.pathname.replace(/\/$/, "") || "/";

  if (path === "/") {
    return (
      <>
        <Bars />
        <Collection query={url.searchParams.get("q") ?? ""} />
      </>
    );
  }
  const handle = path.match(/^\/products\/([^/]+)$/)?.[1];
  const item = handle ? findProduct(handle) : undefined;
  if (item?.handle === STORY_HANDLE) return <Story key={item.handle} item={item} />;
  if (item) {
    return (
      <>
        <Bars />
        <Product key={item.handle} item={item} />
      </>
    );
  }
  return (
    <>
      <Bars />
      <Demo />
    </>
  );
}

export function App() {
  useEffect(installLinkHandling, []);
  return (
    <CartProvider>
      <Page />
      <CartDrawer />
    </CartProvider>
  );
}
