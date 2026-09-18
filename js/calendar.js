(function () {
  "use strict";

  function bindClick(node, fn) {
    if (!node || !node.parentNode) return node;
    var clone = node.cloneNode(true);
    node.parentNode.replaceChild(clone, node);
    clone.addEventListener("click", fn);
    return clone;
  }

  function initCalendar() {
    var root = document.querySelector("[data-calendar]");
    if (!root) return;

    var events = Array.isArray(window.JUDIT_EVENTS) ? window.JUDIT_EVENTS.slice() : [];
    var monthLabel = root.querySelector("[data-cal-month]");
    var grid = root.querySelector("[data-cal-grid]");
    var weekdays = root.querySelector("[data-cal-weekdays]");
    var list = root.querySelector("[data-cal-list]");
    var panelLabel = root.querySelector("[data-cal-panel-label]");
    var prevBtn = root.querySelector("[data-cal-prev]");
    var nextBtn = root.querySelector("[data-cal-next]");

    var MONTHS = [
      "janu\u00e1r", "febru\u00e1r", "m\u00e1rcius", "\u00e1prilis", "m\u00e1jus", "j\u00fanius",
      "j\u00falius", "augusztus", "szeptember", "okt\u00f3ber", "november", "december"
    ];
    var WEEKDAYS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
    var TYPES = {
      joga: "J\u00f3ga",
      aid: "Els\u0151seg\u00e9ly",
      coach: "Coaching"
    };

    function parseDay(iso) {
      var p = String(iso).split("-");
      return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }

    function keyOf(date) {
      var m = String(date.getMonth() + 1).padStart(2, "0");
      var d = String(date.getDate()).padStart(2, "0");
      return date.getFullYear() + "-" + m + "-" + d;
    }

    function startOfDay(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function eventsOn(iso) {
      return events.filter(function (item) { return item.date === iso; });
    }

    function eventsInMonth(year, month) {
      return events.filter(function (item) {
        var d = parseDay(item.date);
        return d.getFullYear() === year && d.getMonth() === month;
      }).sort(function (a, b) {
        return a.date === b.date ? String(a.time || "").localeCompare(String(b.time || "")) : a.date.localeCompare(b.date);
      });
    }

    var today = startOfDay(new Date());
    var upcoming = events
      .map(function (item) { return { item: item, day: startOfDay(parseDay(item.date)) }; })
      .filter(function (row) { return row.day >= today; })
      .sort(function (a, b) { return a.day - b.day; })[0];

    var view = upcoming
      ? new Date(upcoming.day.getFullYear(), upcoming.day.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 1);
    var selected = upcoming ? keyOf(upcoming.day) : "";

    function el(tag, className, text) {
      var node = document.createElement(tag);
      if (className) node.className = className;
      if (text) node.textContent = text;
      return node;
    }

    function renderWeekdays() {
      if (!weekdays) return;
      weekdays.innerHTML = "";
      WEEKDAYS.forEach(function (name) {
        weekdays.appendChild(el("span", "", name));
      });
    }

    function renderPanel(year, month, iso) {
      if (!list || !panelLabel) return;
      list.innerHTML = "";
      var rows = iso ? eventsOn(iso) : eventsInMonth(year, month);

      if (iso) {
        var day = parseDay(iso);
        panelLabel.textContent = day.getFullYear() + ". " + MONTHS[day.getMonth()] + " " + day.getDate() + ".";
      } else {
        panelLabel.textContent = "A h\u00f3nap id\u0151pontjai";
      }

      if (!rows.length) {
        var empty = el("p", "cal-empty", iso
          ? "Ezen a napon nincs meghirdetett id\u0151pont."
          : "Ebben a h\u00f3napban m\u00e9g nincs meghirdetett id\u0151pont.");
        list.appendChild(empty);
        return;
      }

      rows.forEach(function (item) {
        var card = el("article", "cal-item cal-item--" + (item.type || "joga"));
        var when = el("p", "cal-item__when", parseDay(item.date).getDate() + ". \u00b7 " + item.time);
        var title = el("h4", "", item.title);
        var type = el("p", "cal-item__type", TYPES[item.type] || "");
        card.appendChild(when);
        card.appendChild(type);
        card.appendChild(title);
        if (item.place) card.appendChild(el("p", "cal-item__place", item.place));
        if (item.note) card.appendChild(el("p", "cal-item__note", item.note));
        if (item.href) {
          var link = el("a", "btn btn--ghost", "Jelentkezem");
          link.href = item.href;
          card.appendChild(link);
        }
        list.appendChild(card);
      });
    }

    function render() {
      var year = view.getFullYear();
      var month = view.getMonth();
      if (monthLabel) monthLabel.textContent = year + ". " + MONTHS[month];

      if (!grid) return;
      grid.innerHTML = "";

      var first = new Date(year, month, 1);
      var startPad = (first.getDay() + 6) % 7;
      var daysInMonth = new Date(year, month + 1, 0).getDate();
      var total = Math.ceil((startPad + daysInMonth) / 7) * 7;

      for (var i = 0; i < total; i += 1) {
        var dayNum = i - startPad + 1;
        if (dayNum < 1 || dayNum > daysInMonth) {
          grid.appendChild(el("div", "cal-day cal-day--pad"));
          continue;
        }

        var iso = keyOf(new Date(year, month, dayNum));
        var dayEvents = eventsOn(iso);
        var btn = el("button", "cal-day", "");
        btn.type = "button";
        btn.setAttribute("data-date", iso);
        if (iso === keyOf(today)) btn.setAttribute("aria-current", "date");
        if (iso === selected) btn.classList.add("is-selected");
        if (iso === keyOf(today)) btn.classList.add("is-today");
        if (dayEvents.length) {
          btn.classList.add("is-event");
          btn.classList.add("is-event--" + (dayEvents[0].type || "joga"));
        }

        btn.appendChild(el("span", "cal-day__num", String(dayNum)));
        if (dayEvents.length) {
          var dots = el("span", "cal-day__dots");
          dayEvents.slice(0, 3).forEach(function (item) {
            dots.appendChild(el("i", "cal-dot cal-dot--" + (item.type || "joga")));
          });
          btn.appendChild(dots);
        }

        btn.addEventListener("click", function (event) {
          var next = event.currentTarget.getAttribute("data-date");
          selected = selected === next ? "" : next;
          render();
        });

        grid.appendChild(btn);
      }

      renderPanel(year, month, selected && selected.indexOf(year + "-" + String(month + 1).padStart(2, "0")) === 0 ? selected : "");
    }

    prevBtn = bindClick(prevBtn, function () {
      view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
      selected = "";
      render();
    });
    nextBtn = bindClick(nextBtn, function () {
      view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
      selected = "";
      render();
    });

    renderWeekdays();
    render();
  }

  window.initCalendar = initCalendar;

  document.addEventListener("hj-content-ready", initCalendar);
  if (window.HJ_CONTENT) initCalendar();
})();
