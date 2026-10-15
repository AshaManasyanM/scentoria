const BAG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c5a059" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6.2 8h11.6l-.9 10.2a1.2 1.2 0 0 1-1.2 1.1H8.3a1.2 1.2 0 0 1-1.2-1.1L6.2 8Z"/><path stroke-linecap="round" d="M9 8V6.8A3 3 0 0 1 12 3.8 3 3 0 0 1 15 6.8V8"/></svg>`;

let hideTimer = 0;

export function showCartNotice(message: string) {
  let notice = document.getElementById("cart-notice");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "cart-notice";
    notice.setAttribute("role", "status");
    notice.style.position = "fixed";
    notice.style.right = "16px";
    notice.style.bottom = "16px";
    notice.style.zIndex = "80";
    notice.style.display = "flex";
    notice.style.alignItems = "center";
    notice.style.gap = "10px";
    notice.style.maxWidth = "280px";
    notice.style.padding = "12px 16px";
    notice.style.borderRadius = "2px";
    notice.style.background = "#083534";
    notice.style.color = "#f7f2ea";
    notice.style.fontSize = "14px";
    notice.style.lineHeight = "1.3";
    notice.style.boxShadow = "0 8px 24px rgba(8,53,52,0.18)";
    document.body.appendChild(notice);
  }
  notice.innerHTML = `${BAG}<span></span>`;
  const label = notice.querySelector("span");
  if (label) label.textContent = message;
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => notice?.remove(), 2800);
}
