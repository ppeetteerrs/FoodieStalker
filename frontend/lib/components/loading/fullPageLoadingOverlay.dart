import 'package:flutter/material.dart';
import "package:flutter/widgets.dart";
import 'package:meta/meta.dart';
import "./fullPageLoadingScreen.dart";

typedef Widget LoadedBuilder<T>(BuildContext context, T data);

class FullPageLoadingOverlay<T> extends StatelessWidget {
  final LoadedBuilder<T> builder;
  final String loadingMessage;
  final Future<T> future;
  final Widget currentWidget;

  FullPageLoadingOverlay({@required this.builder, @required this.future, @required this.loadingMessage, this.currentWidget});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: future,
      builder: (BuildContext context, AsyncSnapshot snapshot) {
        if (snapshot.connectionState == ConnectionState.done) {
          if (snapshot.error == null) {
            return builder(context, snapshot.data);
          } else {
            if (currentWidget == null) {
              Navigator.pop(context);
            } else {
              return currentWidget;
            }
          }
        } else {
          if (currentWidget != null) {
            return new Stack(
              children: <Widget>[currentWidget, new FullPageLoadingScreen(loadingMessage: loadingMessage)],
            );
          } else {
            return new FullPageLoadingScreen(
              loadingMessage: loadingMessage,
            );
          }
        }
      },
    );
  }
}
