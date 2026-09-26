type GoogleProfile = { name: string; email: string; image?: string };

type TokenClient = {
  requestAccessToken: () => void;
};

type TokenResponse = {
  access_token?: string;
  error?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
            error_callback?: (error: { type?: string }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const src = "https://accounts.google.com/gsi/client";
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("google-script")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("google-script"));
    document.head.appendChild(script);
  });
}

export function googleClientId() {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
}

export async function requestGoogleProfile(): Promise<GoogleProfile> {
  const clientId = googleClientId();
  if (!clientId) throw new Error("missing-client");
  await loadGoogleScript();
  const google = window.google;
  if (!google?.accounts?.oauth2) throw new Error("google-script");

  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      error_callback: () => reject(new Error("google-cancelled")),
      callback: (response) => {
        if (!response.access_token) {
          reject(new Error(response.error || "google"));
          return;
        }
        fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${response.access_token}` },
        })
          .then(async (result) => {
            if (!result.ok) throw new Error("google-profile");
            const data = (await result.json()) as { name?: string; email?: string; picture?: string };
            if (!data.email) throw new Error("google-profile");
            resolve({ name: data.name ?? "", email: data.email, image: data.picture });
          })
          .catch((error: unknown) => reject(error));
      },
    });
    client.requestAccessToken();
  });
}
