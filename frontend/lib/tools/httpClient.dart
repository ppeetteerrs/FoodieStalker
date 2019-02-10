import 'package:http/http.dart' as http;
import "dart:convert" show json;
import "../interfaces/location.dart";
import "../interfaces/post.dart";
import "../interfaces/coordinates.dart";

const String _SERVER_URL = "http://128.199.234.238:8990";


class HTTP {
  static Future<List<Location>> getLocations({String url = _SERVER_URL, LatLngCoords coords}) async {
    try {
      http.Response response = await http.get("$url/getLocs?lat=${coords.lat}&lng=${coords.lng}");
      if (response.statusCode == 200) {
        List<dynamic> jsonResponse = json.decode(response.body);
        List<Location> locations = jsonResponse.map<Location>((jsonItem) {
          return Location.fromJSON(jsonItem);
        }).where((item) {
          return item != null;
        }).toList();
        print("locations");
        return locations;
      } else {
        print("Locations Fetch Failed");
        return null;
      }
    } catch (e) {
      print(e);
    }
  }

  static Future<List<InstaPost>> getPosts({String url = _SERVER_URL, String id}) async {
    http.Response response = await http.get("$url/getPosts?id=$id");
    if (response.statusCode == 200) {
      List<dynamic> jsonResponse = json.decode(response.body);
      List<InstaPost> posts = jsonResponse.map<InstaPost>((jsonItem) {
        return InstaPost.fromJSON(jsonItem);
      }).toList();
      return posts;
    } else {
      print("Posts Fetch Failed");
      return null;
    }
  }
}
