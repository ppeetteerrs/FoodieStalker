import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoder/geocoder.dart';
import 'package:access_settings_menu/access_settings_menu.dart' show AccessSettingsMenu;
import "./components/loading/fullPageLoadingOverlay.dart";
import "./tools/httpClient.dart";
import 'package:font_awesome_flutter/font_awesome_flutter.dart' show FontAwesomeIcons;
import 'package:flutter_search_bar/flutter_search_bar.dart';
import "./interfaces/coordinates.dart";
import "./interfaces/location.dart";
import "./postView.dart";

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FoodieStalker',
      theme: ThemeData(
        primarySwatch: Colors.amber,
      ),
      home: MyHomePage(title: 'Foodie Stalker'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  MyHomePage({Key key, this.title}) : super(key: key);

  final String title;

  @override
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  String _currentPosition;
  Geolocator _geolocator = Geolocator();
  SearchBar _searchBar;
  Future<List<Location>> _locationsToBeLoaded;
  Widget _bodyCache;

  @override
  void initState() {
    super.initState();
    _searchBar = new SearchBar(
      inBar: true,
      setState: setState,
      onSubmitted: _search,
      buildDefaultAppBar: _appBar,
    );
  }

  Widget _defaultBody([String promptText = "Please enter an address"]) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[Text(promptText)],
      ),
    );
  }

  Future<LatLngCoords> _getPosition() async {
    setState(() {
      _currentPosition = null;
    });
    GeolocationStatus status = await _geolocator.checkGeolocationPermissionStatus();
    if (status == GeolocationStatus.disabled) {
      _promptHighAccuracy();
      return null;
    }
    Position position = await Future.any<Position>([_geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high), Future.delayed(Duration(seconds: 7), null)]);
    if (position == null) {
      _promptHighAccuracy();
      return null;
    } else {
      return LatLngCoords(lat: position.latitude, lng: position.longitude);
    }
  }

  Future<LatLngCoords> _getLatLng({String address = "401 Pandan Gardens"}) async {
    List<Address> addresses = await Geocoder.local.findAddressesFromQuery(address);
    Address firstAddress = addresses.first;
    return LatLngCoords(lat: firstAddress.coordinates.latitude, lng: firstAddress.coordinates.longitude);
  }

  void _search([String address]) {
    setState(() {
      _locationsToBeLoaded = _searchLocations(address);
    });
  }

  Future<List<Location>> _searchLocations([String address]) async {
    LatLngCoords coords;
    if (address != null && address.isNotEmpty) {
      setState(() {
        _currentPosition = address;
      });
      coords = await _getLatLng(address: address);
    } else {
      coords = await _getPosition();
      List<Address> currentAddresses = await Geocoder.local.findAddressesFromCoordinates(Coordinates(coords.lat, coords.lng));
      setState(() {
        _currentPosition = currentAddresses[0].addressLine;
      });
    }
    if (coords != null) {
      List<Location> locations = await HTTP.getLocations(coords: coords);
      print(locations.length);
      return locations;
    } else {
      return null;
    }
  }

  Future<void> _promptHighAccuracy() async {
    return showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text("Please enable GPS and turn on 'High Accuracy' setting."),
          content: Text("Please set 'Locating Method' to 'High Accuracy'"),
          actions: <Widget>[
            FlatButton(
              child: Text('Go to settings'),
              onPressed: () {
                AccessSettingsMenu.openSettings(settingsType: "ACTION_LOCATION_SOURCE_SETTINGS").then((bool opened) {
                  Navigator.of(context).pop();
                });
              },
            ),
          ],
        );
      },
    );
  }

  AppBar _appBar(BuildContext context) {
    return AppBar(
      title: Text(_currentPosition != null ? "Near $_currentPosition..." : widget.title),
      actions: <Widget>[_searchBar.getSearchAction(context)],
    );
  }

  Widget _bodyBuilder(BuildContext context) {
    if (_locationsToBeLoaded == null) {
      _bodyCache = _defaultBody();
      return _bodyCache;
    } else {
      _bodyCache = FullPageLoadingOverlay<List<Location>>(
        builder: _locationsListBuilder,
        loadingMessage: "Loading nearby restaurants...",
        future: _locationsToBeLoaded,
        currentWidget: _defaultBody("Please ensure the address is correct =)"),
      );
      return _bodyCache;
    }
  }

  Widget _locationsListBuilder(BuildContext context, List<Location> locations) {
    if (locations != null && locations.length > 0) {
      List<Widget> locationTexts = locations.map<Widget>((location) {
        return _locationCardBuilder(context, location);
      }).toList();

      return ListView(
        children: locationTexts,
      );
    } else {
      return _defaultBody("No restaurants found within 10km =(");
    }
  }

  Widget _locationCardBuilder(BuildContext context, Location location, {double imageSize: 100}) {
    return FlatButton(
      onPressed: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (BuildContext context) {
            return PostViewPage(
              location: location,
            );
          }),
        );
      },
      padding: EdgeInsets.symmetric(horizontal: 5.0, vertical: 0.0),
      child: Card(
        margin: EdgeInsets.all(5.0),
        elevation: 10.0,
        child: Container(
          decoration: BoxDecoration(borderRadius: BorderRadius.all(Radius.circular(10.0))),
          height: imageSize,
          width: MediaQuery.of(context).size.width,
          alignment: Alignment.topCenter,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              location.profilePicURL == null
                  ? Image.asset(
                      "asset/images/noimage.jpg",
                      width: imageSize,
                      height: imageSize,
                    )
                  : Image.network(
                      location.profilePicURL,
                      width: imageSize,
                      height: imageSize,
                    ),
              Expanded(
                child: Container(
                  padding: EdgeInsets.symmetric(horizontal: 20.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        height: 10.0,
                      ),
                      Row(
                        children: <Widget>[
                          Expanded(
                            child: Text(
                              location.name,
                              style: TextStyle(
                                fontSize: 14.0,
                                color: Colors.black,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          )
                        ],
                      ),
                      SizedBox(
                        height: 5.0,
                      ),
                      Row(
                        children: <Widget>[
                          Expanded(
                            child: Text(
                              (location.address == null || location.address.streetAddress == "" || location.address.streetAddress == null) ? "(no address)" : location.address.streetAddress,
                              style: TextStyle(
                                fontSize: 12.0,
                                color: Colors.black,
                                fontWeight: FontWeight.w400,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          )
                        ],
                      ),
                      Expanded(
                        child: SizedBox(),
                      ),
                      Row(
                        children: <Widget>[
                          Expanded(
                            child: Text(
                              "(${location.dist.round()}m away)",
                              style: TextStyle(
                                fontSize: 12.0,
                                color: Colors.black,
                                fontWeight: FontWeight.w400,
                                fontStyle: FontStyle.italic,
                              ),
                              textAlign: TextAlign.end,
                            ),
                          )
                        ],
                      ),
                      SizedBox(
                        height: 10.0,
                      ),
                    ],
                  ),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _searchBar.build(context),
      body: _bodyBuilder(context),
      floatingActionButton: FloatingActionButton(
        onPressed: _search,
        tooltip: 'Get restaurants near current location',
        child: Icon(FontAwesomeIcons.mapMarkerAlt),
      ), // This trailing comma makes auto-formatting nicer for build methods.
    );
  }
}
