(() => {
  // Run before rendering so a minimal visit never flashes the editorial homepage.
  const root = new URL("./", document.currentScript.src);
  const preferenceKey = "fightheyyy.blog-style";
  const sessionKey = "fightheyyy.visit-style";
  const url = new URL(location.href);
  const requested = url.searchParams.get("view");
  const valid = value => value === "minimal" || value === "editorial";
  const read = (storage, key) => {
    try { return window[storage].getItem(key); } catch { return null; }
  };
  const save = (storage, key, value) => {
    try { window[storage].setItem(key, value); } catch { /* Browsing still works without storage. */ }
  };
  if (valid(requested)) {
    save("localStorage", preferenceKey, requested);
    save("sessionStorage", sessionKey, requested);
  }
  if (url.pathname !== root.pathname && url.pathname !== `${root.pathname}index.html`) return;

  let style = requested;
  if (!valid(style)) style = read("localStorage", preferenceKey);
  if (!valid(style)) style = read("sessionStorage", sessionKey);
  if (!valid(style)) {
    style = Math.random() < .5 ? "minimal" : "editorial";
    save("sessionStorage", sessionKey, style);
  }
  if (style === "minimal") {
    const destination = new URL("classic/index.html", root);
    destination.search = url.search;
    destination.hash = url.hash;
    location.replace(destination.href);
  }
})();
