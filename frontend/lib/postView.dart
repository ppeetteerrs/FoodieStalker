import 'package:flutter/material.dart';
import "./components/loading/fullPageLoadingOverlay.dart";
import "./tools/httpClient.dart";
import "./interfaces/location.dart";
import "./interfaces/post.dart";
import "./components/carousel/postItem.dart";

class PostViewPage extends StatefulWidget {
  PostViewPage({Key key, this.location}) : super(key: key);

  final Location location;

  @override
  _PostViewState createState() => _PostViewState(location: location);
}

class _PostViewState extends State<PostViewPage> {
  Location location;
  Future<List<InstaPost>> _postsToBeLoaded;

  _PostViewState({this.location}) {
    _postsToBeLoaded = HTTP.getPosts(id: location.id);
  }

  AppBar _appBar(BuildContext context) {
    return AppBar(
      title: Text(location.name),
    );
  }

  Widget _bodyBuilder(BuildContext context) {
    return FullPageLoadingOverlay<List<InstaPost>>(
      builder: (BuildContext context, List<InstaPost> posts) {
        return new PostItemPage(posts: posts);
      },
      loadingMessage: "Loading posts...",
      future: _postsToBeLoaded,
      currentWidget: null,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _appBar(context),
      body: _bodyBuilder(context),
    );
  }
}
