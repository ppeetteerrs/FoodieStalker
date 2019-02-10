import { Point } from 'rethinkdb';
export interface LocationData {
  lat: number;
  lng: number;
  coords: Point;
  id: string;
  name: string;
  slug: string;
  address: {
    streetAddress: string;
    zipCode: string;
    cityName: string;
    regionName: string;
    countryCode: string;
  };
  profilePicURL: string;
  website: string;
  posts: string[];
}
