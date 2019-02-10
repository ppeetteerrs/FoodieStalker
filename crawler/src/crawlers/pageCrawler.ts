import * as puppet from 'puppeteer';
import { PostData } from '../interfaces/postData';
import { idToShortCode, userNameToURL } from '../tools/extractors';

export class BrowserPage {
  public username: string;
  public browser: puppet.Browser;
  public profileTab: puppet.Page;
  public explorationPage: puppet.Page;
  public results: PostData[] = [];
  private postCount: number;

  constructor(username: string, browser: puppet.Browser) {
    this.username = username;
    this.browser = browser;
  }

  public async start(firstShortCode) {
    // Launch / load Browser and go to first tab
    this.profileTab = await this.browser.newPage();
    this.profileTab.setDefaultNavigationTimeout(500000);

    // Load user profile page and returns shortcode of first post
    await this.profileTab.goto(userNameToURL(this.username), { waitUntil: ['domcontentloaded', 'networkidle2'] });
    return await this.clickOnFirstPost(firstShortCode);
    // await this.evaluatePosts();
    // await this.close();
  }

  public async clickOnFirstPost(firstShortCode) {
    const firstPost = await this.profileTab.$(`a[href*="${firstShortCode}"]`);
    await Promise.all([firstPost.click(), this.profileTab.waitForNavigation({ waitUntil: ['domcontentloaded', 'networkidle2'] })]);
  }

  public async getNextShortCode(): Promise<string> {
    // Get right arrow element
    const rightArrow = await this.profileTab.$('.coreSpriteRightPaginationArrow');

    // Parse HTML to get ID of next image from URL
    const nextImageID: string = await this.profileTab.evaluate(() => {
      try {
        const myRightArrow: any = document.querySelector('.coreSpriteRightPaginationArrow');
        const returnValue = myRightArrow.href.split('/')[4];
        return returnValue;
      } catch (e) {
        return null;
      }
    });

    // Wait for next post to load
    if (nextImageID !== null) {
      const nextImageShortCode = idToShortCode(nextImageID);
      await Promise.all([rightArrow.click(), this.profileTab.waitForNavigation({ waitUntil: ['domcontentloaded', 'networkidle2'] })]);
      return nextImageShortCode;
    } else {
      return null;
    }
  }

  public async close() {
    await this.profileTab.close();
  }
}
