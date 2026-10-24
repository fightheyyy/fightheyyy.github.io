(() => {
  const siteRoot = new URL("../", document.currentScript.src);
  const footer = document.querySelector(".classic-footer-frame");
  if (footer) {
    window.addEventListener("message", event => {
      if (event.origin !== location.origin || event.source !== footer.contentWindow || event.data?.type !== "blog-footer:height") return;
      const height = Number(event.data.height);
      if (Number.isFinite(height) && height >= 200 && height <= 5000) footer.height = String(Math.ceil(height));
    });
    footer.addEventListener("load", () => footer.contentWindow?.postMessage({ type: "blog-footer:measure" }, location.origin));
  }
  const header = document.querySelector(".classic-site-header");
  if (!header) return;

  const menuButton = header.querySelector(".classic-menu-toggle");
  const contact = header.querySelector(".classic-contact");
  const contactButton = header.querySelector(".classic-contact-button");
  const contactPanel = header.querySelector(".classic-contact-panel");
  const navLinks = [...header.querySelectorAll(".classic-nav a")];
  let closeTimer;

  function setMenu(open) {
    header.toggleAttribute("data-menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
  }
  function setContact(open) {
    clearTimeout(closeTimer);
    contactPanel.hidden = !open;
    contactButton.setAttribute("aria-expanded", String(open));
  }
  menuButton.addEventListener("click", () => setMenu(!header.hasAttribute("data-menu-open")));
  contact.addEventListener("mouseenter", () => setContact(true));
  contact.addEventListener("mouseleave", () => {
    closeTimer = setTimeout(() => setContact(false), 140);
  });
  contactButton.addEventListener("click", event => {
    setContact(event.detail === 0 || !matchMedia("(hover: hover)").matches ? contactPanel.hidden : true);
  });
  contact.addEventListener("focusout", event => {
    if (!contact.contains(event.relatedTarget)) setContact(false);
  });
  document.addEventListener("pointerdown", event => {
    if (!contact.contains(event.target)) setContact(false);
  });
  contactPanel.addEventListener("click", event => {
    if (event.target.closest("a")) setContact(false);
  });
  navLinks.forEach(link => link.addEventListener("click", () => setMenu(false)));

  function syncCurrent() {
    const section = location.hash === "#projects" ? "p" : location.hash === "#blog" || document.body.classList.contains("article-page") ? "b" : "h";
    navLinks.forEach(link => {
      if (link.getAttribute("aria-keyshortcuts") === section) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }
  syncCurrent();
  window.addEventListener("hashchange", syncCurrent);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (!contactPanel.hidden) { setContact(false); contactButton.focus(); }
      if (header.hasAttribute("data-menu-open")) { setMenu(false); menuButton.focus(); }
      return;
    }
    if (event.defaultPrevented || event.isComposing || event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
      event.target.closest("input, textarea, select, [contenteditable], [role='dialog']")) return;
    const link = navLinks.find(item => item.getAttribute("aria-keyshortcuts") === event.key.toLowerCase());
    if (link) { event.preventDefault(); link.click(); }
  });

  const mascot = header.querySelector(".classic-mascot");
  const canvas = mascot.querySelector("canvas");
  const fallback = mascot.querySelector("img");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let player;
  let visible = true;
  let greeting;
  function syncPlayback() {
    if (!player) return;
    player.destroy();
    player.reducedMotion = motion.matches;
    if (visible && !document.hidden && !motion.matches) player.start();
    else player.draw();
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    syncPlayback();
  });
  observer.observe(mascot);
  motion.addEventListener("change", syncPlayback);
  document.addEventListener("visibilitychange", syncPlayback);
  window.addEventListener("pointermove", event => {
    if (!player || !visible || motion.matches || event.pointerType === "touch") return;
    const bounds = mascot.getBoundingClientRect();
    const reach = Math.max(160, Math.min(innerWidth, innerHeight) * .4);
    player.setGaze((event.clientX - bounds.left - bounds.width / 2) / reach, (event.clientY - bounds.top - bounds.height / 2) / reach);
  }, { passive: true });
  const resetGaze = () => player?.setGaze(0, 0);
  document.addEventListener("pointerleave", resetGaze);
  window.addEventListener("blur", resetGaze);
  mascot.addEventListener("pointerenter", () => {
    if (!player || motion.matches) return;
    clearTimeout(greeting);
    player.setState("waving");
    greeting = setTimeout(() => player.setState("idle"), 1800);
  });

  function loadScript(path) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(path, siteRoot).href;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
  }
  (async () => {
    if (window.XiaoBaPetRuntime?.blogMascotVersion !== "golden-pointer-v1") {
      await loadScript("mascot/xiaoba/grokbot-data.js");
      await loadScript("mascot/xiaoba/pet-runtime.js?v=golden-pointer-v1");
    }
    const response = await fetch(new URL("mascot/xiaoba/pet.json?v=solid-cobalt-white-v4", siteRoot));
    if (!response.ok) return;
    player = new window.XiaoBaPetRuntime.PetPlayer(canvas);
    player.load(await response.json(), { autoplay: false });
    player.setState("idle");
    fallback.hidden = true;
    canvas.hidden = false;
    syncPlayback();
  })().catch(() => { /* Keep the matching static mascot when Canvas is unavailable. */ });
  window.addEventListener("pagehide", () => { clearTimeout(greeting); player?.destroy(); });
  window.addEventListener("pageshow", syncPlayback);
})();
