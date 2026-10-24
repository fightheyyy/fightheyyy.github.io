(() => {
  // Run before rendering so a minimal visit never flashes the editorial homepage.
  const root = new URL("./", document.currentScript.src);
  const url = new URL(location.href);
  const requested = url.searchParams.get("view");
  const valid = value => value === "minimal" || value === "editorial";
  // Remove preferences left by the previous version; future visits save nothing.
  try { localStorage.removeItem("fightheyyy.blog-style"); } catch {}
  try { sessionStorage.removeItem("fightheyyy.visit-style"); } catch {}

  const onEditorial = url.pathname === root.pathname || url.pathname === `${root.pathname}index.html`;
  const onMinimal = url.pathname === `${root.pathname}classic/` || url.pathname === `${root.pathname}classic/index.html`;
  if (!onEditorial && !onMinimal) return;

  const style = valid(requested) ? requested : Math.random() < .5 ? "minimal" : "editorial";
  if (valid(requested)) {
    url.searchParams.delete("view");
    history.replaceState(history.state, "", url.href);
  }
  if ((style === "minimal" && onEditorial) || (style === "editorial" && onMinimal)) {
    const destination = new URL(style === "minimal" ? "classic/index.html" : "./", root);
    destination.search = url.search;
    // A one-use hint prevents a second random draw on the destination page.
    destination.searchParams.set("view", style);
    destination.hash = url.hash;
    location.replace(destination.href);
  }
})();
