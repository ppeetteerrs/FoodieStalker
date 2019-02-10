class InstaPost {
  String caption;
  String id;
  List<String> images;
  int likes;
  String locationID;
  String mainImage;
  String owner;
  String ownerID;
  String shortcode;

  InstaPost({this.caption, this.id, this.images, this.likes, this.locationID, this.mainImage, this.owner, this.ownerID, this.shortcode});

  factory InstaPost.fromJSON(Map<String, dynamic> json) {
    return InstaPost(
        caption: json["caption"],
        id: json["id"],
        images: (json["images"] as List).cast<String>(),
        likes: json["likes"],
        locationID: json["locationID"],
        mainImage: json["mainImage"],
        owner: json["owner"],
        ownerID: json["owner_id"],
        shortcode: json["shortcode"]);
  }
}
