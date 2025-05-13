import { env } from "cloudflare:workers";
import {
  type ActiveSession,
  type Browser,
  type BrowserWorker,
  connect,
  launch,
  sessions,
} from "@cloudflare/puppeteer";

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
    await page.setViewport(
      viewport ?? {
        width: 1304,
        height: 910,
      }
    );
  }
  await page.goto(url, { waitUntil: "networkidle0" });

  // Generic attempt to hide cookie banners or accept cookies
  await page.evaluate(() => {
    // Define types for browser context
    type MyHTMLElement = Element & { click: () => void; textContent: string };
    const expectedText =
      /^(Akzeptieren|Accept|Accept all cookies|Accept all|Allow|Allow all|Allow all cookies|Ok)$/gi;
    function isElementWithText(el: Element): el is MyHTMLElement {
      return (
        typeof (el as MyHTMLElement).click === "function" &&
        typeof (el as MyHTMLElement).textContent === "string" &&
        !!(el as MyHTMLElement).textContent.trim().match(expectedText)
      );
    }
    const clickAccept = (selector: string): boolean => {
      // @ts-ignore
      const elements = document.querySelectorAll(selector);
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (isElementWithText(element)) {
          element.click();
          return true;
        }
      }
      return false;
    };
    if (
      clickAccept(
        "a[id*=cookie i], a[class*=cookie i], button[id*=cookie i], button[class*=cookie i]"
      )
    ) {
      return;
    }
    clickAccept("a, button");
  });
  // Wait for possible animation/transition after hiding banner
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const screenshot = await page.screenshot({
    type: "png",
  });
  await page.close();
  browser.disconnect(); // Do not close, so session can be reused
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
