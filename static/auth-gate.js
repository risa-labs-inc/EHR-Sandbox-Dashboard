// Client-side auth gate. Included on every content page. Hides the page until a
// signed-in @risalabs.ai user is confirmed; otherwise redirects to /login.html.
//
// NOTE: this gates the UI only. The static files remain publicly reachable by
// direct URL — this is a convenience/branding login wall, not hard security.
(function () {
  var dom = (window.__ALLOWED_DOMAIN__ || "").toLowerCase();
  var host = location.hostname;

  function reveal() {
    document.documentElement.style.visibility = "";
  }

  // Local development bypass — no gate on localhost.
  if (host === "localhost" || host === "127.0.0.1" || host === "") {
    reveal();
    return;
  }

  if (!window.firebase || !window.__FIREBASE_CONFIG__) {
    // SDK failed to load; fail open to avoid locking everyone out hard.
    reveal();
    return;
  }

  if (!firebase.apps.length) firebase.initializeApp(window.__FIREBASE_CONFIG__);

  function isAllowed(user) {
    return !!(user && user.email && user.email.toLowerCase().endsWith("@" + dom));
  }

  function wireSignout(user) {
    document.querySelectorAll("[data-user-email]").forEach(function (el) {
      el.textContent = user.email || "";
    });
    document.querySelectorAll("[data-signout]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        firebase.auth().signOut().then(function () {
          location.replace("/login.html");
        });
      });
    });
  }

  firebase.auth().onAuthStateChanged(function (user) {
    if (isAllowed(user)) {
      reveal();
      wireSignout(user);
    } else if (user) {
      firebase.auth().signOut().then(function () {
        location.replace("/login.html?error=domain");
      });
    } else {
      var here = location.pathname + location.search;
      location.replace("/login.html?next=" + encodeURIComponent(here));
    }
  });
})();
