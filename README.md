# How does office location affect your team's commute time?

This script computes median commute times from your existing team's home addresses to various office locations in San Francisco. You may also modify the script for your city.

![](https://cloudup.com/ic33c_w_N-v+)

[Live map here.](https://reinpk.carto.com/viz/ae61f720-b157-11e6-919c-0ecd1babdde5/public_map)

* For a set of team addresses
* Loops over a grid of San Francisco lat/lon coordinates
* Computes the median commute time for the whole team
* Outputs an array of lat/lon/median_commute for input into Carto.com
