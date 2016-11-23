var maps = require('@google/maps');
var thunkify = require('thunkify');
var vo = require('vo');

// Initialize the Google Maps directions client.
var client = maps.createClient({
  key: '...Google Maps API Key here...'
});

// Set up our grid of heatmap testing locations.
var westmost = -122.513494;
var eastmost = -122.387552;
var lonGridSize = (westmost - eastmost)/20;

var southmost = 37.700847;
var northmost = 37.808312;
var latGridSize = (northmost - southmost)/20;

// Address data
var addresses = [
  '...your team addresses here...'
];
var locations = [];

// Make our Google Maps API functions yield-able.
var getDuration = thunkify(shortestDuration);
var getLocation = thunkify(geocodeAddress);

// Iterate over our location grid and compute the median transit durations.
vo(function *() {
  for (var a = 0; a < addresses.length; a++) {
    var address = addresses[a];
    var location = yield getLocation(address);
    locations.push(location);
  }

  for (var lon = -122.488306; lon >= westmost; lon += lonGridSize) {
    for (var lat = 37.733086; lat <= 37.786819; lat += latGridSize) {
      var durations = [];
      var to = [lat.toPrecision(8), lon.toPrecision(9)].join(', ');

      for (var i = 0; i < locations.length; i++) {
        var location = locations[i];
        var from = [location.lat, location.lng].join(', ');
        var duration = yield getDuration(from, to, 'transit');
        durations.push(duration);
      }

      console.log(to, median(durations));
    }
  }
})()


/**
 * Calculate the median of an array.
 */

 function median(values) {
    values.sort(function (a,b) {return a - b;});
    var half = Math.floor(values.length/2);
    if (values.length % 2) {
      return values[half];
    }
    else {
      return (values[half-1] + values[half]) / 2.0;
    }
 }


/**
 * Hit Google Maps API for geocoding the addresses.
 *
 * @address — address string
 */

function geocodeAddress(address, cb) {
  client.geocode({
    address: address
  }, function (err, response) {
    if (err) return cb(err);
    var latlng = response.json.results[0].geometry.location;
    cb(null, latlng);
  });
}


/**
 * Hit google maps API for the shortest from/to transit duration.
 *
 * @from — lat/lon string
 * @to — lat/lon string
 * @transit - driving, bicycling, transit
 * @cb — callback(err, duration_in_minutes)
 */

function shortestDuration(from, to, transit, cb) {
  client.directions({
    origin: from,
    destination: to,
    mode: transit,
    departure_time: new Date(2016, 12, 7, 8)
  }, function (err, response) {
    if (err) return cb(err);
    var legs = response.json.routes[0].legs;
    var duration = 0;
    legs.forEach(function (leg) {
      duration += leg.duration.value;
    });
    duration = Math.round(duration/60);
    cb(null, duration);
  });
}
