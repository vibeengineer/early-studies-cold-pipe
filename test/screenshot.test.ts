import { expect, test } from "vitest";
import { captureWebsiteScreenshot } from "../src/services/screenshot";

test(
  "expect 10 screenshots to be captured simultaneously",
  async () => {
    const urls = Array(10).fill("https://www.duckstud.io");
    const screenshotPromises = urls.map((url) => captureWebsiteScreenshot(url));
    const screenshots = await Promise.all(screenshotPromises);
    screenshots.forEach((screenshot, idx) => {
      console.log(`Screenshot #${idx + 1}:`, screenshot);
      expect(screenshot).toBeDefined();
    });
  },
  { timeout: 1000 * 60 }
);
