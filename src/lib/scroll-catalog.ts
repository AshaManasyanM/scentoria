export function scrollToCatalog() {
  const align = (behavior: ScrollBehavior) => {
    const section = document.getElementById("catalog");
    if (!section) return;
    const header = document.querySelector("header");
    const overlap = Math.max(0, header?.getBoundingClientRect().bottom ?? 0);
    const top = Math.max(0, section.getBoundingClientRect().top + window.scrollY - overlap);
    if (Math.abs(window.scrollY - top) < 4) return;
    window.scrollTo({ top, behavior });
  };

  window.setTimeout(() => align("smooth"), 60);
  window.setTimeout(() => align("smooth"), 280);
}
