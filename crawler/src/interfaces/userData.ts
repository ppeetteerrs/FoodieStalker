export interface UserData {
  biography: string;
  followersCount: string;
  followingCount: string;
  fullName: string;
  id: string;
  email: string;
  profilePic: {
    original: string;
    hd: string;
  };
  username: string;
  postCount: string;
  latestPost: {
    shortcode: string;
  };
  posts?: string[];
}
