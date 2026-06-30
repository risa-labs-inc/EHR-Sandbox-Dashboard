(function () {
  const navItems = Array.from(document.querySelectorAll("[data-guide-nav]"));
  const panels = Array.from(document.querySelectorAll("[data-guide-panel]"));
  const glancePanels = Array.from(document.querySelectorAll("[data-guide-glance]"));
  if (!navItems.length || !panels.length) return;

  function panelIdFromHash() {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw) return null;
    if (raw.startsWith("guide-")) return raw.slice(6);
    return raw;
  }

  function activate(platformId, updateHash) {
    const id = platformId || navItems[0].dataset.guideNav;
    let found = false;

    navItems.forEach((btn) => {
      const on = btn.dataset.guideNav === id;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-current", on ? "true" : "false");
      if (on) found = true;
    });

    if (!found) return false;

    panels.forEach((panel) => {
      const on = panel.dataset.guidePanel === id;
      panel.classList.toggle("is-active", on);
      panel.hidden = !on;
    });

    glancePanels.forEach((panel) => {
      const on = panel.dataset.guideGlance === id;
      panel.classList.toggle("is-active", on);
      panel.hidden = !on;
    });

    if (updateHash !== false) {
      const nextHash = `#guide-${id}`;
      if (window.location.hash !== nextHash) {
        history.replaceState(null, "", nextHash);
      }
    }

    return true;
  }

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => activate(btn.dataset.guideNav));
  });

  window.addEventListener("hashchange", () => {
    const id = panelIdFromHash();
    if (id) activate(id, false);
  });

  const hashId = panelIdFromHash();
  if (hashId && !activate(hashId, false)) {
    activate(navItems[0].dataset.guideNav);
  }

  window.guideActivatePlatform = activate;
})();
