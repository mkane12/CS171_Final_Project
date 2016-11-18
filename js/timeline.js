
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

var formatDate = d3.time.format("%Y-%m-%d");

/*
 *  Initialize
 */

Timeline.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 0, right: 0, bottom: 0, left: 0};
    vis.height = 300 - vis.margin.top - vis.margin.bottom;
    vis.width = 1100 - vis.margin.right - vis.margin.left;

    vis.svg = d3.select("#timeline").append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")")
    ;

    vis.x = d3.scale.linear()
        .range([0, vis.width])
    ;

    // CREATE TOOLTIP //
    vis.svg.selectAll(".d3-tip").remove();
    // Initialize tooltip

    vis.tip = d3.tip()
        .attr('class', 'd3-tip');

    // Invoke the tip in the context of your visualization
    vis.svg.call(vis.tip);

    vis.wrangleData();
};


/*
 *  Data wrangling
 */

Timeline.prototype.wrangleData = function() {
    var vis = this;

    vis.data.forEach(function(d) {
        d.position = +d.position;
        d.date = formatDate.parse(d.date);
    });

    vis.displayData = vis.data;

    console.log(vis.displayData);
    // Update the visualization
    vis.updateVis();

};


/*
 *  The drawing function
 */

Timeline.prototype.updateVis = function() {

    var vis = this;

    vis.barHeight = vis.height/vis.displayData.length;

    vis.x.domain([0, d3.max(vis.displayData, function(d) {return d.amount;})]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom")
        .tickFormat(kFormatter)
        .ticks(5);

    vis.svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.select(".x-axis")
        .transition()
        .duration(800)
        .call(vis.xAxis);

    vis.svg.append("text")
        .transition()
        .duration(800)
        .attr("x", -10)
        .attr("y", 30 - vis.margin.top)
        .style("text-anchor", "end")
        .text("Budget Line Items")
        .attr("class", "vis-title");

    vis.tip.html(function(d) {
        return formatCurrency(d.amount.toLocaleString());
    });

    vis.bars = vis.svg.selectAll(".bar")
        .data(vis.displayData);

    vis.bars
        .enter()
        .append("rect")
        .attr("class", "bar");

    vis.bars
        .transition()
        .duration(800)
        .attr("fill", function(d) {
            if (d.dept == "Airbnb Tax Revenue - Airbnb Projection" || d.dept == "Actual Hotel Tax Revenue" || d.dept == "Airbnb Tax Revenue - Our Projection") {
                return "#F16664";
            }
            else {
                return "#FFF6E6";
            }
        })
        .attr("x", 0)
        .attr("y", function(d, index) {
            return (index * vis.barHeight);
        })
        .attr("height", vis.barHeight - 3)
        .attr("width", function(d) { return vis.x(d.amount); })
    ;

    vis.bars
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

    vis.bars.exit().remove();

    vis.labels = vis.svg.selectAll(".text")
        .data(vis.displayData);

    vis.labels
        .enter()
        .append("text")
        .attr("class", "text");

    vis.labels
        .attr("x", -10)
        .attr("y", function(d, index) {
            return (index * vis.barHeight + (vis.barHeight + 3)/2);
        })
        .style("text-anchor", "end")
        .text(function(d) { return d.dept; });

    vis.labels.exit().remove();
};