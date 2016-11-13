
/*
 *  AirBnBNodeMap - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

AirBnBNodeMap = function(_parentElement, _mapData, _airbnbData) {

    this.parentElement = _parentElement;
    this.mapData = _mapData;
    this.airbnbData = _airbnbData;

    this.initVis();
}


/*
 *  Initialize station map
 */

AirBnBNodeMap.prototype.initVis = function() {
    var vis = this;

    vis.width = 1000;
    vis.height = 600;

    console.log(this.airbnbData);

    vis.svg = d3.select("#airbnb-map").append("svg")
        .attr("width", vis.width)
        .attr("height", vis.height);

    vis.wrangleData();


}


/*
 *  Data wrangling
 */

AirBnBNodeMap.prototype.wrangleData = function() {
    var vis = this;

    // Currently no data wrangling/filtering needed
    // vis.displayData = vis.data;

    // Update the visualization
    vis.updateVis();

}


/*
 *  The drawing function
 */

AirBnBNodeMap.prototype.updateVis = function() {

    var vis = this;

    // create a first guess for the projection
    var center = d3.geo.centroid(vis.mapData)
    var scale  = 150;
    var offset = [vis.width/2, vis.height/2];
    var projection = d3.geo.mercator().scale(scale).center(center)
        .translate(offset);

    // create the path
    var path = d3.geo.path().projection(projection);

    // using the path determine the bounds of the current map and use
    // these to determine better values for the scale and translation
    var bounds  = path.bounds(vis.mapData);
    var hscale  = scale*vis.width  / (bounds[1][0] - bounds[0][0]);
    var vscale  = scale*vis.height / (bounds[1][1] - bounds[0][1]);
    var scale   = (hscale < vscale) ? hscale : vscale;
    var offset  = [vis.width - (bounds[0][0] + bounds[1][0])/2,
        vis.height - (bounds[0][1] + bounds[1][1])/2];

    // new projection
    projection = d3.geo.mercator().center(center)
        .scale(scale).translate(offset);
    path = path.projection(projection);

    // add a rectangle to see the bound of the svg
    vis.svg.append("rect").attr('width', vis.width).attr('height', vis.height)
        .style('stroke', 'black').style('fill', 'none');

    vis.svg.selectAll("path").data(vis.mapData.features).enter().append("path")
        .attr("d", path)
        .style("fill", "red")
        .style("stroke-width", "1")
        .style("stroke", "black");

    // DRAW THE NODES (SVG CIRCLE)
    var node = vis.svg.selectAll(".node")
        .data(vis.airbnbData)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 2)
        .attr("fill", 'blue')
        .attr("transform", function(d) {
            return "translate(" + projection([d.longitude, d.latitude]) + ")";
        });

    node
        .append("title")
        .text(function(d) { return d.room_type; });

}
