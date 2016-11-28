
/*
 *  AirBnBNodeMap - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

AirBnBNodeMap = function(_parentElement, _boroughMap, _neighborhoodMap, _airbnbData) {

    this.parentElement = _parentElement;
    this.boroughMap = _boroughMap;
    this.neighborhoodMap = _neighborhoodMap;
    this.airbnbData = _airbnbData;
    this.val = "None";

    this.initVis();
}


/*
 *  Initialize station map
 */

AirBnBNodeMap.prototype.initVis = function() {
    var vis = this;

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

    // create a projection
    var scale  = 60000;
    var offset = [vis.width/2, vis.height/2];

    // create new path
    vis.path = d3.geo.path().projection(vis.projection);

    // new projection
    vis.projection = d3.geo.mercator().center([-74.0059, 40.7128])
        .scale(scale).translate(offset);
    vis.path = vis.path.projection(vis.projection);


    // group for neighborhoods
    vis.neigh = vis.svg.append("g")
        .attr("class", "neighborhood");

    // group for boroughs
    vis.bor = vis.svg.append("g")
        .attr("class", "borough");

    // group for nodes
    vis.node = vis.svg.append("g")
        .attr("class", "node");


    vis.neigh.selectAll("path").data(vis.neighborhoodMap.features).enter().append("path")
        .attr("d", vis.path)
        .style("fill", "#3498db")
        .style("stroke-width", "1")
        .style("stroke", "black");

    // draw boroughs
    vis.bor.selectAll("path").data(vis.boroughMap.features).enter().append("path")
        .attr("d", vis.path)
        .style("fill", "gray")
        .style("opacity", 0.2)
        .on("click", function(d) {
                vis.clicked(d);
            }
        );


    vis.tip.html(function(d) {
        var string = "<strong>Room type: </strong>" + d.room_type;
        return string;
    });

    vis.updateVis();


}

// function to determine what category the user selected
AirBnBNodeMap.prototype.dataManipulation = function() {
    var vis = this;
    var box = document.getElementById("type");

    vis.val = box.options[box.selectedIndex].value;

    vis.updateVis();
};


/*
 *  The drawing function
 */

AirBnBNodeMap.prototype.updateVis = function() {

    var vis = this;

    vis.svg.selectAll(".node").remove();

    // group for nodes
    vis.node = vis.svg.append("g")
        .attr("class", "node");

    // DRAW THE NODES (SVG CIRCLE)
    vis.node.selectAll("circle").data(vis.airbnbData).enter().append("circle")
        .attr("r", 2)
        .attr("fill", function(d) {
            if (vis.val == "None") {
                return '#9b59b6';
            }
            else if (vis.val == "Legality") {
                // listing is legal
                if (d.illegal == 0) {
                    return 'white';
                }
                // listing is illegal
                else {
                    return 'black';
                }
            }
            else {
                var color = colorbrewer.Reds[9];
                var colorScale = d3.scale.quantize()
                    .domain([0, 500])
                    .range(color);
                return colorScale(d.price);
            }
        })
        .attr("opacity", 0.5)
        .attr("transform", function(d) {
            return "translate(" + vis.projection([d.longitude, d.latitude]) + ")";
        })
        // make node larger and darker on mouseover
        .on("mouseover", function(d) {
            d3.select(this)
                .attr("r", 5)
                .attr("opacity", 1)
                .style("stroke", "black");
            vis.tip.show(d);
        })
        .on("mouseout", function(d) {
            d3.select(this)
                .attr("r", 2)
                .attr("opacity", 0.5)
                .style("stroke", "none");
            vis.tip.hide(d);
        });

}


/*
 *  The zooming function
 */

AirBnBNodeMap.prototype.clicked = function(d) {
    var vis = this;

    var x, y, k;

    if (d && vis.centered !== d) {
        var centroid = vis.path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 2;
        vis.centered = d;
    } else {
        x = vis.width / 2;
        y = vis.height / 2;
        k = 1;
        vis.centered = null;
    }

    // zoom into neighborhoods
    vis.neigh.transition()
        .duration(750)
        .attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");

    // zoom into borough
    vis.bor.transition()
        .duration(750)
        .attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");


    // REDRAW NODES
    vis.node.transition()
        .duration(750)
        .attr("transform", function(d) {
            return "translate(" + vis.width / 2 + "," + vis.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")";
        });

    // REDRAW TIPS ****

}