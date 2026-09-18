(function () {
  "use strict";

  var STORAGE_KEY = "hj-content-v1";
  var AUTH_KEY = "hj-admin-user";
  var USERS_KEY = "hj-users-v1";
  var IDB_NAME = "hj-images";
  var DEFAULT_USERS = [
    { id: "u-judit", name: "Judit2026", pass: "TMMT2026" }
  ];
  var IDB_STORE = "files";

  var DEFAULT_CONTENT = {
    settings: {
      calendarVisible: true
    },
    nextEvent: {
      visible: true,
      title: "NIA White Belt",
      titleEm: "\u00f3rarend",
      image: "images/nia-orarend-1.png",
      image2: "images/nia-orarend-2.png",
      imageAlt: "NIA White Belt \u00f3rarend \u2014 2026. szeptember 19\u201321., Budapest",
      image2Alt: "NIA White Belt \u00f3rarend \u2014 2026. szeptember 22\u201324., Budapest",
      date: "2026-09-19",
      time: "09:45",
      lead: "Kedvesek!",
      p1: "Hat napos Nia White Belt k\u00e9pz\u00e9s Budapesten, Brezina King\u00e1val. Az \u00f3rarend a napok ritmus\u00e1t mutatja: session\u00f6k, Nia \u00f3r\u00e1k, t\u00e9rteremt\u00e9s \u00e9s pihen\u0151k.",
      p2: "A k\u00e9pz\u00e9s szeptember 19-\u00e9n, szombaton kezd\u0151dik, \u00e9s 24-\u00e9n, cs\u00fct\u00f6rt\u00f6k\u00f6n a Feh\u00e9r \u00d6v \u00dcnneppel z\u00e1rul.",
      when: "2026. szeptember 19\u201324.",
      price: "",
      place: "Budapest\nBrezina Kinga",
      cta: "Jelentkezem a k\u00e9pz\u00e9sre",
      ctaHref: "kapcsolat.html"
    },
    prevEvent: {
      visible: true,
      title: "\u0150szi j\u00f3ga\u00f3ra",
      titleEm: "Atk\u00e1ron",
      image: "images/oszi-joga.png",
      imageAlt: "\u0150szi j\u00f3ga\u00f3r\u00e1imra v\u00e1rlak szeretettel \u2014 2026. szeptember 10., 18:00, Atk\u00e1r",
      date: "2026-09-10",
      time: "18:00",
      lead: "Kedves J\u00f3g\u00e1saim!",
      p1: "Lassan itt az \u0151sz, m\u00e9g ha az id\u0151j\u00e1r\u00e1s kegyes is hozz\u00e1nk ebb\u0151l a szempontb\u00f3l. De a naps\u00fct\u00e9ses \u00f3r\u00e1k m\u00e1r r\u00f6videbbek est\u00e9nk\u00e9nt, jelezve hogy egyre ink\u00e1bb itt az \u0151sz.",
      p2: "Szeretettel v\u00e1rlak cs\u00fct\u00f6rt\u00f6k\u00f6n 18:00-t\u00f3l a j\u00f3ga \u00f3r\u00e1mra, egy kicsit el\u00e9 megy\u00fcnk a depresszi\u00f3s, bez\u00e1rk\u00f3z\u00f3s hangulatoknak. Olyan \u00e1szan\u00e1kkal, l\u00e9gz\u0151gyakorlatokkal k\u00e9sz\u00fcl\u00f6k, amellyel vissza hozzuk a ny\u00e1r hangulat\u00e1t. A gondtalan h\u00e9tk\u00f6znapokat \u00e9s vak\u00e1ci\u00f3kat.",
      when: "2026. szeptember 10. \u2022 18:00",
      price: "1 000 Ft / alkalom",
      place: "Egressy G\u00e1bor M\u0171vel\u0151d\u00e9si H\u00e1z \u00e9s K\u00f6nyvt\u00e1r\nAtk\u00e1r, F\u0151 \u00fat 46.",
      cta: "",
      ctaHref: "kapcsolat.html"
    },
    events: [
      {
        id: "ev-2026-09-19",
        date: "2026-09-19",
        time: "09:45",
        type: "joga",
        title: "NIA White Belt",
        place: "Budapest \u00b7 Brezina Kinga",
        note: "2026. szeptember 19\u201324.",
        href: "kapcsolat.html"
      }
    ]
  };

  if (window.HJ_PAGE_DEFAULTS) DEFAULT_CONTENT.pages = window.HJ_PAGE_DEFAULTS;

  function clone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function isPastPoster(ev) {
    if (!ev || typeof ev !== "object") return false;
    var img = String(ev.image || "");
    var t = String(ev.title || "");
    return img.indexOf("oszi-joga") !== -1 || /szi j[o\u00f3]ga/i.test(t);
  }

  function merge(extra) {
    var out = clone(DEFAULT_CONTENT);
    if (!extra || typeof extra !== "object") return out;
    if (extra.settings && typeof extra.settings === "object") {
      out.settings = Object.assign({}, out.settings, extra.settings);
    }
    if (extra.nextEvent && typeof extra.nextEvent === "object") {
      if (isPastPoster(extra.nextEvent) && !extra.prevEvent) {
        out.prevEvent = Object.assign({}, out.prevEvent, extra.nextEvent, { cta: "" });
      } else {
        out.nextEvent = Object.assign({}, out.nextEvent, extra.nextEvent);
      }
    }
    if (extra.prevEvent && typeof extra.prevEvent === "object") {
      out.prevEvent = Object.assign({}, out.prevEvent, extra.prevEvent);
    }
    if (Array.isArray(extra.events)) {
      var onlyPast = extra.events.length && extra.events.every(function (ev) { return isPastPoster(ev); });
      out.events = onlyPast ? DEFAULT_CONTENT.events.slice() : extra.events.slice();
    }
    out.pages = out.pages || {};
    if (extra.pages && typeof extra.pages === "object") {
      Object.keys(extra.pages).forEach(function (id) {
        out.pages[id] = Object.assign({}, out.pages[id] || {}, extra.pages[id] || {});
      });
    }
    return out;
  }

  function readLocal() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error("idb"));
        return;
      }
      var req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains(IDB_STORE)) {
          req.result.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function idbPut(key, value) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).put(value, key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    }).catch(function () {});
  }

  function idbGet(key) {
    return openDb().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(IDB_STORE, "readonly");
        var g = tx.objectStore(IDB_STORE).get(key);
        g.onsuccess = function () { resolve(g.result || ""); };
        g.onerror = function () { resolve(""); };
      });
    }).catch(function () { return ""; });
  }

  function imageCache() {
    var c = window.__HJ_IMAGE_CACHE;
    if (c && typeof c === "object" && !Array.isArray(c)) return c;
    var map = {};
    if (typeof c === "string" && c) map["next-event"] = c;
    window.__HJ_IMAGE_CACHE = map;
    return map;
  }

  function cacheGet(id) {
    return imageCache()[id] || "";
  }

  function cacheSet(id, val) {
    imageCache()[id] = val || "";
  }

  function offloadDataUrl(val, idbKey) {
    if (!val || String(val).indexOf("data:") !== 0) return val;
    cacheSet(idbKey, val);
    idbPut(idbKey, val);
    return "idb:" + idbKey;
  }

  function persist(data) {
    var copy = clone(data);
    if (copy.nextEvent && copy.nextEvent.image) {
      copy.nextEvent.image = offloadDataUrl(copy.nextEvent.image, "next-event");
    }
    if (copy.nextEvent && copy.nextEvent.image2) {
      copy.nextEvent.image2 = offloadDataUrl(copy.nextEvent.image2, "next-event-2");
    }
    if (copy.prevEvent && copy.prevEvent.image) {
      copy.prevEvent.image = offloadDataUrl(copy.prevEvent.image, "prev-event");
    }
    var pages = copy.pages || {};
    Object.keys(pages).forEach(function (pid) {
      var bucket = pages[pid] || {};
      Object.keys(bucket).forEach(function (key) {
        var v = bucket[key];
        if (typeof v === "string" && v.indexOf("data:") === 0) {
          bucket[key] = offloadDataUrl(v, "page-" + pid + "-" + key);
        }
      });
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
      return true;
    } catch (e) {
      return false;
    }
  }

  function readUsers() {
    try {
      var raw = localStorage.getItem(USERS_KEY);
      var list = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(list) || !list.length) return clone(DEFAULT_USERS);
      return list.filter(function (row) {
        return row && row.name && row.pass;
      });
    } catch (e) {
      return clone(DEFAULT_USERS);
    }
  }

  function writeUsers(list) {
    try { localStorage.setItem(USERS_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function sessionName() {
    try {
      var key = sessionStorage.getItem(AUTH_KEY);
      if (key === "1") {
        sessionStorage.setItem(AUTH_KEY, "Judit2026");
        return "Judit2026";
      }
      return key || "";
    } catch (e) {
      return "";
    }
  }

  function currentAccount() {
    var name = sessionName();
    if (!name) return null;
    return readUsers().filter(function (row) { return row.name === name; })[0] || null;
  }

  function isAuthed() {
    return !!currentAccount();
  }

  function setAuthed(on, name) {
    try {
      if (on && name) sessionStorage.setItem(AUTH_KEY, String(name));
      else sessionStorage.removeItem(AUTH_KEY);
    } catch (e) {}
  }

  function checkLogin(user, pass) {
    user = String(user || "").trim();
    pass = String(pass || "");
    return readUsers().some(function (row) {
      return row.name === user && row.pass === pass;
    });
  }

  function findUser(name) {
    name = String(name || "").trim().toLowerCase();
    return readUsers().filter(function (row) {
      return String(row.name).toLowerCase() === name;
    })[0] || null;
  }

  function applyEvents(data) {
    window.HJ_CONTENT = data;
    window.JUDIT_EVENTS = (data && data.events) ? data.events.slice() : [];
  }

  function setImgSrc(img, src) {
    if (!img || !src) return;
    img.src = src;
  }

  function resolveImage(src, done) {
    if (!src) {
      done("");
      return;
    }
    if (src.indexOf("idb:") === 0) {
      var id = src.slice(4);
      var hit = cacheGet(id);
      if (hit) {
        done(hit);
        return;
      }
      idbGet(id).then(function (url) {
        if (url) cacheSet(id, url);
        done(url || "");
      });
      return;
    }
    done(src);
  }

  function fillEventSlide(slide, ev) {
    if (!slide) return;
    if (!ev || ev.visible === false) {
      slide.hidden = true;
      return;
    }
    slide.hidden = false;
    var title = slide.querySelector("[data-event-title]");
    if (title) {
      title.textContent = "";
      title.appendChild(document.createTextNode((ev.title || "") + (ev.titleEm ? " " : "")));
      if (ev.titleEm) {
        var em = document.createElement("em");
        em.textContent = ev.titleEm;
        title.appendChild(em);
      }
    }
    var alt = ev.imageAlt || ev.title || "";
    var img = slide.querySelector("[data-event-image]");
    if (img) {
      img.alt = alt;
      if (!ev.image) {
        img.removeAttribute("src");
        img.hidden = true;
      } else {
        img.hidden = false;
        resolveImage(ev.image, function (url) { if (url) setImgSrc(img, url); });
      }
    }
    var img2 = slide.querySelector("[data-event-image-2]");
    if (img2) {
      img2.alt = ev.image2Alt || alt;
      if (!ev.image2) {
        img2.removeAttribute("src");
        img2.hidden = true;
      } else {
        img2.hidden = false;
        resolveImage(ev.image2, function (url) { if (url) setImgSrc(img2, url); });
      }
    }
    var lead = slide.querySelector("[data-event-lead]");
    if (lead) lead.textContent = ev.lead || "";
    var p1 = slide.querySelector("[data-event-p1]");
    if (p1) p1.textContent = ev.p1 || "";
    var p2 = slide.querySelector("[data-event-p2]");
    if (p2) p2.textContent = ev.p2 || "";
    var when = slide.querySelector("[data-event-when]");
    if (when) when.textContent = ev.when || "";
    var price = slide.querySelector("[data-event-price]");
    if (price) {
      price.textContent = ev.price || "";
      var priceRow = price.closest("li");
      if (priceRow) priceRow.hidden = !ev.price;
    }
    var place = slide.querySelector("[data-event-place]");
    if (place) {
      place.textContent = "";
      String(ev.place || "").split("\n").forEach(function (line, i) {
        if (i) place.appendChild(document.createElement("br"));
        place.appendChild(document.createTextNode(line));
      });
    }
    var cta = slide.querySelector("[data-event-cta]");
    var past = slide.querySelector("[data-event-past]");
    var hasCta = !!(ev.cta && String(ev.cta).trim());
    if (cta) {
      cta.hidden = !hasCta;
      if (hasCta) {
        cta.textContent = ev.cta;
        cta.href = ev.ctaHref || "kapcsolat.html";
      }
    }
    if (past) past.hidden = hasCta;
  }

  function renderNextEvent(data) {
    var box = document.getElementById("kovetkezo-esemeny");
    if (!box) return;
    var nextEv = data && data.nextEvent;
    var prevEv = data && data.prevEvent;
    var nextSlide = box.querySelector('[data-event-slide="next"]');
    var prevSlide = box.querySelector('[data-event-slide="prev"]');
    fillEventSlide(nextSlide, nextEv);
    fillEventSlide(prevSlide, prevEv);
    var showBox = (nextEv && nextEv.visible !== false) || (prevEv && prevEv.visible !== false);
    box.hidden = !showBox;
    var slider = box.querySelector("[data-event-slider]");
    if (slider) slider.classList.toggle("has-prev", !!(prevEv && prevEv.visible !== false));
  }

  function renderCalendarVisibility(data) {
    var sec = document.getElementById("naptar");
    if (!sec) return;
    var vis = !data.settings || data.settings.calendarVisible !== false;
    sec.hidden = !vis;
  }

  function applyPageCopy(data) {
    var pages = (data && data.pages) || {};
    document.querySelectorAll("[data-copy]").forEach(function (el) {
      var path = String(el.getAttribute("data-copy") || "").split(".");
      if (path.length < 2) return;
      var bucket = pages[path[0]];
      if (!bucket || bucket[path[1]] == null) return;
      var val = String(bucket[path[1]]);
      var attr = el.getAttribute("data-copy-attr");
      if (attr) {
        var prefix = el.getAttribute("data-copy-prefix") || "";
        var out = val;
        if (prefix === "tel:") out = val.replace(/\s+/g, "");
        el.setAttribute(attr, prefix + out);
        return;
      }
      var emKey = el.getAttribute("data-copy-em");
      if (emKey) {
        var emVal = bucket[emKey] || "";
        el.textContent = "";
        el.appendChild(document.createTextNode(val + (emVal ? " " : "")));
        if (emVal) {
          var em = document.createElement("em");
          em.textContent = emVal;
          el.appendChild(em);
        }
        return;
      }
      el.textContent = val;
      if (el.tagName === "OPTION" && el.getAttribute("value")) el.value = val;
    });
  }

  function applyPageImages(data) {
    var pages = (data && data.pages) || {};
    document.querySelectorAll("[data-image]").forEach(function (el) {
      var path = String(el.getAttribute("data-image") || "").split(".");
      if (path.length < 2) return;
      var bucket = pages[path[0]];
      if (!bucket) return;
      var altKey = el.getAttribute("data-image-alt");
      if (altKey && bucket[altKey] != null) el.alt = String(bucket[altKey]);
      if (bucket[path[1]] == null || bucket[path[1]] === "") return;
      var src = String(bucket[path[1]]);
      resolveImage(src, function (url) {
        if (url) el.src = url;
      });
    });
  }

  function ready(data) {
    applyEvents(data);
    renderNextEvent(data);
    renderCalendarVisibility(data);
    applyPageCopy(data);
    applyPageImages(data);
    document.dispatchEvent(new Event("hj-content-ready"));
  }

  function fetchJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("bad");
      return res.json();
    });
  }

  function postApi(data) {
    var acc = currentAccount();
    if (!acc) return;
    var payload = clone(data);
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = window.setTimeout(function () { if (ctrl) ctrl.abort(); }, 1500);
    return fetch("api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: acc.name,
        pass: acc.pass,
        content: payload,
        users: readUsers()
      }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      window.clearTimeout(timer);
      if (!res.ok) throw new Error("api");
      return res.json();
    }).catch(function () {
      window.clearTimeout(timer);
    });
  }

  window.HJStore = {
    defaultContent: clone(DEFAULT_CONTENT),
    merge: merge,
    checkLogin: checkLogin,
    isAuthed: isAuthed,
    setAuthed: setAuthed,
    currentUser: function () {
      var acc = currentAccount();
      return acc ? clone(acc) : null;
    },
    listUsers: function () {
      return readUsers().map(function (row) {
        return { id: row.id, name: row.name };
      });
    },
    userCount: function () {
      return readUsers().length;
    },
    updateSelf: function (name, pass) {
      name = String(name || "").trim();
      pass = String(pass || "");
      if (name.length < 3) return { ok: false, error: "A n\u00e9v legal\u00e1bb 3 karakter legyen." };
      if (pass.length < 4) return { ok: false, error: "A k\u00f3d legal\u00e1bb 4 karakter legyen." };
      var me = currentAccount();
      if (!me) return { ok: false, error: "Nincs bel\u00e9pve." };
      var clash = findUser(name);
      if (clash && clash.id !== me.id) {
        return { ok: false, error: "Ez a felhaszn\u00e1l\u00f3n\u00e9v m\u00e1r foglalt." };
      }
      var list = readUsers().map(function (row) {
        if (row.id !== me.id) return row;
        return { id: row.id, name: name, pass: pass };
      });
      writeUsers(list);
      setAuthed(true, name);
      postApi(window.HJ_CONTENT || clone(DEFAULT_CONTENT));
      return { ok: true };
    },
    addUser: function (name, pass) {
      name = String(name || "").trim();
      pass = String(pass || "");
      if (name.length < 3) return { ok: false, error: "A n\u00e9v legal\u00e1bb 3 karakter legyen." };
      if (pass.length < 4) return { ok: false, error: "A k\u00f3d legal\u00e1bb 4 karakter legyen." };
      if (findUser(name)) return { ok: false, error: "Ez a felhaszn\u00e1l\u00f3n\u00e9v m\u00e1r foglalt." };
      var list = readUsers();
      list.push({ id: "u-" + Date.now(), name: name, pass: pass });
      writeUsers(list);
      postApi(window.HJ_CONTENT || clone(DEFAULT_CONTENT));
      return { ok: true };
    },
    removeUser: function (id) {
      var me = currentAccount();
      if (!me) return { ok: false, error: "Nincs bel\u00e9pve." };
      if (me.id === id) return { ok: false, error: "A saj\u00e1t fi\u00f3kot nem lehet t\u00f6r\u00f6lni." };
      var list = readUsers();
      if (list.length < 2) return { ok: false, error: "Az utols\u00f3 felhaszn\u00e1l\u00f3t nem lehet t\u00f6r\u00f6lni." };
      var next = list.filter(function (row) { return row.id !== id; });
      if (next.length === list.length) return { ok: false, error: "Nincs ilyen felhaszn\u00e1l\u00f3." };
      writeUsers(next);
      postApi(window.HJ_CONTENT || clone(DEFAULT_CONTENT));
      return { ok: true };
    },
    resolveImage: resolveImage,
    putImage: function (dataUrl, key) {
      var id = key || "next-event";
      cacheSet(id, dataUrl || "");
      if (dataUrl) idbPut(id, dataUrl);
    },
    current: function () { return window.HJ_CONTENT ? clone(window.HJ_CONTENT) : clone(DEFAULT_CONTENT); },
    save: function (data, done) {
      var next = merge(data);
      var ok = persist(next);
      applyEvents(next);
      renderNextEvent(next);
      renderCalendarVisibility(next);
      applyPageCopy(next);
      applyPageImages(next);
      document.dispatchEvent(new Event("hj-content-ready"));
      if (done) done(ok);
      postApi(next);
    }
  };

  window.addEventListener("storage", function (e) {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try { ready(merge(JSON.parse(e.newValue))); } catch (err) {}
  });

  fetchJson("api/content")
    .then(function (remote) {
      ready(merge(remote));
    })
    .catch(function () {
      var local = readLocal();
      if (local) {
        ready(merge(local));
        return;
      }
      fetchJson("data/content.json")
        .then(function (file) { ready(merge(file)); })
        .catch(function () { ready(clone(DEFAULT_CONTENT)); });
    });
})();
