import * as bb from 'bluebird';
import * as rp from 'request-promise';
import { LocationData } from '../interfaces/locationData';
import { PostData } from '../interfaces/postData';
import { UserData } from '../interfaces/userData';
import { extractLocationData, extractPostData, extractUserData, imageShortCodeToURL, locationIDToURL, userNameToURL } from '../tools/extractors';
import { prettyPrint } from '../tools/util';
import { logger } from './logger';

export class HttpClient {
  public static async getUserData(username: string): Promise<UserData> {
    // Attempt to get post data
    const userData = await HttpClient.httpGet<UserData>(userNameToURL(username));
    return extractUserData(userData);
  }
  public static async getPostData(imageShortCode: string, userData: UserData): Promise<PostData> {
    // Attempt to get post data
    const postData = await HttpClient.httpGet<PostData>(imageShortCodeToURL(imageShortCode));
    return extractPostData(postData, userData);
  }

  public static async getLocationData(locationID: string): Promise<LocationData> {
    const locationData = await HttpClient.httpGet<LocationData>(locationIDToURL(locationID));
    return extractLocationData(locationData);
  }

  private static async httpGet<T>(uri: string, retries: number = 80): Promise<T> {
    const { SCAPER_TOKEN, PROXY } = process.env;
    if (PROXY && SCAPER_TOKEN) {
      uri = `http://api.scraperapi.com?key=${SCAPER_TOKEN}&url=`.concat(uri);
      retries = 1;
    }
    // Attempt to get http response
    let retriesCount = 0;
    while (retriesCount < retries) {
      try {
        const response = await rp.get({ uri, timeout: 20000 });
        return response;
      } catch (e) {
        if (retriesCount === 0) {
          logger.log('Http Client', 'Currently stuck =(');
        }
        retriesCount += 1;
        await bb.delay(2000);
      }
    }
    logger.error('Http Client', `Failed ${retriesCount} times...`);
  }
}
