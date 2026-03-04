// instrumentation.ts — runs once when Next.js server boots
// Overrides ISP DNS with Google/Cloudflare so MongoDB Atlas SRV records resolve correctly
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("dns");
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  }
}
