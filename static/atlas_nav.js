(function () {
  const scrollRoot = document.getElementById("atlas-scroll-root");
  const navItems = Array.from(document.querySelectorAll("[data-atlas-section]"));
  const sections = Array.from(document.querySelectorAll("[data-atlas-section-target]"));
  if (!scrollRoot || !navItems.length || !sections.length) return;

  let scrollTicking = false;
  let suppressScrollSpy = false;

  function sectionIdFromHash() {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw) return null;
    const match = raw.match(/^atlas-cat-(\d+)$/);
    return match ? match[1] : null;
  }

  function setActiveSection(sectionId, updateHash) {
    const id = sectionId || navItems[0].dataset.atlasSection;
    let found = false;

    navItems.forEach((btn) => {
      const on = btn.dataset.atlasSection === id;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-current", on ? "true" : "false");
      if (on) found = true;
    });

    if (!found) return false;

    if (updateHash !== false) {
      const nextHash = `#atlas-cat-${id}`;
      if (window.location.hash !== nextHash) {
        history.replaceState(null, "", nextHash);
      }
    }

    return true;
  }

  function activeSectionFromScroll() {
    const rootRect = scrollRoot.getBoundingClientRect();
    const marker = rootRect.top + Math.min(120, rootRect.height * 0.2);
    let active = sections[0];

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= marker) active = section;
    });

    return active.dataset.atlasSectionTarget;
  }

  function onScroll() {
    if (suppressScrollSpy) return;
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(() => {
      scrollTicking = false;
      setActiveSection(activeSectionFromScroll(), true);
    });
  }

  function scrollToSection(sectionId, updateHash) {
    const section = sections.find((item) => item.dataset.atlasSectionTarget === sectionId);
    if (!section) return false;

    suppressScrollSpy = true;
    setActiveSection(sectionId, updateHash);

    const rootRect = scrollRoot.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    const top = scrollRoot.scrollTop + (sectionRect.top - rootRect.top) - 12;

    scrollRoot.scrollTo({ top: Math.max(0, top), behavior: "smooth" });

    window.setTimeout(() => {
      suppressScrollSpy = false;
      setActiveSection(sectionId, updateHash);
    }, 450);

    return true;
  }

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => scrollToSection(btn.dataset.atlasSection));
  });

  window.addEventListener("hashchange", () => {
    const id = sectionIdFromHash();
    if (id) scrollToSection(id, false);
  });

  scrollRoot.addEventListener("scroll", onScroll, { passive: true });

  const hashId = sectionIdFromHash();
  if (hashId && !scrollToSection(hashId, false)) {
    setActiveSection(navItems[0].dataset.atlasSection, true);
  } else if (!hashId) {
    setActiveSection(navItems[0].dataset.atlasSection, false);
  }
})();
