
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

    this.displayData = this.mapData;

    vis.width = 1000;
    vis.height = 600;

    vis.svg = d3.select("#airbnb-map").append("svg")
        .attr("width", vis.width)
        .attr("height", vis.height);

    // CREATE TOOLTIP //
    vis.svg.selectAll(".d3-tip").remove();
    // Initialize tooltip

    vis.tip = d3.tip()
        .attr('class', 'd3-tip');

    // Invoke the tip in the context of your visualization
    vis.svg.call(vis.tip);

    // Add a slider to the page using the minimum and maximum years appearing in the data
    // var slider = document.getElementById('slider');
    //
    // sliderVal =
    // slidermin = parseInt(formatDate(d3.min(vis.airbnbData, function(d) {return d.YEAR})));
    // slidermax = parseInt(formatDate(d3.max(data, function(d) {return d.YEAR})));
    //
    // noUiSlider.create(slider, {
    //     start: sliderVal,
    //     connect: true,
    //     step: 1,
    //     range: {
    //         'min': slidermin,
    //         'max': slidermax
    //     }
    //
    // });
    //
    // // Dynamically update what the user has selected for the slider value
    // var directionField1 = document.getElementById('field1');
    // var directionField2 = document.getElementById('field2');

    vis.active = d3.select(null);

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
    var center = d3.geo.centroid(vis.displayData)
    var scale  = 150;
    var offset = [vis.width/2, vis.height/2];
    var projection = d3.geo.mercator().scale(scale).center(center)
        .translate(offset);

    // create the path
    vis.path = d3.geo.path().projection(projection);

    // using the path determine the bounds of the current map and use
    // these to determine better values for the scale and translation
    vis.bounds  = vis.path.bounds(vis.mapData);
    var hscale  = scale*vis.width  / (vis.bounds[1][0] - vis.bounds[0][0]);
    var vscale  = scale*vis.height / (vis.bounds[1][1] - vis.bounds[0][1]);
    var scale   = (hscale < vscale) ? hscale : vscale;
    var offset  = [vis.width - (vis.bounds[0][0] + vis.bounds[1][0])/2,
        vis.height - (vis.bounds[0][1] + vis.bounds[1][1])/2];

    // new projection
    projection = d3.geo.mercator().center(center)
        .scale(scale).translate(offset);
    vis.path = vis.path.projection(projection);

    console.log(vis.mapData);

    vis.svg.selectAll("path").data(vis.mapData.features).enter().append("path")
        .attr("d", vis.path)
        .style("fill", "#3498db")
        .style("opacity", 0.5)
        .style("stroke-width", "1")
        .style("stroke", "black")
        .on("click", function(d) {
            console.log(this);
            //d3.select(this).style("fill", "orange");
            vis.zoom(d);
            }
        );

    // vis.active.attr("fill", "#cccccc");
    // vis.active = d3.select(this)
    //     .attr("fill", "#F77B15");


    vis.tip.html(function(d) {
        var string = "<strong>Room type: </strong>" + d.room_type;
        return string;
    });

    // DRAW THE NODES (SVG CIRCLE)
    var node = vis.svg.selectAll(".node")
        .data(vis.airbnbData)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 2)
        .attr("fill", '#e74c3c')
        .attr("opacity", 0.5)
        .attr("transform", function(d) {
            return "translate(" + projection([d.longitude, d.latitude]) + ")";
        })
        // make node larger and darker on mouseover
        .on("mouseover", function(d) {
            d3.select(this)
                .attr("r", 5)
                .style("fill", "red")
                .attr("opacity", 1)
                .style("stroke", "black");
            vis.tip.show(d);
        })

        .on("mouseout", function(d) {
            d3.select(this)
                .attr("r", 2)
                .style("fill", '#e74c3c')
                .attr("opacity", 0.5)
                .style("stroke", "none");
            vis.tip.hide(d);
        });

}


/*
 *  The zooming function
 */

AirBnBNodeMap.prototype.zoom = function(selected) {
    var vis = this;

    console.log(selected);

    vis.selectedArea = selected.geometry.coordinates;
    console.log(vis.selectedArea);

    // var bounds = vis.path.bounds(),
    //     dx = bounds[1][0] - bounds[0][0],
    //     dy = bounds[1][1] - bounds[0][1],
    //     x = (bounds[0][0] + bounds[1][0]) / 2,
    //     y = (bounds[0][1] + bounds[1][1]) / 2,
    //     scale = .9 / Math.max(dx / vis.width, dy / vis.height),
    //     translate = [
    //         vis.width / 2 - scale * x,
    //         vis.height / 2 - scale * y];
    //
    // vis.svg.transition()
    //     .duration(750)
    //     .attr("transform", "translate(" +
    //         translate + ")scale(" +
    //         scale + ")");
}