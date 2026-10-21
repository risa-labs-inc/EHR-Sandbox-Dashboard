// Client-side PDF export.
//
// Renders the given element to a clean A4 PDF using html2pdf.js
// (html2canvas + jsPDF). Because the PDF is built from a canvas snapshot of
// the page — not the browser's print pipeline — there is NO browser
// header/footer, so the page URL and title never leak into the file.
//
// While rendering, a full-screen "Preparing your PDF…" overlay is shown so the
// report-layout reflow happens behind it — the user sees a smooth, calm
// transition instead of the page visibly zooming/reflowing.
//
// Usage:  window.exportToPdf(element, "Some Title")
(function () {
  var LIB_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";

  function ensureLib() {
    return new Promise(function (resolve, reject) {
      if (window.html2pdf) return resolve();
      var s = document.createElement("script");
      s.src = LIB_URL;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("Could not load the PDF library (check your connection)")); };
      document.head.appendChild(s);
    });
  }

  function showOverlay() {
    var ov = document.createElement("div");
    ov.className = "pdf-export-overlay";
    ov.innerHTML =
      '<div class="pdf-export-overlay-box">' +
      '<div class="pdf-export-spinner"></div>' +
      '<div class="pdf-export-overlay-title">Preparing your PDF…</div>' +
      '<div class="pdf-export-overlay-sub">This usually takes a few seconds</div>' +
      "</div>";
    document.body.appendChild(ov);
    return ov;
  }

  // Wait two animation frames so the overlay is painted before we reflow.
  function nextFrame() {
    return new Promise(function (r) {
      requestAnimationFrame(function () { requestAnimationFrame(r); });
    });
  }

  window.exportToPdf = async function (el, filename) {
    if (!el) return;
    var btn = document.querySelector(".export-pdf-btn");
    var originalBtnHtml = btn ? btn.innerHTML : null;
    var overlay = null;
    try {
      if (btn) { btn.disabled = true; btn.classList.add("is-exporting"); }

      // Show the overlay first and let it paint, so the report-layout reflow
      // that follows happens behind it (no visible zoom).
      overlay = showOverlay();
      await nextFrame();

      await ensureLib();

      // Force the report layout (no rail / top bar, branded header, full flow)
      // so the capture looks like the document, not the app chrome.
      document.documentElement.classList.add("pdf-exporting");
      await new Promise(function (r) { setTimeout(r, 120); });

      await window.html2pdf().set({
        margin: [10, 12, 12, 12],
        filename: (filename || "export") + ".pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          ignoreElements: function (node) {
            return !!(node.classList && node.classList.contains("pdf-export-overlay"));
          }
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: {
          mode: ["css", "legacy"],
          avoid: [
            ".subpanel",
            ".field",
            ".panel-head",
            ".gpr-section",
            ".gpr-section-head",
            ".gpr-research",
            ".gpr-table tr",
            ".gpr-table-wrap",
            ".gpr-glance"
          ]
        }
      }).from(el).save();
    } catch (err) {
      console.error("PDF export failed:", err);
      window.alert("PDF export failed: " + (err && err.message ? err.message : err));
    } finally {
      document.documentElement.classList.remove("pdf-exporting");
      if (overlay) overlay.remove();
      if (btn && originalBtnHtml) {
        btn.disabled = false;
        btn.classList.remove("is-exporting");
        btn.innerHTML = originalBtnHtml;
      }
    }
  };
})();