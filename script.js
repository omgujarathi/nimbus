const root = document.documentElement;
const switchButtons = document.querySelectorAll("[data-switch-lang]");
const translatable = document.querySelectorAll("[data-en][data-mr]");

function setLanguage(lang) {
  root.dataset.lang = lang;
  try { localStorage.setItem("nimbus-lang", lang); } catch (error) { /* private mode: just don't remember */ }
  root.lang = lang === "mr" ? "mr" : "en";

  translatable.forEach((node) => {
    const nextValue = node.dataset[lang];
    if (!nextValue) return;
    node.textContent = nextValue;
  });

  switchButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.switchLang === lang);
  });
}

switchButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.switchLang));
});

// Start in the language chosen on the previous page, English otherwise
let savedLang = "en";
try { savedLang = localStorage.getItem("nimbus-lang") || "en"; } catch (error) { /* storage unavailable */ }
setLanguage(savedLang === "mr" ? "mr" : "en");

// Mobile menu: the three-line button opens and closes the navigation panel
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");

function setMenu(open) {
  header.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

if (header && navToggle) {
  navToggle.addEventListener("click", () => setMenu(!header.classList.contains("is-open")));

  // Close after choosing a section or tapping Contact Us
  header.querySelectorAll(".site-nav a, .contact-chip").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  // Close when tapping outside the header or pressing Escape
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });
}
