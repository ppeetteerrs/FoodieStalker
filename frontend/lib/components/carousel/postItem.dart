import 'package:flutter/material.dart';
import "./../../interfaces/location.dart";
import "./../../interfaces/post.dart";
import './carousel.dart';

class PostItemPage extends StatefulWidget {
  PostItemPage({Key key, this.posts}) : super(key: key);

  final List<InstaPost> posts;

  @override
  _PostItemState createState() => _PostItemState(posts: posts);
}

class _PostItemState extends State<PostItemPage> {
  Location location;
  List<InstaPost> posts;
  InstaPost _currentPost;
  int _currentPage;

  _PostItemState({this.posts})
      : this._currentPost = posts[0],
        this._currentPage = 0;

  Widget _postInfo(BuildContext context) {
    return Card(
      child: Container(
        width: MediaQuery.of(context).size.width,
        padding: EdgeInsets.all(10.0),
        child: Column(
          children: <Widget>[
            Text(
              _currentPost.owner,
              style: TextStyle(
                fontSize: 22.0,
                fontWeight: FontWeight.w700,
              ),
            ),
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    _currentPost.caption.replaceAll(new RegExp(r"(\n[\.\n]+\n)+"), "\n\n"),
                    style: TextStyle(
                      fontSize: 18.0,
                    ),
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }

  Map<String, List> _extractImages(List<InstaPost> posts) {
    List<String> imageURLs = [];
    List<int> imageToPostIndex = [];
    for (int postIndex = 0; postIndex < posts.length; postIndex++) {
      InstaPost post = posts[postIndex];
      for (int imageURLIndex = 0; imageURLIndex < post.images.length; imageURLIndex++) {
        String imageURL = post.images[imageURLIndex];
        imageURLs.add(imageURL);
        imageToPostIndex.add(postIndex);
      }
    }
    return {
      "urls": imageURLs,
      "mapping": imageToPostIndex,
    };
  }

  Widget _postImageBuilder(BuildContext context, String url) {
    return Container(
      width: MediaQuery.of(context).size.width,
      child: Image.network(url),
    );
  }

  Widget _sliderBuild(BuildContext context) {
    Map<String, List> extraction = _extractImages(posts);
    List<String> imageURLs = extraction["urls"];
    List<int> mapping = extraction["mapping"];
    Widget slider = CarouselSlider(
        items: imageURLs.map((url) {
          return _postImageBuilder(context, url);
        }).toList(),
        updateCallback: (int pageNum) {
          setState(() {
            _currentPost = posts[mapping[pageNum]];
            _currentPage = pageNum;
          });
        },
        aspectRatio: 1,
        height: MediaQuery.of(context).size.width,
        viewportFraction: 1.0,
        autoPlay: false);
    Widget overlay = Container(
      margin: new EdgeInsets.all(10.0),
      padding: new EdgeInsets.symmetric(horizontal: 10.0, vertical: 5.0),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(50.0),
        color: Colors.black54,
      ),
      child: Text(
        "${_currentPage + 1}/${posts.length}",
        style: TextStyle(
          color: Colors.white,
          fontSize: 15.0,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
    return posts.length < 2
        ? slider
        : Stack(
            alignment: AlignmentDirectional.bottomEnd,
            children: <Widget>[slider, overlay],
          );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: MediaQuery.of(context).size.width,
      child: ListView(
        padding: EdgeInsets.all(0.0),
        children: <Widget>[_sliderBuild(context), _postInfo(context)],
      ),
    );
  }
}
