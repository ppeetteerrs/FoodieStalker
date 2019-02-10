import * as bi from 'big-integer';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as _ from 'lodash';
import { point } from 'rethinkdb';
import { LocationData } from '../interfaces/locationData';
import { PostData } from '../interfaces/postData';
import { UserData } from '../interfaces/userData';

const base64Mapping = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'.split('');

const { BASE_URL } = process.env;

function extractPageData(responseString) {
  if (!responseString) {
    return null;
  }
  const $ = cheerio.load(responseString);
  // Filter Irrelevant Stuff
  const dataString = $('script')
    .toArray()
    .reduce((result, element) => {
      const htmlString = $(element).html();
      if (htmlString.includes('window._sharedData')) {
        const relevantString = htmlString.match(/window\._sharedData *= *(\{.*\});/);
        if (relevantString !== null) {
          return relevantString[1];
        } else {
          return result;
        }
      } else {
        return result;
      }
    }, '');

  const parsedData = JSON.parse(dataString).entry_data;

  return parsedData;
}

export function extractUserData(responseString): UserData {
  const pageData = extractPageData(responseString);
  const extractedData = pageData.ProfilePage[0].graphql.user;

  const filteredData = {
    id: extractedData.id,
    biography: extractedData.biography,
    followersCount: extractedData.edge_followed_by.count,
    followingCount: extractedData.edge_follow.count,
    fullName: extractedData.full_name,
    email: extractedData.business_email,
    profilePic: {
      original: extractedData.profile_pic_url,
      hd: extractedData.profile_pic_url_hd,
    },
    username: extractedData.username,
    postCount: extractedData.edge_owner_to_timeline_media.count,
    latestPost: extractedData.edge_owner_to_timeline_media.edges[0].node,
  };
  return filteredData;
}

export function extractPostData(responseString, userData: UserData): PostData {
  const pageData = extractPageData(responseString);
  const extractedData = pageData.PostPage[0].graphql.shortcode_media;
  return {
    id: extractedData.id,
    owner: userData.username,
    owner_id: userData.id,
    shortcode: extractedData.shortcode,
    likes: extractedData.edge_media_preview_like.count,
    images: extractedData.edge_sidecar_to_children
      ? extractedData.edge_sidecar_to_children.edges.map(item => {
          return item.node.display_url;
        })
      : [extractedData.display_url],
    mainImage: extractedData.display_url,
    caption: extractedData.edge_media_to_caption.edges[0].node.text,
    locationID: extractedData.location && extractedData.location.id ? extractedData.location.id : null,
  };
}

export function extractLocationData(responseString): LocationData {
  const pageData = extractPageData(responseString);
  const extractedData = pageData.LocationsPage[0].graphql.location;
  if (extractedData.lat && extractedData.lng) {
    return {
      id: extractedData.id,
      lat: extractedData.lat,
      lng: extractedData.lng,
      coords: point(extractedData.lng, extractedData.lat),
      name: extractedData.name,
      slug: extractedData.slug,
      profilePicURL: extractedData.profile_pic_url,
      address: extractedData.address_json ? JSON.parse(extractedData.address_json) : null,
      website: extractedData.website,
      posts: [],
    };
  }
  return null;
}

export function writeToFile(name, data) {
  fs.writeFileSync(`temp/${name}.json`, JSON.stringify(data, null, 4));
}

export function userNameToURL(userName) {
  return `${BASE_URL}${userName}`;
}

export function idToShortCode(idNumber) {
  const bigNumber = bi(idNumber);

  const binaryDigitsCount = bigNumber.toString(2).split('').length;
  const numberOfShifts = Math.ceil(binaryDigitsCount / 6);

  const base64Numbers = [];

  for (let i = 0; i < numberOfShifts; i++) {
    const shiftedNumber = bigNumber.shiftRight(i * 6);
    base64Numbers[numberOfShifts - i - 1] = base64Mapping[shiftedNumber.and(63).valueOf()];
  }
  return base64Numbers.join('');
}

export function imageIDToURL(imageID) {
  return `${BASE_URL}p/${idToShortCode(imageID)}`;
}

export function imageShortCodeToURL(shortcode) {
  return `${BASE_URL}p/${shortcode}`;
}

export function locationIDToURL(locationID) {
  return `${BASE_URL}explore/locations/${locationID}`;
}
