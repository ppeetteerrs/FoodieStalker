library carousel_slider;

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';

class CarouselSlider extends StatefulWidget {
  final List<Widget> items;
  final num viewportFraction;
  final num initialPage;
  final double aspectRatio;
  final double height;
  final PageController pageController;
  final bool autoPlay;
  final Duration autoPlayDuration;
  final Curve autoPlayCurve;
  final Duration interval;
  final bool reverse;
  final Function updateCallback;
  final bool distortion;

  CarouselSlider({
    @required this.items,
    this.viewportFraction: 0.8,
    this.initialPage: 0,
    this.aspectRatio: 16 / 9,
    this.height,
    this.autoPlay: false,
    this.interval: const Duration(seconds: 4),
    this.reverse: false,
    this.autoPlayCurve: Curves.fastOutSlowIn,
    this.autoPlayDuration: const Duration(milliseconds: 800),
    this.updateCallback,
    this.distortion: true,
  }) : pageController = new PageController(
          viewportFraction: viewportFraction,
          initialPage: initialPage,
          keepPage: true,
        );

  @override
  _CarouselSliderState createState() {
    return new _CarouselSliderState();
  }

  Future<Null> nextPage({Duration duration, Curve curve}) {
    return pageController.nextPage(duration: duration, curve: curve);
  }

  Future<Null> previousPage({Duration duration, Curve curve}) {
    return pageController.previousPage(duration: duration, curve: curve);
  }

  jumpToPage(int page) {
    return pageController.jumpToPage(page);
  }

  animateToPage(int page, {Duration duration, Curve curve}) {
    return pageController.animateToPage(page, duration: duration, curve: curve);
  }
}

class _CarouselSliderState extends State<CarouselSlider> with TickerProviderStateMixin {
  int currentPage;
  Timer timer;

  @override
  void initState() {
    super.initState();
    currentPage = widget.initialPage;
    if (widget.autoPlay) {
      timer = new Timer.periodic(widget.interval, (_) {
        widget.pageController.nextPage(duration: widget.autoPlayDuration, curve: widget.autoPlayCurve);
      });
    }
  }

  getWrapper(Widget child) {
    if (widget.height != null) {
      return Container(height: widget.height, child: child);
    } else {
      return AspectRatio(aspectRatio: widget.aspectRatio, child: child);
    }
  }

  @override
  void dispose() {
    super.dispose();
    timer?.cancel();
  }

  @override
  Widget build(BuildContext context) {
    return getWrapper(PageView.builder(
      onPageChanged: (int index) {
        if (widget.updateCallback != null) widget.updateCallback(index);
      },
      controller: widget.pageController,
      reverse: widget.reverse,
      itemBuilder: (BuildContext context, int index) {
        return AnimatedBuilder(
            animation: widget.pageController,
            builder: (BuildContext context, child) {
              if (widget.pageController.position.minScrollExtent == null || widget.pageController.position.maxScrollExtent == null) {
                Future.delayed(Duration(microseconds: 1), () {
                  setState(() {});
                });
                return Container();
              }
              double value = widget.pageController.page - index;
              value = (1 - (value.abs() * 0.3)).clamp(0.0, 1.0);

              final double height = widget.height ?? MediaQuery.of(context).size.width * (1 / widget.aspectRatio);
              final double distortionValue = widget.distortion ? Curves.easeOut.transform(value) : 1.0;

              return Center(child: SizedBox(height: distortionValue * height, child: child));
            },
            child: widget.items[index]);
      },
      itemCount: widget.items.length,
    ));
  }
}
