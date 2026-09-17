(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var headerInner = document.querySelector(".header-inner");
  var toggle = document.querySelector(".nav-toggle");
  if (toggle) toggle.remove();

  var nav = document.querySelector(".site-nav");
  if (!nav && headerInner) {
    nav = document.createElement("nav");
    nav.className = "site-nav";
    nav.id = "site-nav";
    headerInner.appendChild(nav);
  }
  if (nav) {
    nav.setAttribute("aria-label", "F\u0151men\u00fc");
    nav.innerHTML =
      '<ul class="nav-list">' +
      '<li><a class="nav-link" href="index.html">F\u0151oldal</a></li>' +
      '<li><a class="nav-link nav-link--joga" href="joga.html">J\u00f3ga</a></li>' +
      '<li><a class="nav-link nav-link--aid" href="elseosegely.html">Els\u0151seg\u00e9ly</a></li>' +
      '<li><a class="nav-link nav-link--coach" href="coaching.html">Coaching</a></li>' +
      '<li><a class="nav-link nav-link--about" href="rolam.html">R\u00f3lam</a></li>' +
      '<li><a class="nav-cta" href="kapcsolat.html">Foglal\u00e1s</a></li>' +
      "</ul>";
  }

  var topLinks = document.querySelectorAll(".site-nav .nav-list > li > a");
  var currentPage = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (!currentPage || currentPage.indexOf(".") === -1) currentPage = "index.html";
  var yearNode = document.getElementById("year");
  var form = document.getElementById("contact-form");
  var formStatus = document.getElementById("form-status");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (yearNode) yearNode.textContent = String(new Date().getFullYear());

  requestAnimationFrame(function () {
    document.body.classList.add("is-ready");
  });

  function updateActiveNav() {
    topLinks.forEach(function (link) {
      var href = (link.getAttribute("href") || "").split("#")[0].toLowerCase();
      var file = href || currentPage;
      link.classList.toggle("is-active", file === currentPage);
    });
  }

  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 10);
    updateActiveNav();
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var revealItems = document.querySelectorAll(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window && revealItems.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -56px 0px" });
    revealItems.forEach(function (item) { observer.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  }

  if (form && formStatus) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = form.elements.namedItem("name");
      var email = form.elements.namedItem("email");
      var topic = form.elements.namedItem("topic");
      var message = form.elements.namedItem("message");
      var consent = form.elements.namedItem("consent");
      var errors = [];
      if (!name.value.trim()) errors.push("Kérlek add meg a neved.");
      if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        errors.push("Érvényes e-mail címre van szükség.");
      }
      if (!topic.value) errors.push("Válassz témát.");
      if (!message.value.trim() || message.value.trim().length < 10) {
        errors.push("Írj legalább néhány sort az üzenetedbe.");
      }
      if (!consent.checked) errors.push("A kapcsolatfelvételhez az adatkezelés elfogadása szükséges.");
      if (errors.length) {
        formStatus.hidden = false;
        formStatus.className = "form-status is-error";
        formStatus.textContent = errors[0];
        return;
      }
      form.reset();
      formStatus.hidden = false;
      formStatus.className = "form-status is-success";
      formStatus.textContent = "Köszönöm az üzenetet! Hamarosan jelentkezem. (Az űrlap jelenleg bemutató módban működik.)";
    });
  }
})();
