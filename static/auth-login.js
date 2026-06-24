// Login page controller: Google sign-in restricted to the allowed Workspace domain.
(function () {
  var dom = (window.__ALLOWED_DOMAIN__ || "").toLowerCase();
  var params = new URLSearchParams(location.search);
  var next = params.get("next") || "/";

  var btn = document.getElementById("google-signin");
  var err = document.getElementById("auth-error");

  function showError(msg) {
    if (!err) return;
    err.textContent = msg;
    err.hidden = false;
  }

  if (params.get("error") === "domain") {
    showError("Please sign in with your @" + dom + " account.");
  }

  if (!window.firebase || !window.__FIREBASE_CONFIG__) {
    showError("Authentication failed to load. Please refresh.");
    return;
  }

  if (!firebase.apps.length) firebase.initializeApp(window.__FIREBASE_CONFIG__);
  var auth = firebase.auth();

  function allowed(user) {
    return !!(user && user.email && user.email.toLowerCase().endsWith("@" + dom));
  }

  // Already signed in with the right account → skip the login screen.
  auth.onAuthStateChanged(function (user) {
    if (allowed(user)) location.replace(next);
  });

  if (btn) {
    btn.addEventListener("click", function () {
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ hd: dom, prompt: "select_account" });
      auth.signInWithPopup(provider).then(function (res) {
        if (allowed(res.user)) {
          location.replace(next);
        } else {
          auth.signOut().then(function () {
            showError("Only @" + dom + " accounts are allowed.");
          });
        }
      }).catch(function (e) {
        if (e && e.code === "auth/popup-closed-by-user") return;
        showError(e && e.message ? e.message : "Sign-in failed. Please try again.");
      });
    });
  }
})();
