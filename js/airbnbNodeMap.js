
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


// function to get color scale based on user-selected category
AirBnBNodeMap.prototype.getColorScheme = function() {
    var vis = this;

    if (vis.val == "None") {
        var color = ['#9b59b6'];
    }
    else if (vis.val == "illegal") {
        var color = ['white', 'black'];
    }
    else {
        var color = colorbrewer.Reds[9];
    }
    return color;

}

// function to get variable extent based on user-selected category
AirBnBNodeMap.prototype.getExtent = function() {
    var vis = this;

    if (vis.val == "None") {
        var extent = [0, 0];
    }
    else if (vis.val == "illegal") {
        var extent = [0, 1];
    }
    else {
        var extent = [0, 500];
    }

    return extent;
}


/*
 *  The drawing function
 */

AirBnBNodeMap.prototype.updateVis = function() {

    var vis = this;

    vis.colorScale = d3.scale.quantize()
        .domain(vis.getExtent())
        .range(vis.getColorScheme());

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
            else {
                return vis.colorScale(d[vis.val]);
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

    // DRAW LEGEND

    vis.svg.selectAll(".legendEntry").remove();

    // append legend
    vis.legend = vis.svg.selectAll('g.legendEntry')
        .data(vis.colorScale.range())
        .enter().append('g')
        .attr('class', 'legendEntry');

    vis.legend
        .append('rect')
        .attr("x", 1)
        .attr("y", function(d, i) {
            return i * 20 + 200;
        })
        .attr("width", 10)
        .attr("height", 10)
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("fill", function(d){return d;});

    //the data objects are the fill colors
    vis.legend
        .append('text')
        .attr("x", 20)
        .attr("y", function(d, i) {
            return i * 20 + 210;
        })
        .text(function(d,i) {
            if (vis.val == "None") {
                return "Listing";
            }
            else if (vis.val == "illegal") {
                return "Illegal";
            }
            else {
                var extent = vis.colorScale.invertExtent(d);
                //extent will be a two-element array, format it however you want:
                var format = d3.format("0.2f");
                return "$" + format(+extent[0]) + " - $" + format(+extent[1]);
            }
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