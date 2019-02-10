import * as bb from 'bluebird';
import * as fs from 'fs';
import * as moment from 'moment';
import { Browser } from 'puppeteer';
import { DBConnector } from '../db/dbConnector';
import { UserData } from '../interfaces/userData';
import { BrowserInstance } from '../tools/browser';
import { SETTINGS } from '../tools/cliSettings';
import { HttpClient } from '../tools/httpClient';
import { logger } from '../tools/logger';
import { BrowserPage } from './pageCrawler';
import { UserCrawler } from './userCrawler';

class MasterCrawler {
  private userSettings = SETTINGS;
  private workersCount = process.env.WORKERS ? parseInt(process.env.WORKERS, 10) : 1;
  private browser: Browser;

  // Sets up the crawl
  public async setup() {
    logger.log('MasterCrawler', `${this.workersCount} workers`);
    try {
      this.browser = await BrowserInstance.getBrowser();
    } catch (error) {
      logger.error('MasterCrawler', 'Setup failed', error, true);
    }
  }

  public async crawl() {
    try {
      const userTabs = await bb.all(
        bb.map(this.userSettings, userSettings => {
          return new UserCrawler(userSettings, this.browser).startTab();
        }),
      );
      logger.log('MasterCrawler', `All Tabs Started`);
      const results = await bb.all(
        bb.map(
          userTabs,
          userTab => {
            return userTab.crawl();
          },
          { concurrency: this.workersCount },
        ),
      );
    } catch (error) {
      logger.error('MasterCrawler', 'Leaked error', error, false);
    }
  }

  public async start() {
    await this.setup();
    await this.crawl();
    await this.browser.close();
  }
}

export const Master = new MasterCrawler();
