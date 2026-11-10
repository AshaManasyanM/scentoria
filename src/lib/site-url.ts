/**
 * Public site origin for OAuth redirects and absolute URLs.
 * Prefer an explicit env, then reverse-proxy forwarded headers, then the request URL.
 */
export function publicOrigin(request: Request) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      /* fall through */
    }
  }

  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")?.split(",")[0]?.trim() ||
    "";
  if (host && !isLoopbackHost(host)) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

function isLoopbackHost(host: string) {
  const hostname = host.replace(/:\d+$/, "").toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function absoluteUrl(request: Request, pathname: string) {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${publicOrigin(request)}${path}`;
}
