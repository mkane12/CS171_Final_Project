
/*
 *  AirBnBMap - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

AirBnBMap = function(_parentElement, _data, _mapPosition) {

    this.parentElement = _parentElement;
    this.data = _data;

    this.mapPosition = _mapPosition;


    this.initVis();
}


/*
 *  Initialize station map
 */

AirBnBMap.prototype.initVis = function() {
    var vis = this;

    vis.map = L.map(this.parentElement).setView(this.mapPosition, 13);
    L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.{ext}',
        {attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
        '<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; ' +
        '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            subdomains: 'abcd',
            minZoom: 0,
            maxZoom: 20,
            ext: 'png'})
        .addTo(vis.map);

    vis.wrangleData();
}


/*
 *  Data wrangling
 */

AirBnBMap.prototype.wrangleData = function() {
    var vis = this;

    // Currently no data wrangling/filtering needed
    // vis.displayData = vis.data;

    // Update the visualization
    vis.updateVis();

}


/*
 *  The drawing function
 */

AirBnBMap.prototype.updateVis = function() {

    var vis = this;

    console.log(this.data);

    // If the images are in the directory "/img":
    L.Icon.Default.imagePath = 'img/';

    // Add empty layer groups for the markers / map objects
    var airbnbs = new L.MarkerClusterGroup().addTo(vis.map);

    $.each(vis.data, function(i, bnb) {

        // create popup content
        var popupContent = "<strong> Room ID: " + bnb.room_id + "</strong><br/>";
        popupContent += "Room Type: " + bnb.room_type + "<br/>";
        popupContent += "Accommodates: " + bnb.accommodates + "<br/>";
        popupContent += "Price: $" + bnb.price;

        // create marker
        var marker = new L.marker([bnb.latitude, bnb.longitude])
            .bindPopup(popupContent)
            .addTo(vis.map);

        // Add marker to layer group
        airbnbs.addLayer(marker);
    });

}
