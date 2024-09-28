import { type PlatformProxy } from "wrangler";

declare global {
  type Env = {
    CLIENT_SECRET: string;
    CLIENT_ID: string;
    AUTH_SECRET: string;
    DB: D1Database;
  };
  type CloudflareContext = Omit<PlatformProxy<Env>, "dispose">;
}

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: CloudflareContext;
  }
}
