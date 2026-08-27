/* ============================================================
   Python Path — theme toggle (dark/light) with persistence
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var btn = document.getElementById("theme-toggle");
  var KEY = "python-path-theme";

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    if (btn) {
      btn.setAttribute("aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
  }

  // Restore saved preference, else honour system preference.
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var initial = saved ||
    (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light" : "dark");
  apply(initial);

  if (btn) {
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
    });
  }

  /* ---------- Language dropdown ---------- */

  var langWrap = document.querySelector(".lang");
  var langBtn = document.querySelector(".lang__toggle");
  var langMenu = document.querySelector(".lang__menu");
  var langFlag = document.querySelector(".lang__flag");

  function closeLang() {
    langMenu.hidden = true;
    langBtn.setAttribute("aria-expanded", "false");
  }

  langBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    var willOpen = langMenu.hidden;
    langMenu.hidden = !willOpen;
    langBtn.setAttribute("aria-expanded", String(willOpen));
  });

  document.addEventListener("click", function (e) {
    if (!langMenu.hidden && !langWrap.contains(e.target)) closeLang();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !langMenu.hidden) {
      closeLang();
      langBtn.focus();
    }
  });

  langMenu.querySelectorAll(".lang__item").forEach(function (item) {
    item.addEventListener("click", function () {
      langFlag.textContent = item.dataset.flag;
      langBtn.setAttribute(
        "aria-label", "Change language: " + item.dataset.name
      );
      langMenu.querySelectorAll(".lang__item").forEach(function (i) {
        i.classList.toggle("is-active", i === item);
      });
      closeLang();
    });
  });
})();
