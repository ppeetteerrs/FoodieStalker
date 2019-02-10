import * as bb from 'bluebird';
import * as fs from 'fs';
import * as moment from 'moment';
import { Browser } from 'puppeteer';
import { DBConnector } from '../db/dbConnector';
import { UserData } from '../interfaces/userData';
import { UserSetting } from '../tools/cliSettings';
import { HttpClient } from '../tools/httpClient';
import { logger } from '../tools/logger';
import { BrowserPage } from './pageCrawler';

interface CrawlProgress {
  postsCrawled: number;
  postsAdded: number;
  postsFailed: number;
  postsSkipped: number;
  locationsCrawled: number;
  locationsAdded: number;
  locationsFailed: number;
  locationsSkipped: number;
  postsFailedItems: string[];
  locationsFailedItems: string[];
}

export class UserCrawler {
  public settings: UserSetting;
  private userData: UserData;
  private pageCrawler: BrowserPage;
  private progress: CrawlProgress = {
    postsCrawled: 0,
    postsAdded: 0,
    postsFailed: 0,
    postsSkipped: 0,
    locationsCrawled: 0,
    locationsAdded: 0,
    locationsFailed: 0,
    locationsSkipped: 0,
    postsFailedItems: [],
    locationsFailedItems: [],
  };
  private browser: Browser;
  private currentCrawlResult: string = '';

  constructor(settings: UserSetting, browser: Browser) {
    this.settings = settings;
    this.browser = browser;
  }

  public async startTab() {
    // Retrieves user data
    this.userData = await this.getUserData();
    await this.storeUser();

    if (this.settings.limit > parseInt(this.userData.postCount, 10)) {
      this.settings.limit = parseInt(this.userData.postCount, 10);
    }

    // Setup and start browser
    this.pageCrawler = new BrowserPage(this.userData.username, this.browser);
    await this.pageCrawler.start(this.userData.latestPost.shortcode);
    logger.log(this.settings.username, 'Started Tab');
    return this;
  }

  public async crawl() {
    logger.log(this.settings.username, 'Started Crawling');
    await this.crawlPosts();
    this.reportResults();
    if (process.env.FAILURE_RETRY && process.env.FAILURE_RETRY !== 'false') {
      logger.log(this.settings.username, 'Time to retry failed ones...');
      await this.recrawlFailedLocations();
      await this.recrawlFailedPosts();
    }
    this.writeResults();
    await this.close();
  }

  public async getUserData() {
    return await HttpClient.getUserData(this.settings.username);
  }

  public async storeUser() {
    await DBConnector.insertUser(this.userData);
  }

  public async crawlPosts() {
    let currentImageShortCode = this.userData.latestPost.shortcode;
    while (this.progress.postsCrawled < (this.settings.limit ? this.settings.limit : parseInt(this.userData.postCount, 10))) {
      this.currentCrawlResult = '';
      if (!(await DBConnector.postExists(currentImageShortCode)) || (process.env.RECRAWL && process.env.RECRAWL !== 'false')) {
        // If post has not been crawled or is supposed to be crawled again
        await this.crawlPost(currentImageShortCode);
        await bb.delay(200);
      } else {
        await bb.delay(100);
        this.progress.postsSkipped++;
        this.currentCrawlResult += '(Location Skipped, Post Skipped)';
      }
      this.progress.postsCrawled++;

      // Get shortcode for next post
      try {
        currentImageShortCode = await this.pageCrawler.getNextShortCode();
        logger.log(this.settings.username, `${this.progress.postsCrawled} / ${this.settings.limit ? this.settings.limit : parseInt(this.userData.postCount, 10)} ${this.currentCrawlResult}`);
        if (!currentImageShortCode) {
          break;
        }
      } catch (e) {
        logger.error(this.settings.username, 'Crawl Error', e, false);
        break;
      }
    }
  }

  private async crawlPost(imageShortCode: string) {
    try {
      const postData = await HttpClient.getPostData(imageShortCode, this.userData);

      if (postData && postData.locationID) {
        // If post is valid and has a location, check if location already exists
        if (!(await DBConnector.locationExists(postData.locationID)) || (process.env.RECRAWL && process.env.RECRAWL !== 'false')) {
          // If location does not exists, need to crawl location
          await this.crawlLocation(postData.locationID);
        } else {
          this.progress.locationsSkipped++;
          this.currentCrawlResult += '(Location Skipped';
        }
        this.progress.locationsCrawled++;
        // Insert / Update Post Data
        await DBConnector.insertPost(postData);
        this.progress.postsAdded++;
        this.currentCrawlResult += ', Post Added)';
        return true;
      } else {
        this.progress.postsFailed++;
        this.progress.postsFailedItems.push(imageShortCode);
        this.currentCrawlResult += '(Post Failed: No Location or No Post)';
        return false;
      }
    } catch (error) {
      this.progress.postsFailed++;
      this.progress.postsFailedItems.push(imageShortCode);
      this.currentCrawlResult += '(Location Not Yet Parsed, Post Failed)';
      logger.error(this.settings.username, 'Location Parse Error');
      return false;
    }
  }

  private async crawlLocation(locationID: string) {
    try {
      const locationData = await HttpClient.getLocationData(locationID);
      await DBConnector.insertLocation(locationData);
      this.progress.locationsAdded++;
      this.currentCrawlResult += '(Location Added';
      return true;
    } catch (error) {
      this.progress.locationsFailed++;
      this.progress.locationsFailedItems.push(locationID);
      this.currentCrawlResult += '(Location Failed';
      logger.error(this.settings.username, 'Location Parse Error');
      return false;
    }
  }

  private reportResults() {
    logger.log(this.settings.username, 'Crawl Results:', this.progress);
  }

  // A bit repetitive
  private async recrawlFailedLocations() {
    for (let i = 0; i < this.progress.locationsFailedItems.length; i++) {
      if (await this.crawlLocation(this.progress.locationsFailedItems[i])) {
        delete this.progress.locationsFailedItems[i];
      }
    }
  }

  // A bit repetitive
  private async recrawlFailedPosts() {
    for (let i = 0; i < this.progress.postsFailedItems.length; i++) {
      if (await this.crawlPost(this.progress.postsFailedItems[i])) {
        delete this.progress.postsFailedItems[i];
      }
    }
  }

  private writeResults() {
    fs.writeFileSync(`temp/[${this.settings.username}] ${moment().format('YYYY-MM-DD hh:mm:ss')} Results.json`, JSON.stringify(this.progress, null, 4));
  }

  private async close() {
    await this.pageCrawler.close();
  }
}
