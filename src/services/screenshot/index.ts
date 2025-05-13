import { env } from "cloudflare:workers";
import {
  type ActiveSession,
  type Browser,
  type BrowserWorker,
  connect,
  launch,
  sessions,
} from "@cloudflare/playwright";

export type QueueWebsiteScreenshotParams = {
  url: string;
  templateImageKey: string; // R2 key for the template image
  outputKey: string; // R2 key for the final image
};

export type WebsiteScreenshotJob = QueueWebsiteScreenshotParams & {
  jobId: string;
  status: "queued" | "processing" | "done" | "error";
  error?: string;
};

/**
 * Attempts to reuse a Playwright browser session for performance. If no free session is available, launches a new one.
 * Navigates to the given URL, takes a screenshot, and disconnects (not closes) the browser for reuse.
 * @param url The URL to screenshot
 * @param viewport Optional viewport { width, height }
 * @param env Cloudflare Worker env with MYBROWSER binding
 * @returns Uint8Array screenshot buffer
 */
export async function captureWebsiteScreenshot(
  url: string,
  viewport?: { width: number; height: number }
): Promise<Uint8Array> {
  if (!env || !env.BROWSER) {
    throw new Error("Missing env.BROWSER binding");
  }
  const browserWorker = env.BROWSER;
  let browser: Browser | null = null;
  let launched = false;
  let sessionId: string | undefined = await getRandomFreeSession(browserWorker);

  if (sessionId) {
    try {
      browser = await connect(browserWorker, sessionId);
    } catch (e) {
      // Another worker may have connected first
      browser = null;
    }
  }
  if (!browser) {
    browser = await launch(browserWorker, { keep_alive: 1000 * 60 * 10 }); // 10 min keep alive
    launched = true;
    sessionId = browser.sessionId();
  }

  const page = await browser.newPage();
  if (viewport) {
    await page.setViewportSize(viewport ?? { width: 1304, height: 910 });
  }
  await page.goto(url, { waitUntil: "networkidle" });
  const screenshot = await page.screenshot({
    type: "png",
    style: "::-webkit-scrollbar { display: none; }",
  });
  await page.close();
  // browser.disconnect(); // Do not close, so session can be reused
  return screenshot;
}

/**
 * Returns a random free Playwright sessionId, or undefined if none available.
 */
async function getRandomFreeSession(browserWorker: BrowserWorker): Promise<string | undefined> {
  const sessionList: ActiveSession[] = await sessions(browserWorker);
  const freeSessions = sessionList.filter((s) => !s.connectionId).map((s) => s.sessionId);
  if (freeSessions.length === 0) return undefined;
  return freeSessions[Math.floor(Math.random() * freeSessions.length)];
}

// const queueWebsiteScreenshot = async (params: QueueWebsiteScreenshotParams, env: Env) => {
//   // TODO: Send to Cloudflare Queue
// };

// const processScreenshotJob = async (job: WebsiteScreenshotJob, env: Env) => {
//   // TODO: Implement screenshot, image editing, and R2 storage logic
// };

// export default {
//   queueWebsiteScreenshot,
//   processScreenshotJob,
// };
