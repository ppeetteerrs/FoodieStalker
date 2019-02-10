class Location {
  LocationAddress address;
  String id;
  double lat;
  double lng;
  String name;
  List<String> posts;
  String profilePicURL;
  String slug;
  String website;
  double dist;

  Location({this.address, this.id, this.lat, this.lng, this.name, this.posts, this.profilePicURL, this.slug, this.website, this.dist});

  factory Location.fromJSON(Map<String, dynamic> json) {
    if (json != null) {
      double dist = json["dist"];
      json = json["doc"];
      return Location(
          dist: dist,
          address: LocationAddress.fromJSON(json["address"]),
          id: json["id"],
          lat: json["lat"],
          lng: json["lng"],
          name: json["name"],
          posts: (json["posts"] as List).cast<String>(),
          profilePicURL: json["profilePicURL"],
          slug: json["slug"],
          website: json["website"]);
    } else {
      return null;
    }
  }
}

class LocationAddress {
  String cityName;
  String countryCode;
  String streetAddress;
  String zipCode;

  LocationAddress({this.cityName, this.countryCode, this.streetAddress, this.zipCode});

  factory LocationAddress.fromJSON(Map<String, dynamic> json) {
    if (json != null) {
      return LocationAddress(cityName: json["city_name"], countryCode: json["country_code"], streetAddress: json["street_address"], zipCode: json["zip_code"]);
    } else {
      return null;
    }
  }
}
