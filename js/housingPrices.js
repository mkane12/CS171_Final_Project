
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

var formatDate = d3.time.format("%Y-%M");

/*
 *  Initialize station map
 */

HousingPrices.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 40, right: 0, bottom: 25, left: 25};
    vis.height = 500 - vis.margin.top - vis.margin.bottom;
    vis.width = 1000 - vis.margin.right - vis.margin.left;

    vis.svg = d3.select("#housing-prices").append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right + 100)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom);
        vis.g = vis.svg.append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")")
    ;

    vis.x = d3.time.scale()
        .range([0, vis.width])
    ;

    vis.y = d3.scale.linear()
        .range([vis.height, 0])
    ;

    vis.lineFunction = d3.svg.line()
        .x(function(d) { return vis.x(d.Year); })
        .y(function(d) { return vis.y(d["4819"]); })
        .interpolate("linear")
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

    vis.x
        .domain([d3.extent(vis.displayData, function(d) {return d.year; })]);

    vis.y
        .domain([d3.extent(vis.displayData, function(d) {return d["4819"]; })]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom")
        .tickFormat(formatDate)
    ;

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left");

    vis.svg.append("text")
        .attr("x", 0)
        .attr("y", 20 - vis.margin.top)
        .text("Rental Prices Over Time")
        .attr("class", "vis-title")
    ;

    vis.g.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + vis.height + ")")
    ;

    vis.g.append("g")
            .attr("class", "axis axis--y")
        .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("fill", "#000")
            .text("Price");

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

    vis.neighborhood = vis.g.selectAll(".line")
        .data(vis.displayData);

    vis.neighborhood.enter()
        .append("path")
        .attr("class", "line");

    vis.neighborhood
        .transition()
        .duration(800)
        .attr("d", vis.lineFunction)
    ;

    vis.neighborhood.exit().remove();

}

//function filterData(a,b) {
//    startYear = formatDate.parse(a);
//    endYear = formatDate.parse(b);

//    console.log(startYear);
//    console.log(endYear);

//    filteredData = data.filter(function(value) {
//        return (value.YEAR >= startYear) && (value.YEAR <= endYear);
//    });

//    console.log(filteredData);

//    updateVisualization(filteredData);
//}