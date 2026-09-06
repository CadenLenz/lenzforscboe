const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
// Keep anchor offsets correct when enlarged text changes the sticky header's height.
new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty(
    "--header-height",
    `${entry.target.getBoundingClientRect().height}px`,
  );
}).observe(document.querySelector(".site-header"));
const links = [...nav.querySelectorAll("a")];
function closeMenu(restoreFocus = false) {
  nav.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
  if (restoreFocus) toggle.focus();
}
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
});
links.forEach((link) =>
  link.addEventListener("click", () => {
    closeMenu();
    const target = document.querySelector(link.hash);
    target.focus({ preventScroll: true });
  }),
);
document.addEventListener("keydown", (event) => {
  if (toggle.getAttribute("aria-expanded") !== "true") return;
  if (event.key === "Escape") closeMenu(true);
  if (event.key === "Tab") {
    if (event.shiftKey && document.activeElement === toggle) {
      event.preventDefault();
      links.at(-1).focus();
    } else if (!event.shiftKey && document.activeElement === links.at(-1)) {
      event.preventDefault();
      toggle.focus();
    }
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) closeMenu();
});
matchMedia("(min-width:1051px)").addEventListener("change", () => closeMenu());
const sections = [...document.querySelectorAll("main > section[id]")];
const backTop = document.querySelector(".back-top");
let scheduled = false;
function updatePosition() {
  const boundary =
    document.querySelector(".site-header").getBoundingClientRect().height + 80;
  let current = sections[0];
  for (const section of sections)
    if (section.getBoundingClientRect().top <= boundary) current = section;
  links.forEach((link) => {
    if (link.hash === "#" + current.id)
      link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  backTop.hidden = window.scrollY < 600;
  scheduled = false;
}
window.addEventListener(
  "scroll",
  () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updatePosition);
    }
  },
  { passive: true },
);
window.addEventListener("resize", updatePosition);
updatePosition();
document.querySelector("[data-year]").textContent = new Date().getFullYear();
