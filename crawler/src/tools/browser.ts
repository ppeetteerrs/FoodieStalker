import * as puppet from 'puppeteer';

class PuppetBrowser {
  private browser: puppet.Browser = null;
  private launchOptions: puppet.LaunchOptions = {
    headless: process.env.HEADLESS && process.env.HEADLESS !== 'false',
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  };

  public async getBrowser() {
    if (this.browser == null) {
      this.browser = await puppet.launch(this.launchOptions);
    }
    return this.browser;
  }
}

export const BrowserInstance = new PuppetBrowser();
