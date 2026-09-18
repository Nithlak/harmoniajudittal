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
      title: "\u0150szi j\u00f3ga\u00f3ra",
      titleEm: "Atk\u00e1ron",
      image: "images/oszi-joga.png",
      imageAlt: "\u0150szi j\u00f3ga\u00f3r\u00e1imra v\u00e1rlak szeretettel",
      date: "2026-09-10",
      time: "18:00",
      lead: "Kedves J\u00f3g\u00e1saim!",
      p1: "Lassan itt az \u0151sz, m\u00e9g ha az id\u0151j\u00e1r\u00e1s kegyes is hozz\u00e1nk ebb\u0151l a szempontb\u00f3l. De a naps\u00fct\u00e9ses \u00f3r\u00e1k m\u00e1r r\u00f6videbbek est\u00e9nk\u00e9nt, jelezve hogy egyre ink\u00e1bb itt az \u0151sz.",
      p2: "Szeretettel v\u00e1rlak cs\u00fct\u00f6rt\u00f6k\u00f6n 18:00-t\u00f3l a j\u00f3ga \u00f3r\u00e1mra, egy kicsit el\u00e9 megy\u00fcnk a depresszi\u00f3s, bez\u00e1rk\u00f3z\u00f3s hangulatoknak. Olyan \u00e1szan\u00e1kkal, l\u00e9gz\u0151gyakorlatokkal k\u00e9sz\u00fcl\u00f6k, amellyel vissza hozzuk a ny\u00e1r hangulat\u00e1t. A gondtalan h\u00e9tk\u00f6znapokat \u00e9s vak\u00e1ci\u00f3kat.",
      when: "2026. szeptember 10. \u2022 18:00",
      price: "1 000 Ft / alkalom",
      place: "Egressy G\u00e1bor M\u0171vel\u0151d\u00e9si H\u00e1z \u00e9s K\u00f6nyvt\u00e1r\nAtk\u00e1r, F\u0151 \u00fat 46.",
      cta: "Jelentkezem az \u00f3r\u00e1ra",
      ctaHref: "kapcsolat.html"
    },
    events: [
      {
        id: "ev-2026-09-10",
        date: "2026-09-10",
        time: "18:00",
        type: "joga",
        title: "\u0150szi j\u00f3ga\u00f3ra",
        place: "Egressy G\u00e1bor M\u0171vel\u0151d\u00e9si H\u00e1z \u00e9s K\u00f6nyvt\u00e1r, Atk\u00e1r, F\u0151 \u00fat 46.",
        note: "1 000 Ft / alkalom",
        href: "kapcsolat.html"
      }
    ]
  };

  if (window.HJ_PAGE_DEFAULTS) DEFAULT_CONTENT.pages = window.HJ_PAGE_DEFAULTS;

  function clone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function merge(extra) {
    var out = clone(DEFAULT_CONTENT);
    if (!extra || typeof extra !== "object") return out;
    if (extra.settings && typeof extra.settings === "object") {
      out.settings = Object.assign({}, out.settings, extra.settings);
    }
    if (extra.nextEvent && typeof extra.nextEvent === "object") {
      out.nextEvent = Object.assign({}, out.nextEvent, extra.nextEvent);
    }
    if (Array.isArray(extra.events)) out.events = extra.events.slice();
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

  function persist(data) {
    var copy = clone(data);
    var img = copy.nextEvent && copy.nextEvent.image;
    if (img && img.indexOf("data:") === 0 && img.length > 180000) {
      window.__HJ_IMAGE_CACHE = img;
      idbPut("next-event", img);
      copy.nextEvent.image = "idb:next-event";
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
      return true;
    } catch (e) {
      if (img && img.indexOf("data:") === 0) {
        window.__HJ_IMAGE_CACHE = img;
        idbPut("next-event", img);
        copy.nextEvent.image = "idb:next-event";
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
          return true;
        } catch (e2) {
          return false;
        }
      }
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
      if (window.__HJ_IMAGE_CACHE) {
        done(window.__HJ_IMAGE_CACHE);
        return;
      }
      idbGet(src.slice(4)).then(function (url) {
        if (url) window.__HJ_IMAGE_CACHE = url;
        done(url || "");
      });
      return;
    }
    done(src);
  }

  function renderNextEvent(data) {
    var box = document.getElementById("kovetkezo-esemeny");
    if (!box) return;
    var ev = data && data.nextEvent;
    if (!ev || ev.visible === false) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    var title = box.querySelector("[data-event-title]");
    if (title) {
      title.textContent = "";
      title.appendChild(document.createTextNode((ev.title || "") + (ev.titleEm ? " " : "")));
      if (ev.titleEm) {
        var em = document.createElement("em");
        em.textContent = ev.titleEm;
        title.appendChild(em);
      }
    }
    var img = box.querySelector("[data-event-image]");
    if (img) {
      img.alt = ev.imageAlt || ev.title || "";
      if (!ev.image) {
        img.removeAttribute("src");
        img.hidden = true;
      } else {
        img.hidden = false;
        resolveImage(ev.image, function (url) { if (url) setImgSrc(img, url); });
      }
    }
    var lead = box.querySelector("[data-event-lead]");
    if (lead) lead.textContent = ev.lead || "";
    var p1 = box.querySelector("[data-event-p1]");
    if (p1) p1.textContent = ev.p1 || "";
    var p2 = box.querySelector("[data-event-p2]");
    if (p2) p2.textContent = ev.p2 || "";
    var when = box.querySelector("[data-event-when]");
    if (when) when.textContent = ev.when || "";
    var price = box.querySelector("[data-event-price]");
    if (price) price.textContent = ev.price || "";
    var place = box.querySelector("[data-event-place]");
    if (place) {
      place.textContent = "";
      String(ev.place || "").split("\n").forEach(function (line, i) {
        if (i) place.appendChild(document.createElement("br"));
        place.appendChild(document.createTextNode(line));
      });
    }
    var cta = box.querySelector("[data-event-cta]");
    if (cta) {
      cta.textContent = ev.cta || "Jelentkezem";
      cta.href = ev.ctaHref || "kapcsolat.html";
    }
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

  function ready(data) {
    applyEvents(data);
    renderNextEvent(data);
    renderCalendarVisibility(data);
    applyPageCopy(data);
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
    putImage: function (dataUrl) {
      window.__HJ_IMAGE_CACHE = dataUrl || "";
      if (dataUrl) idbPut("next-event", dataUrl);
    },
    current: function () { return window.HJ_CONTENT ? clone(window.HJ_CONTENT) : clone(DEFAULT_CONTENT); },
    save: function (data, done) {
      var next = merge(data);
      var ok = persist(next);
      applyEvents(next);
      renderNextEvent(next);
      renderCalendarVisibility(next);
      applyPageCopy(next);
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
