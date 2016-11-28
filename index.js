
/**
 * Module dependencies.
 */

var parallel = require('async').parallel;
var thunkify = require('thunkify');
var maps = require('@google/maps');
var _ = require('lodash');
var vo = require('vo');

// Initialize the Google Maps directions client.
var client = maps.createClient({
  key: 'AIzaSyCKXnIirOC0UGIr8ziNshogQEykj0Abk3k'
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
  '6821 Exeter Drive, Oakland',
  '506 Mississippi, San Francisco',
  '1735 Steiner Street, San Francisco',
  '1363 Guerrero Street, San Francisco',
  '555 Clayton St., San Francisco',
  '2101 Sacramento St, San Francisco',
  '1468 25th St Unit 206, San Francisco',
  '473 51st Street, Oakland, ca',
  '1825 Turk Street, San Francisco',
  '155 Fillmore Street, San Francisco',
  '2890 California Street, San Francisco',
  '1163 pine st., San Francisco',
  '2355 Polk St, San Francisco',
  '421 24th Street, Oakland'
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
        var duration = yield getDuration(from, to);
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
 * @cb — callback(err, duration_in_minutes)
 */

function shortestDuration(from, to, cb) {
  parallel([
    function(callback) {
      client.directions({
        origin: from,
        destination: to,
        mode: 'walking',
        departure_time: new Date(2016, 12, 7, 8)
      }, callback)
    },
    function(callback) {
      client.directions({
        origin: from,
        destination: to,
        mode: 'bicycling',
        departure_time: new Date(2016, 12, 7, 8)
      }, callback)
    },
    function(callback) {
      client.directions({
        origin: from,
        destination: to,
        mode: 'transit',
        departure_time: new Date(2016, 12, 7, 8)
      }, callback)
    }
  ],
  function(err, res) {
    if (err) return cb(err);
    var durations = _.map(res, function(route) {
      return calculateDuration(route.json.routes[0].legs)
    });
    cb(null, _.min(durations));
  });
}

/**
 * Calculate duration.
 */

function calculateDuration(legs) {
  var d = 0;
  legs.forEach(function (leg) {
    d += leg.duration.value;
  });
  d = Math.round(d/60);
  return d;
}
