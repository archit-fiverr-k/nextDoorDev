/**
 * Dynamically resolves the base application URL for live hosting (Vercel, custom domain, or local dev).
 * Priority:
 * 1. Explicit NEXT_PUBLIC_APP_URL (e.g., https://nextdoorclinic.co.uk)
 * 2. VERCEL_URL auto-injected by Vercel deployment (e.g., https://my-app.vercel.app)
 * 3. Fallback http://localhost:3000
 */
export function getAppBaseUrl(): string {
  if (
    process.env.NEXT_PUBLIC_APP_URL &&
    process.env.NEXT_PUBLIC_APP_URL !== "http://localhost:3000"
  ) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    const vercelHost = process.env.VERCEL_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${vercelHost}`;
  }

  return "https://next-door-dev.vercel.app";
}
