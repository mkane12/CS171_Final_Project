
/*
 *  TaxRevenue - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

TaxRevenue = function(_parentElement, _data) {

    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
};


/*
 *  Initialize station map
 */

TaxRevenue.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 40, right: 0, bottom: 25, left: 25};
    vis.height = 500 - vis.margin.top - vis.margin.bottom;
    vis.width = 1000 - vis.margin.right - vis.margin.left;

    vis.svg = d3.select("#tax-revenue").append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right + 100)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")")
    ;

    vis.x = d3.scale.linear()
        .range([0, vis.width])
    ;

    vis.y = d3.scale.ordinal()
        .rangeRoundBands([vis.height, 0], .2)
    ;

    vis.wrangleData();
}


/*
 *  Data wrangling
 */

TaxRevenue.prototype.wrangleData = function() {
    var vis = this;

    vis.data.forEach(function(d) {
        d.amount = +d.amount;
    });

    vis.data.sort(function (a,b) {
        return a.amount - b.amount;
    });

    vis.displayData = vis.data;

    console.log(vis.displayData);
    // Update the visualization
    vis.updateVis();

}


/*
 *  The drawing function
 */

TaxRevenue.prototype.updateVis = function() {

    var vis = this;

    vis.barHeight = vis.height/vis.displayData.length;

    vis.x
        .domain([0, d3.max(vis.displayData, function(d) {return d.amount;})]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom")
        .tickFormat(kFormatter)
        .ticks(5)
    ;

    vis.svg.append("text")
        .attr("x", 0)
        .attr("y", 20 - vis.margin.top)
        .text("FY16 New York City Budget Line Items")
        .attr("class", "vis-title")
    ;

    vis.svg.append("g")
        .attr("class", "axis x-axis")
        .call(vis.xAxis)
        .attr("transform", "translate(0," + vis.height + ")")
    ;

    vis.svg.selectAll(".bar")
        .data(vis.displayData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("fill", function(d) {
            if (d.dept == "Airbnb Projected Tax Revenue" || d.dept == "Actual Hotel Tax Revenue") {
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

    vis.svg.selectAll(".text")
        .data(vis.displayData)
        .enter()
        .append("text")
        .attr("class", "text")
        .attr("x", 5)
        .attr("y", function(d, index) {
            return (index * vis.barHeight + (vis.barHeight + 3)/2);
        })
        .text(function(d) { return d.dept; });
}

function kFormatter(num) {
    return '$' + (num/1000000) + 'M';
}

function changeData() {
    selectValue = d3.select("#budgetData").property("value");

    updateVisualization();
}