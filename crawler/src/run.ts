// Load Environmental Variables
require('dotenv').config();
// Load CLI Arguments
import { SETTINGS, Settings } from './tools/cliSettings';

import * as bb from 'bluebird';
import { Master } from './crawlers/masterCrawler';
import { UserCrawler } from './crawlers/userCrawler';
import { DBConnector } from './db/dbConnector';
async function run() {
  // Prevent crawling no one
  if (SETTINGS.length === 0) {
    console.log('Please enter one or more valid username:limit argument');
    return;
  }

  // Setup Database
  await DBConnector.setup();

  // Start the crawl
  await Master.start();

  // Closes DB Connection
  await DBConnector.close();

  console.log('Crawl ended');
}

run();
