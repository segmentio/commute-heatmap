
/**
 * Module dependencies.
 */

var parallel = require('async').parallel;
var thunkify = require('thunkify');
var maps = require('@google/maps');
var _ = require('lodash');
var vo = require('vo');

// - - - - Start user-defined settings - - - - -

// Initialize the Google Maps directions client.
var client = maps.createClient({
  key: '...Google Maps API Key here...'
});

// Set up our grid of heatmap testing locations.
var westmost = -122.513494;
var eastmost = -122.387552;
var lonGridSize = (eastmost - westmost)/20;

var southmost = 37.700847;
var northmost = 37.808312;
var latGridSize = (northmost - southmost)/20;

// Must be in the future
var testDateTime = new Date(2020, 12, 7, 8)

// Address data
// Example format: '100 California St, San Francisco, CA'
var addresses = [
  '...your team home addresses here...',
];

// - - - - End user-defined settings - - - - -


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

  // Set headers in CSV so that carto.com imports correctly
  console.log('Lat, Lon, Value');

  for (var lon = westmost; lon <= eastmost; lon += lonGridSize) {
    for (var lat = southmost; lat <= northmost; lat += latGridSize) {
      var durations = [];
      var to = [lat.toPrecision(8), lon.toPrecision(9)].join(', ');

      for (var i = 0; i < locations.length; i++) {
        var location = locations[i];
        var from = [location.lat, location.lng].join(', ');
        var duration = yield getDuration(from, to);
        durations.push(duration);
      }

      console.log(to, ',', median(durations));
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
        departure_time: testDateTime
      }, callback)
    },
    function(callback) {
      client.directions({
        origin: from,
        destination: to,
        mode: 'bicycling',
        departure_time: testDateTime
      }, callback)
    },
    function(callback) {
      client.directions({
        origin: from,
        destination: to,
        mode: 'transit',
        departure_time: testDateTime
      }, callback)
    }
  ],
  function(err, res) {
    if (err) return cb(err);
    // filter out unavailable options
    var options = _.filter(res, function(route) {
      return route.json.routes.length
    });
    var durations = _.map(options, function(route) {
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
