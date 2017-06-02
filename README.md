# How does office location affect your team's commute time?

This script computes median commute times from your existing team's home addresses to various office locations in San Francisco. You may also modify the script for your city.

![](https://cloudup.com/ic33c_w_N-v+)

[Live map here.](https://reinpk.carto.com/viz/ae61f720-b157-11e6-919c-0ecd1babdde5/public_map)

* For a set of team addresses
* Loops over a grid of San Francisco lat/lon coordinates
* Computes the median commute time for the whole team
* Outputs an array of lat/lon/median_commute for input into Carto.com

## Usage

* Install dependencies: `npm install`
* Update script: You'll need to fill in your Google Maps API key, and team home addresses
* Run script: `node index.js`
* Copy and paste console output into a CSV
* Visualize data in Carto
 * Sign up or login
 * From https://[username].carto.com/dashboard/maps, select "New Map"
 * Upload `results.csv` under "Connect Dataset"
 * You should see a map of your area of interest with same-color dots
 * Use "Wizard" > "Choropleth" in the right hand column to select a color ramp, and set "Column" to "value"

## License

Released under the [MIT license](https://github.com/segmentio/commute-heatmap/blob/master/License.md).
