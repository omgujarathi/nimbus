const root = document.documentElement;
const switchButtons = document.querySelectorAll("[data-switch-lang]");
const translatable = document.querySelectorAll("[data-en][data-mr]");

function setLanguage(lang) {
  root.dataset.lang = lang;
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

setLanguage("en");
