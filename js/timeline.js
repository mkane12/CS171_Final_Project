
/*
 *  Timeline - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

Timeline = function(_parentElement, _data) {

    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
};

var formatDate = d3.time.format("%b %d, %Y");

/*
 *  Initialize
 */

Timeline.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 0, right: 10, bottom: 0, left: 10};
    vis.height = 320 - vis.margin.top - vis.margin.bottom;
    vis.width = 1100 - vis.margin.right - vis.margin.left;

    vis.svg = d3.select("#timeline").append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")")
    ;

    vis.x = d3.time.scale()
        .range([0, vis.width])
    ;

    // CREATE TOOLTIP //
    vis.svg.selectAll(".d3-tip").remove();

    // Initialize tooltip
    vis.tip = d3.tip()
        //.attr('class', 'd3-tip')
        .attr("class", "timelineTip");

    // Invoke the tip in the context of your visualization
    vis.svg.call(vis.tip);

    vis.wrangleData();
};


/*
 *  Data wrangling
 */

Timeline.prototype.wrangleData = function() {
    var vis = this;

    console.log(vis.data);

    vis.data.forEach(function(d) {
        d.position = +d.position;
        d.date = new Date(d.date)
    });

    vis.displayData = vis.data;

    console.log(vis.displayData);

    vis.updateVis();

};


/*
 *  The drawing function
 */

var startDate = new Date("01/01/13");
var endDate = new Date("03/21/17");

Timeline.prototype.updateVis = function() {

    var vis = this;

    vis.x.domain([startDate, endDate]);

    vis.svg.append("rect")
        .attr("class", "timelineBackground")
        .attr("x", -10)
        .attr("y", 0)
        .attr("height", vis.height)
        .attr("width", vis.width + vis.margin.right + vis.margin.left);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom")
        .ticks(0);

    vis.svg.append("g")
        .attr("class", "axis x-axis eventAxis")
        .attr("transform", "translate(0," + vis.height/2 + ")");

    vis.svg.select(".x-axis")
        .call(vis.xAxis);

    vis.tip.html(function(d) {
        return (d.caption)
    });

    vis.eventLine = vis.svg.selectAll(".eventLine")
        .data(vis.displayData);

    vis.eventLine
        .enter()
        .append("line")
        .attr("class", "eventLine");

    vis.eventLine
        .attr("x1", function(d) { return vis.x(d.date); })
        .attr("x2", function(d) { return vis.x(d.date); })
        .attr("y1", vis.height/2)
        .attr("y2", function(d) {
            if (d.position == 0) {
                return vis.height/2 - 50;
            }
            else {
                return vis.height/2 + 50;
            }
        })
    ;

    vis.eventImg = vis.svg.selectAll(".eventImg")
        .data(vis.displayData);

    vis.eventImg
        .enter()
        .append("image")
        .attr("class", "eventImg");

    vis.eventImg
        .attr("xlink:href", function(d) { return d.img; })
        .attr("x", function(d) { return (vis.x(d.date) - 50); })
        .attr("y", function(d) {
            if (d.position == 0) {
                return vis.height / 2 - 150;
            }
            else {
                return vis.height / 2 + 50;
            }
        })
        .attr("height", 100)
        .attr("width", 100);

    vis.eventImg
        .on("mouseover", function(d) {
            d3.select(this)
                .attr("opacity", .5);
            vis.tip.show(d);
        })
        .on("mouseout", function(d) {
            d3.select(this)
                .attr("opacity", 1);
            vis.tip.hide(d);
        })
    ;

    vis.eventCircle = vis.svg.selectAll(".eventCircle")
        .data(vis.displayData);

    vis.eventCircle
        .enter()
        .append("circle")
        .attr("class", "eventCircle");

    vis.eventCircle
        .attr("cx", function(d) { return vis.x(d.date); })
        .attr("cy", function(d) {
            if (d.position == 0) {
                return vis.height / 2 - 100;
            }
            else {
                return vis.height / 2 + 100;
            }
        })
        .attr("r", 50);

    vis.eventLabels = vis.svg.selectAll(".eventText")
        .data(vis.displayData);

    vis.eventLabels
        .enter()
        .append("text")
        .attr("class", "eventText");

    vis.eventLabels
        .attr("x", function(d) { return vis.x(d.date); })
        .attr("y", function(d) {
            if (d.position == 0) {
                return vis.height / 2 + 20;
            }
            else {
                return vis.height / 2 - 10;
            }
        })
        .style("text-anchor", "middle")
        .text(function(d) { return formatDate(d.date); });
};