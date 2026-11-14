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

// Sideways card rows on phones and tablets (Why Nimbus, Quality, Manufacturing steps).
// Each ".swipe-hint" sits right after its row: light up the dot for the card in view
// and hide the "Swipe" cue once the last card is reached.
document.querySelectorAll(".swipe-hint").forEach((swipeHint) => {
  const swipeRow = swipeHint.previousElementSibling;
  if (!swipeRow) return;

  const swipeCards = Array.from(swipeRow.querySelectorAll("article"));
  const swipeDots = Array.from(swipeHint.querySelectorAll(".swipe-dots i"));

  function updateSwipeHint() {
    const room = swipeRow.scrollWidth - swipeRow.clientWidth;

    // Every card already fits (desktop): no cue needed
    swipeHint.classList.toggle("is-static", room <= 4);

    const atEnd = room > 4 && swipeRow.scrollLeft >= room - 4;
    const rowLeft = swipeRow.getBoundingClientRect().left;

    // The card resting closest to the left edge of the row counts as "in view"
    let current = 0;
    let closest = Infinity;
    swipeCards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - rowLeft);
      if (distance < closest) { closest = distance; current = index; }
    });
    if (atEnd) current = swipeCards.length - 1;

    swipeDots.forEach((dot, index) => dot.classList.toggle("is-active", index === current));
    swipeHint.classList.toggle("is-end", atEnd);
  }

  swipeRow.addEventListener("scroll", () => requestAnimationFrame(updateSwipeHint), { passive: true });
  window.addEventListener("resize", updateSwipeHint);
  updateSwipeHint();
});

// Photo slideshows (hero, Products, Manufacturing).
// Each [data-slideshow] box holds stacked photos; this adds the dots and arrows,
// changes the photo every few seconds, and lets phone users swipe left and right.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll("[data-slideshow]").forEach((box) => {
  const slides = Array.from(box.querySelectorAll(".slide"));
  if (slides.length < 2) return;

  let current = 0;
  let timer = null;
  let hovering = false;
  let onScreen = !("IntersectionObserver" in window);

  // Later photos carry data-src instead of src, so they are downloaded only when about to be needed
  function load(index) {
    const img = slides[(index + slides.length) % slides.length];
    if (img.dataset.src) {
      img.src = img.dataset.src;
      delete img.dataset.src;
    }
    return img;
  }

  const dots = document.createElement("div");
  dots.className = "slide-dots";
  const dotButtons = slides.map((slide, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", "Photo " + (index + 1) + " of " + slides.length);
    dot.addEventListener("click", () => { show(index); restart(); });
    dots.appendChild(dot);
    return dot;
  });

  function arrow(className, label, symbol, step) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slide-arrow " + className;
    button.setAttribute("aria-label", label);
    button.textContent = symbol;
    button.addEventListener("click", () => { show(current + step); restart(); });
    return button;
  }

  box.append(arrow("prev", "Previous photo", "\u2039", -1), arrow("next", "Next photo", "\u203A", 1), dots);

  function show(index) {
    current = (index + slides.length) % slides.length;
    load(current);
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === current);
      slide.setAttribute("aria-hidden", String(i !== current));
    });
    dotButtons.forEach((dot, i) => dot.classList.toggle("is-active", i === current));
    if (onScreen) load(current + 1); // fetch the following photo in the background
  }

  // Automatic change: only while the photo is on screen, the tab is visible and the mouse is not on it.
  // If the next photo has not finished downloading yet, wait for the next turn instead of showing a blank.
  function tick() {
    const next = load(current + 1);
    if (next.complete && next.naturalWidth > 0) show(current + 1);
  }

  function stop() { clearInterval(timer); timer = null; }
  function start() {
    stop();
    if (reducedMotion || hovering || !onScreen || document.hidden) return;
    timer = setInterval(tick, 5000);
  }
  function restart() { start(); }

  box.addEventListener("mouseenter", () => { hovering = true; stop(); });
  box.addEventListener("mouseleave", () => { hovering = false; start(); });
  document.addEventListener("visibilitychange", start);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      if (onScreen) load(current + 1);
      start();
    }, { threshold: 0.4 }).observe(box);
  }

  // Swipe left / right on touch screens
  let touchX = null;
  let touchY = null;
  box.addEventListener("touchstart", (event) => {
    touchX = event.touches[0].clientX;
    touchY = event.touches[0].clientY;
  }, { passive: true });
  box.addEventListener("touchend", (event) => {
    if (touchX === null) return;
    const dx = event.changedTouches[0].clientX - touchX;
    const dy = event.changedTouches[0].clientY - touchY;
    touchX = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      show(current + (dx < 0 ? 1 : -1));
      restart();
    }
  }, { passive: true });

  show(0);
  start();
});
