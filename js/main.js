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

  var revealBlocks =
    ".subtype, .aid-course, .social-card, .contact-box, .event__poster, .cal, " +
    ".editorial__visual, .about__photo-wrap, main form, .contact-shell";
  var revealCopy =
    "main h1, main h2, main h3, main .eyebrow, main .lead, main p, " +
    ".event__intro, .event__copy, .calendar-intro, .social-intro, " +
    ".about__copy, .editorial__copy, .contact-details";

  document.querySelectorAll(revealBlocks).forEach(function (el) {
    if (el.closest("header, footer, .site-nav, .hero")) return;
    if (el.matches("form") && el.closest(".contact-shell")) return;
    el.classList.add("reveal");
  });

  document.querySelectorAll(revealCopy).forEach(function (el) {
    if (el.closest("header, footer, .site-nav, .hero")) return;
    if (el.closest(revealBlocks)) return;
    if (el.matches("p") && !el.textContent.trim()) return;
    el.classList.add("reveal");
  });

  document.querySelectorAll(".reveal").forEach(function (el) {
    if (el.querySelector(".reveal")) el.classList.remove("reveal");
  });

  document.querySelectorAll(".subtype-stack, .aid-courses, .social-grid, .contact-details").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (kid, index) {
      if (!kid.classList || !kid.classList.contains("reveal") || !index) return;
      kid.setAttribute("data-d", String(Math.min(index, 2)));
    });
  });

  var revealItems = document.querySelectorAll(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window && revealItems.length) {
    var mobile = window.matchMedia("(max-width: 899px)").matches;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: mobile ? 0.06 : 0.1,
      rootMargin: mobile ? "0px 0px -24px 0px" : "0px 0px -10% 0px"
    });
    revealItems.forEach(function (item) { observer.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  }

  if (form && formStatus) {
    var formOpenedAt = Date.now();
    var checkA = 2 + Math.floor(Math.random() * 5);
    var checkB = 1 + Math.floor(Math.random() * 6);
    var checkSum = String(checkA + checkB);
    var checkLabel = form.querySelector("[data-human-check-label]");
    if (checkLabel) checkLabel.textContent = "Mennyi " + checkA + " + " + checkB + "?";
    var nextField = form.querySelector("input[name='_next']");
    if (nextField) {
      nextField.value = location.origin + location.pathname.replace(/\/$/, "") + "?elkuldve=1";
    }
    if (/(?:\?|&)elkuldve=1(?:&|$)/.test(location.search)) {
      formStatus.hidden = false;
      formStatus.className = "form-status is-success";
      formStatus.textContent = "K\u00f6sz\u00f6n\u00f6m az \u00fczenetet! Hamarosan jelentkezem.";
    }

    function showStatus(type, text) {
      formStatus.hidden = false;
      formStatus.className = "form-status is-" + type;
      formStatus.textContent = text;
    }

    form.addEventListener("submit", function (event) {
      if (form.getAttribute("data-ok") === "1") return;
      event.preventDefault();

      var honey = form.elements.namedItem("_honey");
      var name = form.elements.namedItem("name");
      var email = form.elements.namedItem("email");
      var topic = form.elements.namedItem("topic");
      var message = form.elements.namedItem("message");
      var consent = form.elements.namedItem("consent");
      var human = form.elements.namedItem("human_check");
      var submitBtn = form.querySelector("button[type='submit']");
      var errors = [];

      if (honey && honey.value.trim()) {
        showStatus("success", "K\u00f6sz\u00f6n\u00f6m az \u00fczenetet! Hamarosan jelentkezem.");
        return;
      }
      if (Date.now() - formOpenedAt < 2500) {
        errors.push("K\u00e9rlek v\u00e1rj egy pillanatot, \u00e9s k\u00fcldd el \u00fajra.");
      }
      if (!name || !name.value.trim()) errors.push("K\u00e9rlek add meg a neved.");
      if (!email || !email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        errors.push("\u00c9rv\u00e9nyes e-mail c\u00edmre van sz\u00fcks\u00e9g.");
      }
      if (!topic || !topic.value) errors.push("V\u00e1lassz t\u00e9m\u00e1t.");
      if (!message || !message.value.trim() || message.value.trim().length < 10) {
        errors.push("\u00cdrj legal\u00e1bb n\u00e9h\u00e1ny sort az \u00fczenetedbe.");
      }
      if (!human || human.value.replace(/\s/g, "") !== checkSum) {
        errors.push("Az ellen\u0151rz\u0151 k\u00e9rd\u00e9sre a helyes \u00f6sszeget \u00edrd be.");
      }
      if (!consent || !consent.checked) {
        errors.push("A kapcsolatfelv\u00e9telhez az adatkezel\u00e9s elfogad\u00e1sa sz\u00fcks\u00e9ges.");
      }
      if (errors.length) {
        showStatus("error", errors[0]);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "K\u00fcld\u00e9s...";
      }
      showStatus("success", "K\u00fcld\u00e9s folyamatban...");

      var payload = {
        name: name.value.trim(),
        email: email.value.trim(),
        topic: topic.value,
        phone: (form.elements.namedItem("phone") && form.elements.namedItem("phone").value.trim()) || "-",
        message: message.value.trim(),
        _subject: "\u00daj \u00fczenet a weboldalr\u00f3l",
        _template: "table",
        _captcha: "false"
      };

      fetch("https://formsubmit.co/ajax/tothj@tmmt.hu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      }).then(function (response) {
        if (!response.ok) throw new Error("send-failed");
        return response.json();
      }).then(function () {
        form.reset();
        if (checkLabel) checkLabel.textContent = "Mennyi " + checkA + " + " + checkB + "?";
        showStatus("success", "K\u00f6sz\u00f6n\u00f6m az \u00fczenetet! Hamarosan jelentkezem a megadott e-mail c\u00edmen.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "\u00dczenet k\u00fcld\u00e9se";
        }
      }).catch(function () {
        form.setAttribute("data-ok", "1");
        form.submit();
      });
    });
  }
})();
