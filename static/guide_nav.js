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

  // Prepare the active platform for print: branded header, single report, date.
  function preparePrint() {
    var panel = document.querySelector("[data-guide-panel].is-active");
    var id = panel ? panel.dataset.guidePanel : null;
    var name = "Platform Guide";
    if (panel) {
      var navBtn = document.querySelector('[data-guide-nav="' + id + '"]');
      if (navBtn && navBtn.textContent.trim()) name = navBtn.textContent.trim();
    }

    // Header: RISA logo · "<Name> Platform Guide" · platform logo
    var nameEl = document.getElementById("printPlatformName");
    var logoEl = document.getElementById("printPlatformLogo");
    if (nameEl) nameEl.textContent = name + " Platform Guide";
    if (logoEl && panel) {
      var logo = panel.querySelector(".guide-platform-logo");
      if (logo) { logoEl.src = logo.src; logoEl.alt = logo.alt || ""; }
    }

    // Show only the active platform's print report.
    document.querySelectorAll("[data-guide-print]").forEach(function (wrap) {
      wrap.hidden = wrap.dataset.guidePrint !== id;
    });

    // Stamp the generation date in the report footer.
    var dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    document.querySelectorAll(".gpr-date").forEach(function (el) { el.textContent = dateStr; });

    return name;
  }

  var exportBtn = document.getElementById("guideExportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      var name = preparePrint();
      var shell = document.querySelector(".guide-shell");
      window.exportToPdf(shell, name + " Platform Guide");
    });
  }

  // Deep link (?export=1) — pre-activate the print report (used for headless PDF capture).
  if (new URLSearchParams(window.location.search).get("export") === "1") {
    preparePrint();
  }
})();
