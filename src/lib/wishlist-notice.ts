const HEART = `<svg width="16" height="14" viewBox="0 0 25 22" aria-hidden="true"><path d="M22.5737 1.49585C19.8979 -0.784421 15.9185 -0.374265 13.4624 2.15991L12.5005 3.15112L11.5386 2.15991C9.0874 -0.374265 5.10303 -0.784421 2.42725 1.49585C-0.63916 4.11304 -0.800293 8.8103 1.94385 11.6472L11.3921 21.4031C12.0024 22.033 12.9937 22.033 13.604 21.4031L23.0522 11.6472C25.8013 8.8103 25.6401 4.11304 22.5737 1.49585Z" fill="#c5a059"/></svg>`;

let hideTimer = 0;

export function showWishlistNotice(message: string) {
  let notice = document.getElementById("wishlist-notice");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "wishlist-notice";
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
  notice.innerHTML = `${HEART}<span></span>`;
  const label = notice.querySelector("span");
  if (label) label.textContent = message;
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => notice?.remove(), 2800);
}
