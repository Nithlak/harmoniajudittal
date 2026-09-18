(function () {
  "use strict";

  function $(sel, root) { return (root || document).querySelector(sel); }

  var MONTHS = [
    "janu\u00e1r", "febru\u00e1r", "m\u00e1rcius", "\u00e1prilis", "m\u00e1jus", "j\u00fanius",
    "j\u00falius", "augusztus", "szeptember", "okt\u00f3ber", "november", "december"
  ];
  var DEFAULT_POSTER = "images/nia-orarend-1.png";
  var DEFAULT_POSTER2 = "images/nia-orarend-2.png";
  var DEFAULT_PREV_POSTER = "images/oszi-joga.png";

  var loginView = $("#login-view");
  var panelView = $("#panel-view");
  var loginForm = $("#login-form");
  var loginErr = $("#login-error");
  var eventForm = $("#event-form");
  var prevEventForm = $("#prev-event-form");
  var calForm = $("#cal-form");
  var calList = $("#cal-list");
  var calMode = $("#cal-mode");
  var calSubmit = $("#cal-submit");
  var saveBtn = $("#save-btn");
  var saveStatus = $("#save-status");
  var liveImage = $("#live-image");
  var liveTitle = $("#live-title");
  var liveWhen = $("#live-when");
  var prevLiveImage = $("#prev-live-image");
  var prevLiveTitle = $("#prev-live-title");
  var prevLiveWhen = $("#prev-live-when");
  var calVisible = $("#cal-visible");

  var editingId = "";
  var posterSrc = DEFAULT_POSTER;
  var posterSrc2 = DEFAULT_POSTER2;
  var prevPosterSrc = DEFAULT_PREV_POSTER;
  var nextDrop = null;
  var nextDrop2 = null;
  var prevDrop = null;
  var savedSnap = "";
  var whenTouched = false;
  var prevWhenTouched = false;

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

  function updateLive() {
    if (!eventForm || !liveTitle) return;
    var title = (eventForm.title.value || "") + (eventForm.titleEm.value ? " " + eventForm.titleEm.value : "");
    liveTitle.textContent = title || "K\u00f6vetkez\u0151 esem\u00e9ny";
    liveWhen.textContent = eventForm.when.value || formatWhen(eventForm.date.value, eventForm.time.value);
  }

  function updatePrevLive() {
    if (!prevEventForm || !prevLiveTitle) return;
    var title = (prevEventForm.title.value || "") + (prevEventForm.titleEm.value ? " " + prevEventForm.titleEm.value : "");
    prevLiveTitle.textContent = title || "El\u0151z\u0151 esem\u00e9ny";
    prevLiveWhen.textContent = prevEventForm.when.value || formatWhen(prevEventForm.date.value, prevEventForm.time.value);
  }

  function syncWhen() {
    if (whenTouched && eventForm.when.value) return;
    eventForm.when.value = formatWhen(eventForm.date.value, eventForm.time.value);
    updateLive();
  }

  function syncPrevWhen() {
    if (prevWhenTouched && prevEventForm.when.value) return;
    prevEventForm.when.value = formatWhen(prevEventForm.date.value, prevEventForm.time.value);
    updatePrevLive();
  }

  function setHref(form, href) {
    href = href || "kapcsolat.html";
    if (![].some.call(form.ctaHref.options, function (o) { return o.value === href; })) {
      var opt = document.createElement("option");
      opt.value = href;
      opt.textContent = href;
      form.ctaHref.appendChild(opt);
    }
    form.ctaHref.value = href;
  }

  function fillEventForm(form, ev, defaults) {
    ev = ev || {};
    defaults = defaults || {};
    form.visible.checked = ev.visible !== false;
    form.title.value = ev.title || "";
    form.titleEm.value = ev.titleEm || "";
    form.date.value = ev.date || "";
    form.time.value = ev.time || "";
    form.when.value = ev.when || formatWhen(ev.date, ev.time);
    form.price.value = ev.price || "";
    form.place.value = ev.place || "";
    form.lead.value = ev.lead || "";
    form.p1.value = ev.p1 || "";
    form.p2.value = ev.p2 || "";
    form.imageAlt.value = ev.imageAlt || "";
    if (form.image2Alt) form.image2Alt.value = ev.image2Alt || "";
    form.cta.value = ev.cta != null ? ev.cta : (defaults.cta || "");
    setHref(form, ev.ctaHref);
  }

  function fillEvent() {
    var data = window.HJStore.current();
    var ev = data.nextEvent || {};
    fillEventForm(eventForm, ev, { cta: "Jelentkezem az \u00f3r\u00e1ra" });
    whenTouched = false;
    posterSrc = ev.image || DEFAULT_POSTER;
    posterSrc2 = ev.image2 || "";
    if (nextDrop) nextDrop.show(posterSrc);
    if (nextDrop2) nextDrop2.show(posterSrc2);
    updateLive();
  }

  function fillPrevEvent() {
    if (!prevEventForm) return;
    var ev = (window.HJStore.current().prevEvent) || {};
    fillEventForm(prevEventForm, ev, { cta: "" });
    prevWhenTouched = false;
    prevPosterSrc = ev.image || DEFAULT_PREV_POSTER;
    if (prevDrop) prevDrop.show(prevPosterSrc);
    updatePrevLive();
  }

  function readEvent(form, image, extra) {
    extra = extra || {};
    var cta = form.cta.value.trim();
    if (extra.requireCta && !cta) cta = "Jelentkezem az \u00f3r\u00e1ra";
    var out = {
      visible: form.visible.checked,
      title: form.title.value.trim(),
      titleEm: form.titleEm.value.trim(),
      image: image || "",
      imageAlt: form.imageAlt.value.trim() || form.title.value.trim(),
      date: form.date.value,
      time: form.time.value,
      lead: form.lead.value.trim(),
      p1: form.p1.value.trim(),
      p2: form.p2.value.trim(),
      when: form.when.value.trim() || formatWhen(form.date.value, form.time.value),
      price: form.price.value.trim(),
      place: form.place.value.replace(/\r\n/g, "\n"),
      cta: cta,
      ctaHref: form.ctaHref.value || "kapcsolat.html"
    };
    if (extra.withImage2) {
      out.image2 = extra.image2 || "";
      out.image2Alt = form.image2Alt ? form.image2Alt.value.trim() : "";
    }
    return out;
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
    data.nextEvent = readEvent(eventForm, posterSrc, {
      requireCta: true,
      withImage2: true,
      image2: posterSrc2
    });
    data.prevEvent = readEvent(prevEventForm, prevPosterSrc, { requireCta: false });
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
        if (field.type === "image") {
          form.appendChild(imageField(field));
          return;
        }
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
      bindPageImages(form);
    });
  }

  function imageField(field) {
    var wrap = document.createElement("div");
    wrap.className = "page-image wide";
    wrap.setAttribute("data-image-field", field.key);
    wrap.setAttribute("data-default", field.def || "");
    wrap.setAttribute("data-frame", field.frame || "wide");
    wrap.setAttribute("data-ratio", field.ratio || "4/3");
    wrap.setAttribute("data-fit", field.fit || "cover");
    var title = document.createElement("p");
    title.className = "page-image__label";
    title.textContent = field.label;
    wrap.appendChild(title);
    var crop = document.createElement("div");
    crop.className = "crop crop--" + (field.frame || "wide");
    crop.setAttribute("data-crop", "");
    var stage = document.createElement("div");
    stage.className = "crop__stage";
    var preview = document.createElement("img");
    preview.className = "crop__img";
    preview.alt = "El\u0151n\u00e9zet";
    preview.hidden = true;
    preview.draggable = false;
    stage.appendChild(preview);
    var copy = document.createElement("div");
    copy.className = "drop__copy crop__copy";
    copy.innerHTML = "<strong>K\u00e9p felt\u00f6lt\u00e9se</strong><span>H\u00fazd ide, vagy kattints a v\u00e1laszt\u00e1shoz.</span>";
    var file = document.createElement("input");
    file.type = "file";
    file.accept = "image/jpeg,image/png,image/webp,image/gif";
    file.setAttribute("aria-hidden", "true");
    file.tabIndex = -1;
    crop.appendChild(stage);
    crop.appendChild(copy);
    crop.appendChild(file);
    wrap.appendChild(crop);
    var zoom = document.createElement("div");
    zoom.className = "crop-zoom";
    zoom.hidden = true;
    zoom.innerHTML = "<span aria-hidden=\"true\">\u2212</span>";
    var range = document.createElement("input");
    range.type = "range";
    range.min = "1";
    range.max = "3";
    range.step = "0.01";
    range.value = "1";
    range.setAttribute("data-zoom", "");
    range.setAttribute("aria-label", "Nagy\u00edt\u00e1s");
    zoom.appendChild(range);
    var plus = document.createElement("span");
    plus.setAttribute("aria-hidden", "true");
    plus.textContent = "+";
    zoom.appendChild(plus);
    wrap.appendChild(zoom);
    var hint = document.createElement("p");
    hint.className = "hint crop-hint";
    hint.textContent = "H\u00fazd a k\u00e9pet a keretben. A cs\u00faszk\u00e1val nagy\u00edthatsz vagy kicsiny\u00edthetsz \u2014 pontosan azt l\u00e1tod, ami az oldalon megjelenik.";
    wrap.appendChild(hint);
    var actions = document.createElement("div");
    actions.className = "panel-actions drop-actions";
    var pick = document.createElement("button");
    pick.className = "btn btn--ghost btn--tiny";
    pick.type = "button";
    pick.textContent = "K\u00e9p kiv\u00e1laszt\u00e1sa";
    pick.setAttribute("data-pick", "");
    var reset = document.createElement("button");
    reset.className = "btn btn--ghost btn--tiny";
    reset.type = "button";
    reset.textContent = "Eredeti k\u00e9p";
    reset.setAttribute("data-reset", "");
    actions.appendChild(pick);
    actions.appendChild(reset);
    wrap.appendChild(actions);
    var status = document.createElement("p");
    status.className = "hint page-image__status";
    wrap.appendChild(status);
    var hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = field.key;
    wrap.appendChild(hidden);
    return wrap;
  }

  function frameSize(box) {
    var raw = box.getAttribute("data-ratio") || "1";
    var parts = String(raw).split("/");
    var ratio = parts.length === 2 ? Number(parts[0]) / Number(parts[1]) : Number(raw);
    if (!ratio || !isFinite(ratio)) ratio = 1;
    var w = 1000;
    return { w: w, h: Math.round(w / ratio) };
  }

  function clampOffset(value, size, frame) {
    if (size <= frame + 0.5) return (frame - size) / 2;
    return Math.max(frame - size, Math.min(0, value));
  }

  function cropMetrics(box) {
    var state = box._crop;
    var frame = frameSize(box);
    var fit = box.getAttribute("data-fit") || "cover";
    var zoom = state.zoom || 1;
    var base = fit === "contain"
      ? Math.min(frame.w / state.nw, frame.h / state.nh)
      : Math.max(frame.w / state.nw, frame.h / state.nh);
    var dw = state.nw * base * zoom;
    var dh = state.nh * base * zoom;
    return { frame: frame, fit: fit, zoom: zoom, base: base, dw: dw, dh: dh };
  }

  function applyCrop(box) {
    var state = box._crop;
    var img = box.querySelector(".crop__img");
    if (!state || !state.nw || !img) return;
    var m = cropMetrics(box);
    state.ox = clampOffset(state.ox, m.dw, m.frame.w);
    state.oy = clampOffset(state.oy, m.dh, m.frame.h);
    img.style.width = (m.dw / m.frame.w * 100) + "%";
    img.style.height = (m.dh / m.frame.h * 100) + "%";
    img.style.left = (state.ox / m.frame.w * 100) + "%";
    img.style.top = (state.oy / m.frame.h * 100) + "%";
  }

  function setCropZoom(box, zoom, keepCenter) {
    var state = box._crop;
    if (!state || !state.nw) return;
    zoom = Math.max(1, Math.min(3, zoom));
    if (keepCenter) {
      var mOld = cropMetrics(box);
      var cx = mOld.frame.w / 2;
      var cy = mOld.frame.h / 2;
      var px = (cx - state.ox) / mOld.dw;
      var py = (cy - state.oy) / mOld.dh;
      state.zoom = zoom;
      var mNew = cropMetrics(box);
      state.ox = cx - px * mNew.dw;
      state.oy = cy - py * mNew.dh;
    } else {
      state.zoom = zoom;
    }
    applyCrop(box);
  }

  function cropToDataUrl(box, done) {
    var state = box._crop;
    var img = box.querySelector(".crop__img");
    if (!state || !state.nw || !img) {
      done("");
      return;
    }
    if (!img.naturalWidth) {
      var once = function () {
        img.removeEventListener("load", once);
        img.removeEventListener("error", fail);
        cropToDataUrl(box, done);
      };
      var fail = function () {
        img.removeEventListener("load", once);
        img.removeEventListener("error", fail);
        done("");
      };
      img.addEventListener("load", once);
      img.addEventListener("error", fail);
      return;
    }
    var m = cropMetrics(box);
    state.ox = clampOffset(state.ox, m.dw, m.frame.w);
    state.oy = clampOffset(state.oy, m.dh, m.frame.h);
    var long = 1200;
    var cw;
    var ch;
    if (m.frame.w >= m.frame.h) {
      cw = long;
      ch = Math.max(1, Math.round(long * m.frame.h / m.frame.w));
    } else {
      ch = long;
      cw = Math.max(1, Math.round(long * m.frame.w / m.frame.h));
    }
    var canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    var ctx = canvas.getContext("2d");
    if (!state.alpha) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, cw, ch);
    }
    var sx = -state.ox / m.dw * state.nw;
    var sy = -state.oy / m.dh * state.nh;
    var sw = m.frame.w / m.dw * state.nw;
    var sh = m.frame.h / m.dh * state.nh;
    sx = Math.max(0, Math.min(state.nw - 1, sx));
    sy = Math.max(0, Math.min(state.nh - 1, sy));
    sw = Math.max(1, Math.min(state.nw - sx, sw));
    sh = Math.max(1, Math.min(state.nh - sy, sh));
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    var mime = state.alpha ? "image/png" : "image/jpeg";
    var quality = state.alpha ? undefined : 0.86;
    canvas.toBlob(function (blob) {
      if (!blob) {
        done("");
        return;
      }
      var reader = new FileReader();
      reader.onload = function () { done(reader.result || ""); };
      reader.onerror = function () { done(""); };
      reader.readAsDataURL(blob);
    }, mime, quality);
  }

  function queueRaster(box) {
    if (!box._crop || !box._crop.dirty) return;
    clearTimeout(box._cropTimer);
    box._cropTimer = setTimeout(function () {
      var form = box.closest("form");
      var pageId = (form && form.id ? form.id : "").replace("page-form-", "");
      var key = box.getAttribute("data-image-field");
      var hidden = box.querySelector('input[type="hidden"]');
      cropToDataUrl(box, function (url) {
        if (!url) return;
        if (hidden) hidden.value = url;
        if (pageId && key) window.HJStore.putImage(url, "page-" + pageId + "-" + key);
      });
    }, 120);
  }

  function flushCrops(done) {
    var boxes = [];
    document.querySelectorAll(".page-image").forEach(function (box) {
      if (box._crop && box._crop.ready && box._crop.dirty) boxes.push(box);
    });
    if (!boxes.length) {
      done();
      return;
    }
    var left = boxes.length;
    boxes.forEach(function (box) {
      clearTimeout(box._cropTimer);
      var form = box.closest("form");
      var pageId = (form && form.id ? form.id : "").replace("page-form-", "");
      var key = box.getAttribute("data-image-field");
      var hidden = box.querySelector('input[type="hidden"]');
      cropToDataUrl(box, function (url) {
        if (url) {
          if (hidden) hidden.value = url;
          if (pageId && key) window.HJStore.putImage(url, "page-" + pageId + "-" + key);
          box._crop.dirty = false;
        }
        left -= 1;
        if (!left) done();
      });
    });
  }

  function setCropSource(box, url, markDirty) {
    var img = box.querySelector(".crop__img");
    var copy = box.querySelector(".crop__copy");
    var zoomWrap = box.querySelector(".crop-zoom");
    var range = box.querySelector("[data-zoom]");
    var hidden = box.querySelector('input[type="hidden"]');
    box._cropGen = (box._cropGen || 0) + 1;
    var gen = box._cropGen;
    if (!url) {
      box._crop = null;
      if (img) {
        img.hidden = true;
        img.removeAttribute("src");
      }
      if (copy) copy.hidden = false;
      if (zoomWrap) zoomWrap.hidden = true;
      return;
    }
    var probe = new Image();
    probe.onload = function () {
      if (box._cropGen !== gen) return;
      box._crop = {
        nw: probe.naturalWidth,
        nh: probe.naturalHeight,
        zoom: 1,
        ox: 0,
        oy: 0,
        alpha: (url.indexOf("data:image/png") === 0) || /\.png(\?|$)/i.test(url),
        ready: true,
        dirty: !!markDirty
      };
      if (img) {
        img.hidden = false;
        img.src = url;
      }
      if (copy) copy.hidden = true;
      if (zoomWrap) zoomWrap.hidden = false;
      if (range) range.value = "1";
      applyCrop(box);
      if (markDirty) queueRaster(box);
    };
    probe.onerror = function () {
      box._crop = null;
      if (img) img.hidden = true;
      if (copy) copy.hidden = false;
      if (zoomWrap) zoomWrap.hidden = true;
      if (hidden) hidden.value = "";
    };
    probe.src = url;
  }

  function showPageImage(box, src) {
    var hidden = box.querySelector('input[type="hidden"]');
    if (hidden) hidden.value = src || "";
    window.HJStore.resolveImage(src || "", function (url) {
      setCropSource(box, url, false);
    });
  }

  function bindPageImages(form) {
    form.querySelectorAll(".page-image").forEach(function (box) {
      if (box.getAttribute("data-bound") === "1") return;
      box.setAttribute("data-bound", "1");
      var crop = box.querySelector("[data-crop]");
      var stage = box.querySelector(".crop__stage");
      var file = box.querySelector('input[type="file"]');
      var status = box.querySelector(".page-image__status");
      var range = box.querySelector("[data-zoom]");
      var def = box.getAttribute("data-default") || "";
      var drag = null;
      function onFile(picked) {
        if (status) status.textContent = "K\u00e9p bet\u00f6lt\u00e9se...";
        loadSource(picked, function (dataUrl, err) {
          if (!dataUrl) {
            if (status) status.textContent = err;
            return;
          }
          if (box.querySelector('input[type="hidden"]')) box.querySelector('input[type="hidden"]').value = dataUrl;
          setCropSource(box, dataUrl, true);
          if (status) status.textContent = "H\u00fazd a k\u00e9pet a hely\u00e9re, majd nyomj Ment\u00e9st.";
        });
      }
      box.querySelector("[data-pick]").addEventListener("click", function () { file.click(); });
      box.querySelector("[data-reset]").addEventListener("click", function () {
        showPageImage(box, def);
        if (status) status.textContent = "Vissza\u00e1ll\u00edtva az eredeti k\u00e9pre.";
      });
      file.addEventListener("change", function () {
        if (file.files && file.files[0]) onFile(file.files[0]);
        file.value = "";
      });
      ["dragenter", "dragover"].forEach(function (name) {
        crop.addEventListener(name, function (e) {
          e.preventDefault();
          crop.classList.add("is-over");
        });
      });
      ["dragleave", "drop"].forEach(function (name) {
        crop.addEventListener(name, function (e) {
          e.preventDefault();
          crop.classList.remove("is-over");
        });
      });
      crop.addEventListener("drop", function (e) {
        var picked = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (picked) onFile(picked);
      });
      box.querySelector(".crop__copy").addEventListener("click", function () { file.click(); });
      stage.addEventListener("pointerdown", function (e) {
        if (!box._crop || !box._crop.ready) return;
        if (e.button && e.button !== 0) return;
        e.preventDefault();
        stage.setPointerCapture(e.pointerId);
        drag = { x: e.clientX, y: e.clientY, ox: box._crop.ox, oy: box._crop.oy };
        stage.classList.add("is-drag");
      });
      stage.addEventListener("pointermove", function (e) {
        if (!drag || !box._crop) return;
        var rect = stage.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var frame = frameSize(box);
        box._crop.ox = drag.ox + (e.clientX - drag.x) / rect.width * frame.w;
        box._crop.oy = drag.oy + (e.clientY - drag.y) / rect.height * frame.h;
        box._crop.dirty = true;
        applyCrop(box);
      });
      function endDrag() {
        if (!drag) return;
        drag = null;
        stage.classList.remove("is-drag");
        queueRaster(box);
      }
      stage.addEventListener("pointerup", endDrag);
      stage.addEventListener("pointercancel", endDrag);
      stage.addEventListener("wheel", function (e) {
        if (!box._crop || !box._crop.ready) return;
        e.preventDefault();
        var next = (box._crop.zoom || 1) + (e.deltaY < 0 ? 0.08 : -0.08);
        setCropZoom(box, next, true);
        box._crop.dirty = true;
        if (range) range.value = String(box._crop.zoom);
        queueRaster(box);
      }, { passive: false });
      if (range) {
        range.addEventListener("input", function () {
          if (!box._crop) return;
          setCropZoom(box, Number(range.value), true);
          box._crop.dirty = true;
        });
        range.addEventListener("change", function () { queueRaster(box); });
      }
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
        if (field.type === "image") {
          var box = form.querySelector('[data-image-field="' + field.key + '"]');
          if (box) showPageImage(box, bucket[field.key] || field.def || "");
          return;
        }
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
    fillPrevEvent();
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

  function loadSource(file, done) {
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
      var max = 1800;
      var w = img.width;
      var h = img.height;
      if (w > max || h > max) {
        if (w >= h) {
          h = Math.round(h * max / w);
          w = max;
        } else {
          w = Math.round(w * max / h);
          h = max;
        }
      }
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var keepAlpha = file.type === "image/png" || file.type === "image/webp";
      var ctx = canvas.getContext("2d");
      if (!keepAlpha) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      var mime = keepAlpha ? (file.type === "image/webp" ? "image/png" : file.type) : "image/jpeg";
      canvas.toBlob(function (blob) {
        if (!blob) {
          done(null, "A k\u00e9pet nem siker\u00fclt beolvasni.");
          return;
        }
        var reader = new FileReader();
        reader.onload = function () { done(reader.result, ""); };
        reader.onerror = function () { done(null, "A k\u00e9pet nem siker\u00fclt beolvasni."); };
        reader.readAsDataURL(blob);
      }, mime, keepAlpha ? undefined : 0.92);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      done(null, "Ezt a k\u00e9pet nem lehet megnyitni.");
    };
    img.src = url;
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
      var keepAlpha = file.type === "image/png" || file.type === "image/webp";
      var ctx = canvas.getContext("2d");
      if (!keepAlpha) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      var mime = keepAlpha ? file.type : "image/jpeg";
      var quality = keepAlpha ? undefined : 0.82;
      canvas.toBlob(function (blob) {
        if (!blob) {
          done(null, "A k\u00e9pet nem siker\u00fclt \u00e1tm\u00e9retezni.");
          return;
        }
        var reader = new FileReader();
        reader.onload = function () { done(reader.result, ""); };
        reader.onerror = function () { done(null, "A k\u00e9pet nem siker\u00fclt beolvasni."); };
        reader.readAsDataURL(blob);
      }, mime, quality);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      done(null, "Ezt a k\u00e9pet nem lehet megnyitni.");
    };
    img.src = url;
  }

  function bindDropZone(cfg) {
    var zone = $(cfg.zone);
    var file = $(cfg.file);
    var preview = $(cfg.preview);
    var copy = $(cfg.copy);
    var status = $(cfg.status);
    var pick = $(cfg.pick);
    var reset = $(cfg.reset);
    var clear = $(cfg.clear);
    if (!zone || !file) return { show: function () {} };
    function show(src) {
      cfg.set(src || "");
      window.HJStore.resolveImage(src || "", function (url) {
        var has = !!url;
        if (preview) {
          preview.hidden = !has;
          if (has) preview.src = url;
          else preview.removeAttribute("src");
        }
        if (copy) copy.hidden = has;
        if (cfg.live) {
          if (has) {
            cfg.live.src = url;
            cfg.live.hidden = false;
          } else {
            cfg.live.removeAttribute("src");
            cfg.live.hidden = true;
          }
        }
      });
      if (cfg.afterShow) cfg.afterShow();
    }
    function onFile(picked) {
      if (status) status.textContent = "K\u00e9p bet\u00f6lt\u00e9se...";
      compressImage(picked, function (dataUrl, err) {
        if (!dataUrl) {
          if (status) status.textContent = err;
          return;
        }
        window.HJStore.putImage(dataUrl, cfg.idbKey);
        show(dataUrl);
        if (cfg.onPicked) cfg.onPicked(dataUrl, picked);
        if (status) status.textContent = "K\u00e9p k\u00e9szen \u00e1ll. Nyomj Ment\u00e9st.";
      });
    }
    if (pick) pick.addEventListener("click", function () { file.click(); });
    file.addEventListener("change", function () {
      if (file.files && file.files[0]) onFile(file.files[0]);
      file.value = "";
    });
    ["dragenter", "dragover"].forEach(function (name) {
      zone.addEventListener(name, function (e) {
        e.preventDefault();
        zone.classList.add("is-over");
      });
    });
    ["dragleave", "drop"].forEach(function (name) {
      zone.addEventListener(name, function (e) {
        e.preventDefault();
        zone.classList.remove("is-over");
      });
    });
    zone.addEventListener("drop", function (e) {
      var picked = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (picked) onFile(picked);
    });
    zone.addEventListener("click", function (e) {
      if (e.target === file) return;
      file.click();
    });
    if (reset) reset.addEventListener("click", function () {
      show(cfg.fallback || "");
      if (status) status.textContent = "Vissza\u00e1ll\u00edtva az eredeti plak\u00e1tra.";
    });
    if (clear) clear.addEventListener("click", function () {
      show("");
      if (status) status.textContent = "Nincs k\u00e9p. A box k\u00e9p n\u00e9lk\u00fcl jelenik meg, am\u00edg nem t\u00f6ltesz fel \u00fajat.";
    });
    return { show: show };
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

  eventForm.addEventListener("submit", function (e) { e.preventDefault(); });
  eventForm.date.addEventListener("change", function () { whenTouched = false; syncWhen(); });
  eventForm.time.addEventListener("change", function () { whenTouched = false; syncWhen(); });
  eventForm.when.addEventListener("input", function () { whenTouched = true; updateLive(); });
  eventForm.title.addEventListener("input", updateLive);
  eventForm.titleEm.addEventListener("input", updateLive);

  if (prevEventForm) {
    prevEventForm.addEventListener("submit", function (e) { e.preventDefault(); });
    prevEventForm.date.addEventListener("change", function () { prevWhenTouched = false; syncPrevWhen(); });
    prevEventForm.time.addEventListener("change", function () { prevWhenTouched = false; syncPrevWhen(); });
    prevEventForm.when.addEventListener("input", function () { prevWhenTouched = true; updatePrevLive(); });
    prevEventForm.title.addEventListener("input", updatePrevLive);
    prevEventForm.titleEm.addEventListener("input", updatePrevLive);
  }

  nextDrop = bindDropZone({
    zone: "#drop-zone",
    file: "#poster-file",
    preview: "#poster-preview",
    copy: "#drop-copy",
    status: "#poster-status",
    pick: "#poster-pick",
    reset: "#poster-reset",
    clear: "#poster-clear",
    live: liveImage,
    idbKey: "next-event",
    fallback: DEFAULT_POSTER,
    set: function (src) { posterSrc = src; },
    afterShow: updateLive,
    onPicked: function (dataUrl, file) {
      if (!eventForm.imageAlt.value) {
        eventForm.imageAlt.value = eventForm.title.value || file.name.replace(/\.[^.]+$/, "");
      }
    }
  });
  nextDrop2 = bindDropZone({
    zone: "#drop-zone-2",
    file: "#poster-file-2",
    preview: "#poster-preview-2",
    copy: "#drop-copy-2",
    status: "#poster-status-2",
    pick: "#poster-pick-2",
    reset: "#poster-reset-2",
    clear: "#poster-clear-2",
    idbKey: "next-event-2",
    fallback: DEFAULT_POSTER2,
    set: function (src) { posterSrc2 = src; },
    onPicked: function (dataUrl, file) {
      if (eventForm.image2Alt && !eventForm.image2Alt.value) {
        eventForm.image2Alt.value = eventForm.title.value || file.name.replace(/\.[^.]+$/, "");
      }
    }
  });
  prevDrop = bindDropZone({
    zone: "#prev-drop-zone",
    file: "#prev-poster-file",
    preview: "#prev-poster-preview",
    copy: "#prev-drop-copy",
    status: "#prev-poster-status",
    pick: "#prev-poster-pick",
    reset: "#prev-poster-reset",
    clear: "#prev-poster-clear",
    live: prevLiveImage,
    idbKey: "prev-event",
    fallback: DEFAULT_PREV_POSTER,
    set: function (src) { prevPosterSrc = src; },
    afterShow: updatePrevLive,
    onPicked: function (dataUrl, file) {
      if (!prevEventForm.imageAlt.value) {
        prevEventForm.imageAlt.value = prevEventForm.title.value || file.name.replace(/\.[^.]+$/, "");
      }
    }
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
    flushCrops(function () {
      var data = collect();
      if (posterSrc && posterSrc.indexOf("data:") === 0) window.HJStore.putImage(posterSrc, "next-event");
      if (posterSrc2 && posterSrc2.indexOf("data:") === 0) window.HJStore.putImage(posterSrc2, "next-event-2");
      if (prevPosterSrc && prevPosterSrc.indexOf("data:") === 0) window.HJStore.putImage(prevPosterSrc, "prev-event");
      var pages = data.pages || {};
      Object.keys(pages).forEach(function (pid) {
        var bucket = pages[pid] || {};
        Object.keys(bucket).forEach(function (key) {
          var val = bucket[key];
          if (typeof val === "string" && val.indexOf("data:") === 0) {
            window.HJStore.putImage(val, "page-" + pid + "-" + key);
          }
        });
      });
      window.HJStore.save(data, function (ok) {
        markSaved();
        setStatus(ok
          ? "Elmentve. A f\u0151oldalon azonnal l\u00e1tszik ezen a g\u00e9pen."
          : "Elmentve ezen a g\u00e9pen.", true);
      });
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
        fillPrevEvent();
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
    if (!window.confirm("Vissza\u00e1ll\u00edtod az eredeti napt\u00e1rat \u00e9s az esem\u00e9nyeket?")) return;
    window.HJ_CONTENT = window.HJStore.merge(window.HJStore.defaultContent);
    posterSrc = DEFAULT_POSTER;
    posterSrc2 = DEFAULT_POSTER2;
    prevPosterSrc = DEFAULT_PREV_POSTER;
    fillEvent();
    fillPrevEvent();
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
