(function () {
  const input = document.getElementById("guide-search");
  if (!input) return;

  const clearBtn = document.getElementById("guide-search-clear");
  const status = document.getElementById("guide-search-status");
  const platforms = Array.from(document.querySelectorAll(".guide-platform"));
  const categories = Array.from(document.querySelectorAll(".guide-category"));

  function normalize(value) {
    return value.toLowerCase().trim();
  }

  function filter() {
    const terms = normalize(input.value).split(/\s+/).filter(Boolean);
    let visible = 0;

    platforms.forEach((article) => {
      const haystack = normalize(article.textContent);
      const match = !terms.length || terms.every((term) => haystack.includes(term));
      article.hidden = !match;
      if (match) visible += 1;
    });

    categories.forEach((section) => {
      const hasVisible = section.querySelector(".guide-platform:not([hidden])");
      section.hidden = !hasVisible;
    });

    if (terms.length) {
      status.hidden = false;
      status.textContent = visible
        ? `${visible} platform${visible === 1 ? "" : "s"}`
        : "No platforms match your search.";
    } else {
      status.hidden = true;
      status.textContent = "";
    }

    if (clearBtn) clearBtn.hidden = !input.value;
  }

  input.addEventListener("input", filter);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      filter();
      input.focus();
    });
  }

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      input.value = "";
      filter();
      input.blur();
    }
  });
})();
