
/*
 *  HousingPrices - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

HousingPrices = function(_parentElement, _data) {

    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
};

var formatDate = d3.time.format("%Y-%m");

/*
 *  Initialize line graph
 */

HousingPrices.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 40, right: 0, bottom: 25, left: 40};
    vis.height = 500 - vis.margin.top - vis.margin.bottom;
    vis.width = 1000 - vis.margin.right - vis.margin.left;

    vis.svg = d3.select("#housing-prices").append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right + 100)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")")
    ;

    vis.x = d3.time.scale()
        .range([0, vis.width])
    ;

    vis.y = d3.scale.linear()
        .range([vis.height, 0])
    ;

    vis.wrangleData();
}


/*
 *  Data wrangling
 */

HousingPrices.prototype.wrangleData = function() {
    var vis = this;


    vis.data.forEach(function(d) {
        for (var key in d) {
           if (d.hasOwnProperty(key) && key !== "Year") {
               d[key] = +d[key];
           }
           if (d.hasOwnProperty(key) && key == "Year") {
                d[key] = formatDate.parse(d[key])
           }
        }
    });

    //vis.neighborhoods = vis.data.columns.slice(1).map(function(id) {
    //    return {
    //        id: id,
    //        values: data.map(function(d) {
    //            return {date: d.Year, price: d[id]};
    //        })
    //    };
    //});

    vis.displayData = vis.data;

    startYear = vis.data[0].Year;
    endYear = vis.data[56].Year;

    console.log(vis.displayData);

    // Update the visualization
    vis.updateVis();

    //d3.select("#chartData").on("change", filterData);

    }


/*
 *  The drawing function
 */

HousingPrices.prototype.updateVis = function() {

    var vis = this;

    vis.x.domain([startYear, endYear]);

    vis.y.domain([0, d3.max(vis.displayData, function(d) {return d.Neighborhood1; })]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom")
        .tickFormat(formatDate)
    ;

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left")
        .tickFormat(formatCurrency);

    vis.svg.append("text")
        .attr("x", 0)
        .attr("y", 20 - vis.margin.top)
        .text("Rental Prices Over Time")
        .attr("class", "vis-title")
    ;

    vis.xAxisGroup = vis.svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + vis.height + ")")
    ;

    vis.yAxisGroup = vis.svg.append("g")
            .attr("class", "axis y-axis")
        .append("text")
            .attr("y", -15)
            .attr("x", -40)
            .attr("dy", "0.71em")
            .attr("fill", "#000")
            .text("Average Monthly Rent");

    vis.svg.select(".x-axis")
        .transition()
        .duration(800)
        .call(vis.xAxis)
    ;

    vis.svg.select(".y-axis")
        .transition()
        .duration(800)
        .call(vis.yAxis)
    ;

    vis.lineFunction = d3.svg.line()
        .x(function(d) { return vis.x(d.Year); })
        .y(function(d) { return vis.y(d.Neighborhood1); })
        .interpolate("linear");

    vis.lineGraph = vis.svg.selectAll(".line")
        .data(vis.displayData);

    vis.lineGraph.enter()
        .append("path")
        .attr("class", "line");

    vis.lineGraph
        .transition()
        .duration(800)
        .attr("d", vis.lineFunction(vis.displayData));

    vis.lineGraph.exit().remove();

};


function formatCurrency(d) {
    return "$" + d;
}