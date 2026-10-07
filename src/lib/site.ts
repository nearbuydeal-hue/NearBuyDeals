export function getSiteUrl(): URL | undefined {
  const configuredUrl = process.env.SITE_URL;
  if (!configuredUrl) {
    return undefined;
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error("SITE_URL must be a valid absolute URL.");
  }

  const isLocalHttp =
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);

  if (url.username || url.password) {
    throw new Error("SITE_URL must not include credentials.");
  }

  if (isLocalHttp) {
    return process.env.NODE_ENV === "production"
      ? undefined
      : new URL(url.origin);
  }

  if (url.protocol !== "https:") {
    throw new Error(
      "SITE_URL must use HTTPS except for localhost during development.",
    );
  }

  return new URL(url.origin);
}
