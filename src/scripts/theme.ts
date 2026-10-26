const THEME_KEY = "theme";
const LIGHT = "light";
const DARK = "dark";

function getPreferredTheme(): string {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch {
    /* private browsing */
  }
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? DARK
    : LIGHT;
}

// Reuse the value already set by the inline FOUC-prevention script if available.
let themeValue: string =
  (window as unknown as { __theme?: { value: string } }).__theme?.value ??
  getPreferredTheme();

function persist(): void {
  try {
    localStorage.setItem(THEME_KEY, themeValue);
  } catch {
    /* private browsing */
  }
  reflect();
}

function reflect(): void {
  const root = document.firstElementChild;
  root?.setAttribute("data-theme", themeValue);
  root?.classList.toggle("dark", themeValue === DARK);
  document
    .querySelector("#theme-btn")
    ?.setAttribute(
      "aria-label",
      `Switch to ${themeValue === DARK ? LIGHT : DARK} theme`
    );

  // Fill <meta name="theme-color"> with the computed background colour so
  // Android's browser chrome matches the page background.
  const bg = window.getComputedStyle(document.body).backgroundColor;
  document
    .querySelector("meta[name='theme-color']")
    ?.setAttribute("content", bg);
}

function setup(): void {
  reflect();
  document.querySelector("#theme-btn")?.addEventListener("click", () => {
    themeValue = themeValue === LIGHT ? DARK : LIGHT;
    persist();
  });
}

setup();

// Re-run after View Transitions navigation.
document.addEventListener("astro:after-swap", setup);

// Carry the theme-color value across View Transitions to prevent the
// Android navigation bar from flashing during page transitions.
document.addEventListener("astro:before-swap", event => {
  const color = document
    .querySelector("meta[name='theme-color']")
    ?.getAttribute("content");
  if (color) {
    (event as { newDocument: Document }).newDocument
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", color);
  }
});

// Sync with OS-level dark/light preference changes.
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", ({ matches }) => {
    try {
      if (localStorage.getItem(THEME_KEY)) return;
    } catch {
      /* private browsing */
    }
    themeValue = matches ? DARK : LIGHT;
    reflect();
  });
