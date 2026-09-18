(function () {
  "use strict";

  function $(sel, root) { return (root || document).querySelector(sel); }

  var MONTHS = [
    "janu\u00e1r", "febru\u00e1r", "m\u00e1rcius", "\u00e1prilis", "m\u00e1jus", "j\u00fanius",
    "j\u00falius", "augusztus", "szeptember", "okt\u00f3ber", "november", "december"
  ];
  var DEFAULT_POSTER = "images/oszi-joga.png";

  var loginView = $("#login-view");
  var panelView = $("#panel-view");
  var loginForm = $("#login-form");
  var loginErr = $("#login-error");
  var eventForm = $("#event-form");
  var calForm = $("#cal-form");
  var calList = $("#cal-list");
  var calMode = $("#cal-mode");
  var calSubmit = $("#cal-submit");
  var saveBtn = $("#save-btn");
  var saveStatus = $("#save-status");
  var dropZone = $("#drop-zone");
  var posterFile = $("#poster-file");
  var posterPreview = $("#poster-preview");
  var posterStatus = $("#poster-status");
  var dropCopy = $("#drop-copy");
  var liveImage = $("#live-image");
  var liveTitle = $("#live-title");
  var liveWhen = $("#live-when");
  var calVisible = $("#cal-visible");

  var editingId = "";
  var posterSrc = DEFAULT_POSTER;
  var savedSnap = "";
  var whenTouched = false;

  function typeLabel(type) {
    return type === "aid" ? "Els\u0151seg\u00e9ly" : type === "coach" ? "Coaching" : "J\u00f3ga";
  }

  function formatWhen(date, time) {
    if (!date) return "";
    var p = String(date).split("-");
    var month = MONTHS[Number(p[1]) - 1] || "";
    var day = String(Number(p[2]));
    var clock = time || "";
    return p[0] + ". " + month + " " + day + "." + (clock ? " \u2022 " + clock : "");
  }

  function formatListDate(iso) {
    var p = String(iso || "").split("-");
    if (p.length < 3) return iso || "";
    return Number(p[2]) + ". " + (MONTHS[Number(p[1]) - 1] || "");
  }

  function dirty() {
    return JSON.stringify(collect()) !== savedSnap;
  }

  function setStatus(text, ok) {
    saveStatus.textContent = text;
    saveStatus.classList.toggle("ok", !!ok);
  }

  function markSaved() {
    savedSnap = JSON.stringify(collect());
  }

  function showPoster(src) {
    posterSrc = src || "";
    window.HJStore.resolveImage(posterSrc, function (url) {
      var show = !!url;
      posterPreview.hidden = !show;
      dropCopy.hidden = show;
      if (show) {
        posterPreview.src = url;
        liveImage.src = url;
        liveImage.hidden = false;
      } else {
        liveImage.removeAttribute("src");
        liveImage.hidden = true;
      }
    });
    updateLive();
  }

  function updateLive() {
    var title = (eventForm.title.value || "") + (eventForm.titleEm.value ? " " + eventForm.titleEm.value : "");
    liveTitle.textContent = title || "K\u00f6vetkez\u0151 esem\u00e9ny";
    liveWhen.textContent = eventForm.when.value || formatWhen(eventForm.date.value, eventForm.time.value);
  }

  function syncWhen() {
    if (whenTouched && eventForm.when.value) return;
    eventForm.when.value = formatWhen(eventForm.date.value, eventForm.time.value);
    updateLive();
  }

  function fillEvent() {
    var ev = (window.HJStore.current().nextEvent) || {};
    eventForm.visible.checked = ev.visible !== false;
    eventForm.title.value = ev.title || "";
    eventForm.titleEm.value = ev.titleEm || "";
    eventForm.date.value = ev.date || "";
    eventForm.time.value = ev.time || "";
    eventForm.when.value = ev.when || formatWhen(ev.date, ev.time);
    eventForm.price.value = ev.price || "";
    eventForm.place.value = ev.place || "";
    eventForm.lead.value = ev.lead || "";
    eventForm.p1.value = ev.p1 || "";
    eventForm.p2.value = ev.p2 || "";
    eventForm.imageAlt.value = ev.imageAlt || "";
    eventForm.cta.value = ev.cta || "Jelentkezem az \u00f3r\u00e1ra";
    var href = ev.ctaHref || "kapcsolat.html";
    if (![].some.call(eventForm.ctaHref.options, function (o) { return o.value === href; })) {
      var opt = document.createElement("option");
      opt.value = href;
      opt.textContent = href;
      eventForm.ctaHref.appendChild(opt);
    }
    eventForm.ctaHref.value = href;
    whenTouched = false;
    showPoster(ev.image || DEFAULT_POSTER);
    updateLive();
  }

  function readEvent() {
    return {
      visible: eventForm.visible.checked,
      title: eventForm.title.value.trim(),
      titleEm: eventForm.titleEm.value.trim(),
      image: posterSrc || DEFAULT_POSTER,
      imageAlt: eventForm.imageAlt.value.trim() || eventForm.title.value.trim(),
      date: eventForm.date.value,
      time: eventForm.time.value,
      lead: eventForm.lead.value.trim(),
      p1: eventForm.p1.value.trim(),
      p2: eventForm.p2.value.trim(),
      when: eventForm.when.value.trim() || formatWhen(eventForm.date.value, eventForm.time.value),
      price: eventForm.price.value.trim(),
      place: eventForm.place.value.replace(/\r\n/g, "\n"),
      cta: eventForm.cta.value.trim() || "Jelentkezem az \u00f3r\u00e1ra",
      ctaHref: eventForm.ctaHref.value || "kapcsolat.html"
    };
  }

  function resetCalForm() {
    editingId = "";
    calMode.textContent = "\u00daj id\u0151pont hozz\u00e1ad\u00e1sa";
    calSubmit.textContent = "Hozz\u00e1ad\u00e1s";
    calForm.reset();
    var today = new Date();
    var month = String(today.getMonth() + 1).padStart(2, "0");
    var day = String(today.getDate()).padStart(2, "0");
    calForm.date.value = today.getFullYear() + "-" + month + "-" + day;
    calForm.time.value = "18:00";
    calForm.type.value = "joga";
    renderCal();
  }

  function fillCal(item) {
    editingId = item.id || "";
    calForm.date.value = item.date || "";
    calForm.time.value = item.time || "18:00";
    calForm.type.value = item.type || "joga";
    calForm.title.value = item.title || "";
    calForm.place.value = item.place || "";
    calForm.note.value = item.note || "";
    calMode.textContent = editingId ? "Id\u0151pont szerkeszt\u00e9se" : "\u00daj id\u0151pont hozz\u00e1ad\u00e1sa";
    calSubmit.textContent = editingId ? "Ment\u00e9s az id\u0151pontra" : "Hozz\u00e1ad\u00e1s";
    renderCal();
  }

  function renderCal() {
    var events = window.HJStore.current().events || [];
    events = events.slice().sort(function (a, b) {
      return String(a.date).localeCompare(String(b.date)) || String(a.time || "").localeCompare(String(b.time || ""));
    });
    calList.innerHTML = "";
    if (!events.length) {
      var empty = document.createElement("li");
      empty.className = "hint";
      empty.textContent = "M\u00e9g nincs esem\u00e9ny. T\u00f6ltd ki fent, \u00e9s nyomj Hozz\u00e1ad\u00e1st.";
      calList.appendChild(empty);
      return;
    }
    events.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "cal-row" + (item.id === editingId ? " is-on" : "") + " cal-row--" + (item.type || "joga");
      li.tabIndex = 0;
      var info = document.createElement("div");
      var strong = document.createElement("strong");
      strong.textContent = item.title || "Esem\u00e9ny";
      var small = document.createElement("small");
      small.textContent = formatListDate(item.date) + " \u00b7 " + (item.time || "") + " \u00b7 " + typeLabel(item.type);
      info.appendChild(strong);
      info.appendChild(small);
      var btns = document.createElement("div");
      btns.className = "cal-row__btns";
      var dup = document.createElement("button");
      dup.type = "button";
      dup.className = "btn btn--ghost btn--tiny";
      dup.textContent = "M\u00e1solat";
      dup.addEventListener("click", function (e) {
        e.stopPropagation();
        duplicateEvent(item);
      });
      var del = document.createElement("button");
      del.type = "button";
      del.className = "btn btn--danger btn--tiny";
      del.textContent = "T\u00f6rl\u00e9s";
      del.addEventListener("click", function (e) {
        e.stopPropagation();
        removeEvent(item.id);
      });
      btns.appendChild(dup);
      btns.appendChild(del);
      li.appendChild(info);
      li.appendChild(btns);
      li.addEventListener("click", function () { fillCal(item); });
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter") fillCal(item);
      });
      calList.appendChild(li);
    });
  }

  function removeEvent(id) {
    if (!window.confirm("T\u00f6rl\u00f6d ezt az id\u0151pontot?")) return;
    var data = window.HJStore.current();
    data.events = (data.events || []).filter(function (row) { return row.id !== id; });
    window.HJ_CONTENT = data;
    if (editingId === id) resetCalForm();
    else renderCal();
    setStatus("Id\u0151pont t\u00f6r\u00f6lve. Nyomj Ment\u00e9st a v\u00e9gleges\u00edt\u00e9shez.");
  }

  function duplicateEvent(item) {
    var data = window.HJStore.current();
    var copy = {
      id: "ev-" + Date.now(),
      date: item.date,
      time: item.time,
      type: item.type,
      title: item.title,
      place: item.place,
      note: item.note,
      href: item.href || "kapcsolat.html"
    };
    data.events = (data.events || []).concat([copy]);
    window.HJ_CONTENT = data;
    fillCal(copy);
    setStatus("M\u00e1solat k\u00e9sz. \u00c1ll\u00edtsd \u00e1t a d\u00e1tumot, majd Ment\u00e9s.");
  }

  function fillUsers() {
    var who = $("#who");
    var count = $("#user-count");
    var list = $("#user-list");
    var selfForm = $("#self-form");
    var me = window.HJStore.currentUser();
    var users = window.HJStore.listUsers();
    var n = window.HJStore.userCount();
    if (who) who.textContent = me ? ("Bel\u00e9pve: " + me.name) : "";
    if (count) {
      count.textContent = n + " regisztr\u00e1lt felhaszn\u00e1l\u00f3";
    }
    if (selfForm && me) {
      selfForm.user.value = me.name;
      selfForm.pass.value = me.pass;
      selfForm.pass2.value = me.pass;
    }
    if (!list) return;
    list.innerHTML = "";
    users.forEach(function (row) {
      var li = document.createElement("li");
      li.className = "cal-row";
      var info = document.createElement("div");
      var strong = document.createElement("strong");
      strong.textContent = row.name;
      var small = document.createElement("small");
      small.textContent = me && me.id === row.id ? "Te" : "Admin";
      info.appendChild(strong);
      info.appendChild(small);
      li.appendChild(info);
      if (!me || me.id !== row.id) {
        var del = document.createElement("button");
        del.type = "button";
        del.className = "btn btn--danger btn--tiny";
        del.textContent = "T\u00f6rl\u00e9s";
        del.addEventListener("click", function () {
          if (!window.confirm("T\u00f6rl\u00f6d a(z) " + row.name + " felhaszn\u00e1l\u00f3t?")) return;
          var res = window.HJStore.removeUser(row.id);
          $("#new-user-status").textContent = res.ok ? "" : res.error;
          if (res.ok) fillUsers();
        });
        li.appendChild(del);
      }
      list.appendChild(li);
    });
  }

  function collect() {
    var data = window.HJStore.current();
    data.nextEvent = readEvent();
    data.settings = data.settings || {};
    data.settings.calendarVisible = calVisible.checked;
    data.pages = readPages();
    (data.events || []).forEach(function (row) {
      if (!row.href) row.href = "kapcsolat.html";
    });
    return data;
  }

  function pageSchema() {
    return window.HJ_PAGE_SCHEMA || [];
  }

  function buildPageForms() {
    pageSchema().forEach(function (page) {
      var form = document.getElementById("page-form-" + page.id);
      if (!form || form.getAttribute("data-built") === "1") return;
      form.setAttribute("data-built", "1");
      page.fields.forEach(function (field) {
        var label = document.createElement("label");
        label.className = "wide";
        label.appendChild(document.createTextNode(field.label));
        var input = field.type === "textarea" ? document.createElement("textarea") : document.createElement("input");
        if (field.type === "textarea") input.rows = 4;
        input.name = field.key;
        label.appendChild(input);
        form.appendChild(label);
      });
      form.addEventListener("submit", function (e) { e.preventDefault(); });
    });
  }

  function fillPageForms() {
    var data = window.HJStore.current();
    var pages = data.pages || {};
    var defaults = window.HJ_PAGE_DEFAULTS || {};
    pageSchema().forEach(function (page) {
      var form = document.getElementById("page-form-" + page.id);
      if (!form) return;
      var bucket = Object.assign({}, defaults[page.id] || {}, pages[page.id] || {});
      page.fields.forEach(function (field) {
        if (form[field.key]) form[field.key].value = bucket[field.key] != null ? bucket[field.key] : "";
      });
    });
  }

  function readPages() {
    var pages = {};
    var current = ((window.HJStore.current() || {}).pages) || {};
    var defaults = window.HJ_PAGE_DEFAULTS || {};
    pageSchema().forEach(function (page) {
      var form = document.getElementById("page-form-" + page.id);
      var bucket = Object.assign({}, defaults[page.id] || {}, current[page.id] || {});
      if (form) {
        page.fields.forEach(function (field) {
          if (form[field.key]) bucket[field.key] = form[field.key].value;
        });
      }
      pages[page.id] = bucket;
    });
    return pages;
  }

  function showView(id) {
    document.querySelectorAll(".admin-view").forEach(function (el) {
      el.hidden = el.id !== "view-" + id;
    });
    document.querySelectorAll(".admin-nav__btn").forEach(function (btn) {
      btn.classList.toggle("is-on", btn.getAttribute("data-view") === id);
    });
  }

  function showPanel() {
    loginView.hidden = true;
    panelView.hidden = false;
    var data = window.HJStore.current();
    calVisible.checked = !data.settings || data.settings.calendarVisible !== false;
    buildPageForms();
    fillEvent();
    resetCalForm();
    fillPageForms();
    fillUsers();
    showView("event");
    markSaved();
    setStatus("A v\u00e1ltoz\u00e1sok a Ment\u00e9s ut\u00e1n jelennek meg a f\u0151oldalon.");
  }

  function waitStore(fn) {
    if (window.HJStore && window.HJ_CONTENT) fn();
    else document.addEventListener("hj-content-ready", fn, { once: true });
  }

  function compressImage(file, done) {
    if (!file || !file.type || file.type.indexOf("image/") !== 0) {
      done(null, "Csak k\u00e9pf\u00e1jlt lehet felt\u00f6lteni.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      done(null, "A k\u00e9p t\u00fal nagy. 12 MB alatt legyen.");
      return;
    }
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      var max = 1400;
      var w = img.width;
      var h = img.height;
      if (w > max) {
        h = Math.round(h * max / w);
        w = max;
      }
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      var quality = 0.82;
      canvas.toBlob(function (blob) {
        if (!blob) {
          done(null, "A k\u00e9pet nem siker\u00fclt \u00e1tm\u00e9retezni.");
          return;
        }
        var reader = new FileReader();
        reader.onload = function () { done(reader.result, ""); };
        reader.onerror = function () { done(null, "A k\u00e9pet nem siker\u00fclt beolvasni."); };
        reader.readAsDataURL(blob);
      }, "image/jpeg", quality);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      done(null, "Ezt a k\u00e9pet nem lehet megnyitni.");
    };
    img.src = url;
  }

  function onPoster(file) {
    posterStatus.textContent = "K\u00e9p bet\u00f6lt\u00e9se...";
    compressImage(file, function (dataUrl, err) {
      if (!dataUrl) {
        posterStatus.textContent = err;
        return;
      }
      posterSrc = dataUrl;
      window.HJStore.putImage(dataUrl);
      showPoster(dataUrl);
      if (!eventForm.imageAlt.value) {
        eventForm.imageAlt.value = eventForm.title.value || file.name.replace(/\.[^.]+$/, "");
      }
      posterStatus.textContent = "K\u00e9p k\u00e9szen \u00e1ll. Nyomj Ment\u00e9st.";
    });
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginErr.hidden = true;
    if (!window.HJStore.checkLogin(loginForm.user.value, loginForm.pass.value)) {
      loginErr.hidden = false;
      return;
    }
    window.HJStore.setAuthed(true, loginForm.user.value.trim());
    showPanel();
  });

  $("#logout").addEventListener("click", function () {
    window.HJStore.setAuthed(false);
    panelView.hidden = true;
    loginView.hidden = false;
    loginForm.reset();
  });

  eventForm.date.addEventListener("change", function () { whenTouched = false; syncWhen(); });
  eventForm.time.addEventListener("change", function () { whenTouched = false; syncWhen(); });
  eventForm.when.addEventListener("input", function () { whenTouched = true; updateLive(); });
  eventForm.title.addEventListener("input", updateLive);
  eventForm.titleEm.addEventListener("input", updateLive);

  $("#poster-pick").addEventListener("click", function () { posterFile.click(); });
  posterFile.addEventListener("change", function () {
    if (posterFile.files && posterFile.files[0]) onPoster(posterFile.files[0]);
    posterFile.value = "";
  });
  ["dragenter", "dragover"].forEach(function (name) {
    dropZone.addEventListener(name, function (e) {
      e.preventDefault();
      dropZone.classList.add("is-over");
    });
  });
  ["dragleave", "drop"].forEach(function (name) {
    dropZone.addEventListener(name, function (e) {
      e.preventDefault();
      dropZone.classList.remove("is-over");
    });
  });
  dropZone.addEventListener("drop", function (e) {
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) onPoster(file);
  });
  dropZone.addEventListener("click", function (e) {
    if (e.target === posterFile) return;
    posterFile.click();
  });
  $("#poster-reset").addEventListener("click", function () {
    posterSrc = DEFAULT_POSTER;
    showPoster(DEFAULT_POSTER);
    posterStatus.textContent = "Vissza\u00e1ll\u00edtva az eredeti plak\u00e1tra.";
  });
  $("#poster-clear").addEventListener("click", function () {
    posterSrc = "";
    showPoster("");
    posterStatus.textContent = "Nincs k\u00e9p. A box k\u00e9p n\u00e9lk\u00fcl jelenik meg, am\u00edg nem t\u00f6ltesz fel \u00fajat.";
  });

  calForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = window.HJStore.current();
    data.events = data.events || [];
    var row = {
      id: editingId || ("ev-" + Date.now()),
      date: calForm.date.value,
      time: calForm.time.value,
      type: calForm.type.value,
      title: calForm.title.value.trim(),
      place: calForm.place.value.trim(),
      note: calForm.note.value.trim(),
      href: "kapcsolat.html"
    };
    if (!row.date || !row.title) return;
    if (editingId) {
      data.events = data.events.map(function (item) { return item.id === editingId ? row : item; });
    } else {
      data.events.push(row);
    }
    window.HJ_CONTENT = data;
    fillCal(row);
    setStatus("Napt\u00e1r friss\u00edtve. Nyomj Ment\u00e9st a f\u0151oldalhoz.");
  });

  $("#cal-new").addEventListener("click", resetCalForm);

  $("#cal-copy").addEventListener("click", function () {
    if (!calForm.title.value && !editingId) {
      setStatus("El\u0151bb v\u00e1lassz vagy \u00edrj be egy id\u0151pontot.");
      return;
    }
    eventForm.title.value = calForm.title.value.trim();
    eventForm.date.value = calForm.date.value;
    eventForm.time.value = calForm.time.value;
    eventForm.place.value = calForm.place.value;
    eventForm.price.value = calForm.note.value;
    whenTouched = false;
    syncWhen();
    if (!eventForm.cta.value) eventForm.cta.value = "Jelentkezem az \u00f3r\u00e1ra";
    setStatus("\u00c1tm\u00e1solva a k\u00f6vetkez\u0151 esem\u00e9ny boxba. Nyomj Ment\u00e9st.");
  });

  saveBtn.addEventListener("click", function () {
    setStatus("Ment\u00e9s...");
    var data = collect();
    if (posterSrc && posterSrc.indexOf("data:") === 0) window.HJStore.putImage(posterSrc);
    window.HJStore.save(data, function (ok) {
      markSaved();
      setStatus(ok
        ? "Elmentve. A f\u0151oldalon azonnal l\u00e1tszik ezen a g\u00e9pen."
        : "Elmentve ezen a g\u00e9pen.", true);
    });
  });

  $("#export-btn").addEventListener("click", function () {
    var data = collect();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    var stamp = new Date().toISOString().slice(0, 10);
    a.href = URL.createObjectURL(blob);
    a.download = "harmonia-mentes-" + stamp + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus("A ment\u00e9s let\u00f6ltve.");
  });

  $("#import-file").addEventListener("change", function () {
    var file = this.files && this.files[0];
    this.value = "";
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        window.HJ_CONTENT = window.HJStore.merge(parsed);
        fillEvent();
        resetCalForm();
        fillPageForms();
        calVisible.checked = !window.HJ_CONTENT.settings || window.HJ_CONTENT.settings.calendarVisible !== false;
        setStatus("Bet\u00f6ltve. Nyomj Ment\u00e9st, ha j\u00f3 \u00edgy.");
      } catch (err) {
        setStatus("Ezt a f\u00e1jlt nem lehet beolvasni.");
      }
    };
    reader.readAsText(file, "utf-8");
  });

  $("#reset-btn").addEventListener("click", function () {
    if (!window.confirm("Vissza\u00e1ll\u00edtod az eredeti napt\u00e1rat \u00e9s a k\u00f6vetkez\u0151 esem\u00e9nyt?")) return;
    window.HJ_CONTENT = window.HJStore.merge(window.HJStore.defaultContent);
    posterSrc = DEFAULT_POSTER;
    fillEvent();
    resetCalForm();
    fillPageForms();
    calVisible.checked = true;
    setStatus("Alaphelyzet. Nyomj Ment\u00e9st a v\u00e9gleges\u00edt\u00e9shez.");
  });

  $("#self-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.currentTarget;
    var status = $("#self-status");
    if (form.pass.value !== form.pass2.value) {
      status.textContent = "A k\u00e9t k\u00f3d nem egyezik.";
      return;
    }
    var res = window.HJStore.updateSelf(form.user.value, form.pass.value);
    status.textContent = res.ok ? "Saj\u00e1t bel\u00e9p\u00e9s elmentve." : res.error;
    if (res.ok) fillUsers();
  });

  $("#new-user-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.currentTarget;
    var status = $("#new-user-status");
    if (form.pass.value !== form.pass2.value) {
      status.textContent = "A k\u00e9t k\u00f3d nem egyezik.";
      return;
    }
    var res = window.HJStore.addUser(form.user.value, form.pass.value);
    status.textContent = res.ok ? "\u00daj felhaszn\u00e1l\u00f3 l\u00e9trehozva." : res.error;
    if (res.ok) {
      form.reset();
      fillUsers();
    }
  });

  document.querySelectorAll(".admin-nav__btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showView(btn.getAttribute("data-view"));
    });
  });

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (!panelView.hidden) saveBtn.click();
    }
  });

  window.addEventListener("beforeunload", function (e) {
    if (panelView.hidden || !dirty()) return;
    e.preventDefault();
    e.returnValue = "";
  });

  var THEME_KEY = "hj-admin-theme";
  var THEMES = ["green", "blue", "mint"];

  function applyTheme(name) {
    if (THEMES.indexOf(name) < 0) name = "blue";
    document.documentElement.setAttribute("data-theme", name);
    try { localStorage.setItem(THEME_KEY, name); } catch (err) {}
    document.querySelectorAll(".theme-dot").forEach(function (btn) {
      btn.classList.toggle("is-on", btn.getAttribute("data-theme") === name);
    });
  }

  document.querySelectorAll(".theme-dot").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyTheme(btn.getAttribute("data-theme"));
    });
  });

  try { applyTheme(localStorage.getItem(THEME_KEY) || "blue"); } catch (err) { applyTheme("blue"); }

  waitStore(function () {
    if (window.HJStore.isAuthed()) showPanel();
  });
})();
