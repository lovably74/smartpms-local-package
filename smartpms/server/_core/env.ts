function buildDatabaseUrlFromParts(): string {
  const host = process.env.DB_HOST?.trim();
  const port = process.env.DB_PORT?.trim() || "3306";
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";
  const name = process.env.DB_NAME?.trim();

  if (!host || !user || !name) return "";

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  return `mysql://${encodedUser}:${encodedPassword}@${host}:${port}/${name}`;
}

const databaseUrl = process.env.DATABASE_URL?.trim() || buildDatabaseUrlFromParts();

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  allowLocalLogin: process.env.ALLOW_LOCAL_LOGIN === "1",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl,
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerName: process.env.OWNER_NAME ?? "local-admin",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  bookstackUrl: process.env.BOOKSTACK_URL ?? "http://wiki.smartpms.net:7080",
  bookstackHost: process.env.BOOKSTACK_DB_HOST ?? "127.0.0.1",
  bookstackUser: process.env.BOOKSTACK_DB_USER ?? "bookstack",
  bookstackPassword: process.env.BOOKSTACK_DB_PASSWORD ?? "fhdlxpzm1*",
  bookstackDbName: process.env.BOOKSTACK_DB_NAME ?? "bookstack",
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL ?? "",
};
