import 'package:flutter/material.dart';
import "package:flutter/widgets.dart";

class FullPageLoadingScreen extends StatelessWidget {
  final String loadingMessage;

  FullPageLoadingScreen({
    this.loadingMessage,
  });

  Container loadingOverlay(BuildContext context) {
    return new Container(
      decoration: new BoxDecoration(
        color: Colors.black87,
      ),
      child: new Center(
        child: new Container(
          color: Colors.transparent,
          width: 250.0,
          height: (loadingMessage == null || loadingMessage == "") ? 250.0 : 290.0,
          child: new Card(
            color: Colors.black54,
            shape: new RoundedRectangleBorder(
              borderRadius: new BorderRadius.all(
                new Radius.circular(10.0),
              ),
            ),
            margin: new EdgeInsets.all(0.0),
            child: new Column(children: loadingCard(context)),
          ),
        ),
      ),
    );
  }

  List<Widget> loadingCard(BuildContext context) {
    List<Widget> loadingCard = [loadingProgress(context)];
    if (loadingMessage != null && loadingMessage != "") {
      loadingCard.add(loadingloadingMessage(context));
    }
    return loadingCard;
  }

  Container loadingProgress(BuildContext context) {
    return new Container(
      width: 250.0,
      height: 240.0,
      color: Colors.transparent,
      padding: new EdgeInsets.fromLTRB(50.0, 50.0, 50.0, (loadingMessage == null || loadingMessage == "") ? 40.0 : 50.0),
      child: new ConstrainedBox(
        constraints: new BoxConstraints.expand(),
        child: new CircularProgressIndicator(
          strokeWidth: 5.0,
        ),
      ),
    );
  }

  Row loadingloadingMessage(BuildContext context) {
    return new Row(
      children: <Widget>[
        new Text(
          loadingMessage,
          style: new TextStyle(
            color: Colors.white70,
            fontWeight: FontWeight.bold,
            fontSize: 16.0,
          ),
          maxLines: 10,
        ),
      ],
      mainAxisAlignment: MainAxisAlignment.center,
    );
  }

  @override
  Widget build(BuildContext context) {
    return loadingOverlay(context);
  }
}
