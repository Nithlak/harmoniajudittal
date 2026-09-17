(function () {
  "use strict";

  var CODE = "judit26";
  var KEY = "pm-preview";
  var LOCKED = [
    "joga.html",
    "elseosegely.html",
    "coaching.html",
    "rolam.html",
    "kapcsolat.html"
  ];

  function fileName() {
    var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (!file || file.indexOf(".") === -1) file = "index.html";
    return file;
  }

  function unlocked() {
    try { return sessionStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  }

  function unlock() {
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  }

  function isLockedHref(href) {
    var file = String(href || "").split("#")[0].split("?")[0].split("/").pop().toLowerCase();
    return LOCKED.indexOf(file) !== -1;
  }

  var current = fileName();
  var pageLocked = isLockedHref(current) && !unlocked();
  if (pageLocked) document.documentElement.classList.add("is-preview-locked");

  function markNav() {
    document.querySelectorAll("a[href]").forEach(function (link) {
      if (!isLockedHref(link.getAttribute("href"))) return;
      link.classList.toggle("is-preview-locked-link", !unlocked());
    });
  }

  function closeGate(node) {
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  function showGate(opts) {
    opts = opts || {};
    if (document.querySelector(".preview-gate")) return;

    var gate = document.createElement("div");
    gate.className = "preview-gate";
    gate.innerHTML =
      '<div class="preview-gate__card">' +
        '<p class="eyebrow">El\u0151n\u00e9zet</p>' +
        '<' + 'h2>Ez a r\u00e9sz m\u00e9g k\u00e9sz\u00fcl</h2>' +
        '<p>A f\u0151oldal szabadon n\u00e9zhet\u0151. A t\u00f6bbi men\u00fcponthoz megtekint\u0151 k\u00f3d kell.</p>' +
        '<form class="preview-gate__form">' +
          '<label class="visually-hidden" for="preview-code">Megtekint\u0151 k\u00f3d</label>' +
          '<input id="preview-code" type="password" autocomplete="off" placeholder="Megtekint\u0151 k\u00f3d">' +
          '<button class="btn btn--primary" type="submit">Megnyit\u00e1s</button>' +
        '</form>' +
        '<p class="preview-gate__error" hidden>Nem ez a k\u00f3d.</p>' +
        '<div class="preview-gate__actions"></div>' +
      '</div>';

    var actions = gate.querySelector(".preview-gate__actions");
    if (opts.allowClose) {
      var cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "btn btn--ghost";
      cancel.textContent = "M\u00e9gse";
      cancel.addEventListener("click", function () { closeGate(gate); });
      actions.appendChild(cancel);
    } else {
      var home = document.createElement("a");
      home.className = "btn btn--ghost";
      home.href = "index.html";
      home.textContent = "Vissza a f\u0151oldalra";
      actions.appendChild(home);
    }

    gate.querySelector("form").addEventListener("submit", function (event) {
      event.preventDefault();
      var input = gate.querySelector("input");
      var err = gate.querySelector(".preview-gate__error");
      if ((input.value || "").trim().toLowerCase() === CODE) {
        unlock();
        document.documentElement.classList.remove("is-preview-locked");
        markNav();
        closeGate(gate);
        if (opts.onUnlock) opts.onUnlock();
      } else {
        err.hidden = false;
        input.focus();
        input.select();
      }
    });

    document.body.appendChild(gate);
    var field = gate.querySelector("input");
    if (field) field.focus();
  }

  function boot() {
    markNav();

    document.addEventListener("click", function (event) {
      if (unlocked()) return;
      var link = event.target.closest("a[href]");
      if (!link || !isLockedHref(link.getAttribute("href"))) return;
      event.preventDefault();
      showGate({
        allowClose: true,
        onUnlock: function () { location.href = link.href; }
      });
    });

    if (pageLocked) showGate({ allowClose: false });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
