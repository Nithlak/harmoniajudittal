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
    ".subtype, .aid-course, .social-card, .contact-box, .event-slider, .cal, " +
    ".editorial__visual, .about__photo-wrap, main form, .contact-shell";
  var revealCopy =
    "main h1, main h2, main h3, main .eyebrow, main .lead, main p, " +
    ".event-slide, .calendar-intro, .social-intro, " +
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

  (function initEventSlider() {
    var root = document.querySelector("[data-event-slider]");
    if (!root) return;
    var frame = root.querySelector(".event-slider__frame");
    var startX = 0;

    function show(which, fromUser) {
      var toPrev = which === "prev";
      if (toPrev && !root.classList.contains("has-prev")) toPrev = false;
      root.classList.toggle("is-prev", toPrev);
      if (fromUser) {
        var box = root.closest(".event") || root;
        box.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
      }
      root.querySelectorAll("[data-event-slide]").forEach(function (slide) {
        slide.classList.toggle("is-active", slide.getAttribute("data-event-slide") === (toPrev ? "prev" : "next"));
      });
      var prevBtn = root.querySelector("[data-event-prev]");
      var nextBtn = root.querySelector("[data-event-next]");
      if (prevBtn) prevBtn.disabled = toPrev;
      if (nextBtn) nextBtn.disabled = !toPrev;
      root.querySelectorAll("[data-event-goto]").forEach(function (dot) {
        var on = dot.getAttribute("data-event-goto") === (toPrev ? "prev" : "next");
        dot.classList.toggle("is-active", on);
        dot.setAttribute("aria-selected", on ? "true" : "false");
      });
    }

    root.addEventListener("click", function (e) {
      var prev = e.target.closest("[data-event-prev]");
      var next = e.target.closest("[data-event-next]");
      var dot = e.target.closest("[data-event-goto]");
      if (prev && !prev.disabled) show("prev", true);
      if (next && !next.disabled) show("next", true);
      if (dot) show(dot.getAttribute("data-event-goto"), true);
    });

    if (frame) {
      frame.addEventListener("pointerdown", function (e) {
        if (e.target.closest(".event__poster")) {
          startX = null;
          return;
        }
        startX = e.clientX;
      });
      frame.addEventListener("pointerup", function (e) {
        if (startX == null) return;
        var dx = e.clientX - startX;
        if (Math.abs(dx) < 50) return;
        if (dx < 0) show("prev", true);
        else show("next", true);
      });
    }

    document.addEventListener("keydown", function (e) {
      if (!root.contains(document.activeElement) && !root.matches(":hover")) return;
      if (e.key === "ArrowLeft") show("prev", true);
      if (e.key === "ArrowRight") show("next", true);
    });

    show("next");
  })();

  (function initPosterZoom() {
    if (!window.matchMedia("(max-width: 699px)").matches) return;
    var images = Array.prototype.slice.call(document.querySelectorAll(".page-home .event__poster img"));
    if (!images.length) return;

    images.forEach(function (img) {
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", (img.getAttribute("alt") || "\u00d3rarend") + " \u2014 nagy\u00edt\u00e1s");
    });

    var overlay = document.createElement("div");
    overlay.className = "poster-zoom";
    overlay.setAttribute("hidden", "");
    overlay.innerHTML =
      '<button type="button" class="poster-zoom__close" aria-label="Bez\u00e1r\u00e1s">&times;</button>' +
      '<button type="button" class="poster-zoom__nav poster-zoom__nav--prev" aria-label="El\u0151z\u0151 \u00f3rarend">&lsaquo;</button>' +
      '<div class="poster-zoom__stage">' +
        '<img class="poster-zoom__img" alt="">' +
      "</div>" +
      '<button type="button" class="poster-zoom__nav poster-zoom__nav--next" aria-label="K\u00f6vetkez\u0151 \u00f3rarend">&rsaquo;</button>' +
      '<p class="poster-zoom__hint">Csippentsd vagy koppints k\u00e9tszer a nagy\u00edt\u00e1shoz</p>';
    document.body.appendChild(overlay);

    var stage = overlay.querySelector(".poster-zoom__stage");
    var view = overlay.querySelector(".poster-zoom__img");
    var closeBtn = overlay.querySelector(".poster-zoom__close");
    var prevNav = overlay.querySelector(".poster-zoom__nav--prev");
    var nextNav = overlay.querySelector(".poster-zoom__nav--next");
    var group = [];
    var index = 0;
    var scale = 1;
    var tx = 0;
    var ty = 0;
    var startScale = 1;
    var startTx = 0;
    var startTy = 0;
    var pinchStart = 0;
    var lastTap = 0;
    var pointers = {};
    var dragging = false;
    var dragX = 0;
    var dragY = 0;

    function apply() {
      view.style.transform = "translate(" + tx + "px, " + ty + "px) scale(" + scale + ")";
    }

    function resetZoom() {
      scale = 1;
      tx = 0;
      ty = 0;
      apply();
    }

    function pointerCount() {
      return Object.keys(pointers).length;
    }

    function pinchDist() {
      var ids = Object.keys(pointers);
      if (ids.length < 2) return 0;
      var a = pointers[ids[0]];
      var b = pointers[ids[1]];
      var dx = a.x - b.x;
      var dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function showIndex(i) {
      if (!group.length) return;
      index = (i + group.length) % group.length;
      var srcImg = group[index];
      view.src = srcImg.currentSrc || srcImg.src;
      view.alt = srcImg.alt || "";
      var many = group.length > 1;
      prevNav.hidden = !many;
      nextNav.hidden = !many;
      resetZoom();
    }

    function open(img) {
      var figure = img.closest(".event__poster");
      group = figure ? Array.prototype.slice.call(figure.querySelectorAll("img")) : [img];
      index = Math.max(0, group.indexOf(img));
      showIndex(index);
      overlay.hidden = false;
      document.body.classList.add("poster-zoom-open");
    }

    function close() {
      overlay.hidden = true;
      document.body.classList.remove("poster-zoom-open");
      pointers = {};
      dragging = false;
      resetZoom();
    }

    images.forEach(function (img) {
      img.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        open(img);
      });
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(img);
        }
      });
    });

    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      close();
    });
    prevNav.addEventListener("click", function (e) {
      e.stopPropagation();
      showIndex(index - 1);
    });
    nextNav.addEventListener("click", function (e) {
      e.stopPropagation();
      showIndex(index + 1);
    });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", function (e) {
      if (overlay.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") showIndex(index - 1);
      if (e.key === "ArrowRight") showIndex(index + 1);
    });

    stage.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      stage.setPointerCapture(e.pointerId);
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (pointerCount() === 1) {
        dragging = true;
        dragX = e.clientX;
        dragY = e.clientY;
        startTx = tx;
        startTy = ty;
        var now = Date.now();
        if (now - lastTap < 280) {
          if (scale > 1.05) resetZoom();
          else {
            scale = 2.4;
            apply();
          }
          lastTap = 0;
        } else {
          lastTap = now;
        }
      } else if (pointerCount() === 2) {
        dragging = false;
        pinchStart = pinchDist();
        startScale = scale;
      }
    });

    stage.addEventListener("pointermove", function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (pointerCount() === 2 && pinchStart) {
        var dist = pinchDist();
        scale = Math.min(4, Math.max(1, startScale * (dist / pinchStart)));
        if (scale <= 1.02) {
          tx = 0;
          ty = 0;
        }
        apply();
      } else if (dragging && scale > 1.02) {
        tx = startTx + (e.clientX - dragX);
        ty = startTy + (e.clientY - dragY);
        apply();
      }
    });

    function endPointer(e) {
      delete pointers[e.pointerId];
      if (pointerCount() < 2) pinchStart = 0;
      if (pointerCount() === 0) dragging = false;
      if (scale < 1.05) resetZoom();
    }

    stage.addEventListener("pointerup", endPointer);
    stage.addEventListener("pointercancel", endPointer);
  })();
})();
