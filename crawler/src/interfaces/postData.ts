import { LocationData } from './locationData';

export interface PostData {
  id: string;
  owner_id: string;
  owner: string;
  shortcode: string;
  likes: number;
  location?: LocationData;
  images: string[];
  caption: string;
  mainImage: string;
  locationID: string;
}
