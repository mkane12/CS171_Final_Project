
/*
 *  TaxRevenue - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

TaxRevenue = function(_parentElement, _data) {

    this.parentElement = _parentElement;
    this.data = _data;
    this.unitValue = "city";
    this.yearValue = 2016;

    this.initVis();
};


/*
 *  Initialize station map
 */

TaxRevenue.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 40, right: 0, bottom: 25, left: 200};

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom;


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

    // CREATE TOOLTIP //
    vis.svg.selectAll(".d3-tip").remove();
    // Initialize tooltip

    vis.tip = d3.tip()
        .attr('class', 'd3-tip');

    // Invoke the tip in the context of your visualization
    vis.svg.call(vis.tip);

    vis.stack = d3.layout.stack()
        .values(function(d) {return d.values});

    vis.wrangleData();
};


/*
 *  Data wrangling
 */

TaxRevenue.prototype.wrangleData = function() {
    var vis = this;

    vis.filteredData = vis.data.filter(function(d) {
        return (d.unit == vis.unitValue && d.fy == vis.yearValue);
    });

    vis.filteredData.forEach(function(d) {
        d.total = +d.total;
        d.fy = +d.fy;
        d.projection = +d.projection;
        d.actual = +d.actual;
    });

    vis.filteredData.sort(function (a,b) {
        return a.total - b.total;
    });

    vis.legendData = [{name: "Actual Hotel Revenue", color: "#F16664"},
                        {name: "Projected Airbnb Revenue", color: "#79CCCD"},
                        {name: "Actual Expenditures", color: "#FFF6E6"}]

    // vis.transposedData = vis.name.map(function(name) {
    //    return {
    //        name: name,
    //        values: vis.filteredData.map(function(d) {
    //            return {dept: d.dept, y: d[name]};
    //        })
    //    }
    // });
    //
    // vis.stackedData = vis.stack(vis.transposedData);

    vis.displayData = vis.filteredData;

    // Update the visualization
    vis.updateVis();

};


/*
 *  The drawing function
 */

TaxRevenue.prototype.updateVis = function() {

    var vis = this;

    vis.barHeight = vis.height / vis.displayData.length;

    // vis.x.domain([0, d3.max(vis.displayData, function(d) {
    //     return d3.max(d.values, function (e) {
    //         return e.y0 + e.y;
    //         });
    //     })
    // ]);

    vis.x.domain([0, d3.max(vis.displayData, function (d) {
        return d.total;
    })]);

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
        .attr("y", 20 - vis.margin.top)
        .style("text-anchor", "end")
        .text("Budget Line Items")
        .attr("class", "vis-title");

    vis.tip.html(function (d) {
        return formatCurrency(d.actual.toLocaleString());
    });

    /*
     * Stacked bar chart using d3.stack layout - haven't been able to get it to work yet, but it's the best option if I can fix it.
     */

    // vis.bars = vis.svg.selectAll("rect")
    //     .data(vis.stackedData);
    //
    // vis.bars
    //     .enter()
    //     .append("rect")
    //     .attr("class", "bar");
    //
    // vis.bars
    //     .transition()
    //     .duration(800)
    //     .attr("x", function(d) { return vis.x(d.y0); })
    //     .attr("y", function(d, index) {
    //         return (index * vis.barHeight);
    //     })
    //     .attr("height", vis.barHeight - 3)
    //     .attr("width", function(d) { return vis.x(d.y); })
    //     .attr("fill", function(d) {
    //         if (d.values.dept == "Hotel Tax Revenue") {
    //             return "#F16664";
    //         }
    //         else {
    //             return "#FFF6E6";
    //         }
    //     })
    // ;
    //
    // vis.bars
    //     .on("mouseover", function(d) {
    //         d3.select(this)
    //             .attr("opacity", .5);
    //         vis.tip.show(d);
    //     })
    //     .on("mouseout", function(d) {
    //         d3.select(this)
    //             .attr("opacity", 1);
    //         vis.tip.hide(d);
    //     })
    // ;
    //
    // vis.bars.exit().remove();


    /*
     * Stacked bar chart without using d3.stack layout - Issues with tooltips
     */

    vis.stackData = vis.displayData.filter(function (d) {
        return (d.dept == "Hotel Tax Revenue");
    });

    vis.stackIndex = 0;


    for (i = 0; i < vis.displayData.length; i++) {
        if (vis.displayData[i].dept == "Hotel Tax Revenue") {
            vis.stackIndex = i;
        }
    }

    vis.bars = vis.svg.selectAll("rect")
        .data(vis.displayData);

    vis.bars
        .enter()
        .append("rect")
        .attr("class", "bar");

    vis.bars
        .transition()
        .duration(800)
        .attr("fill", function (d) {
            if (d.dept == "Hotel Tax Revenue") {
                return "#F16664";
            }
            else {
                return "#FFF6E6";
            }
        })
        .attr("x", 0)
        .attr("y", function (d, index) {
            return (index * vis.barHeight);
        })
        .attr("height", vis.barHeight - 3)
        .attr("width", function (d) {
            return vis.x(d.actual);
        })
    ;

    vis.bars
        .on("mouseover", function (d) {
            d3.select(this)
                .attr("opacity", .5);
            vis.tip.show(d);
        })
        .on("mouseout", function (d) {
            d3.select(this)
                .attr("opacity", 1);
            vis.tip.hide(d);
        })
    ;

    vis.bars.exit().remove();

    vis.stack = vis.svg.selectAll(".stack")
        .data(vis.stackData);

    vis.stack
        .enter()
        .append("rect")
        .attr("class", "stack");

    vis.stack
        .transition()
        .duration(800)
        .attr("fill", "#79CCCD")
        .attr("x", function (d) {
            return vis.x(d.actual);
        })
        .attr("y", function () {
            return (vis.stackIndex * vis.barHeight);
        })
        .attr("height", vis.barHeight - 3)
        .attr("width", function (d) {
            return vis.x(d.projection);
        })
    ;

    vis.stack
        .on("mouseover", function (d) {
            d3.select(this)
                .attr("opacity", .5);
            vis.tip.show(d);
        })
        .on("mouseout", function (d) {
            d3.select(this)
                .attr("opacity", 1);
            vis.tip.hide(d);
        })
    ;

    vis.stack.exit().remove();

    vis.labels = vis.svg.selectAll(".text")
        .data(vis.displayData);

    vis.labels
        .enter()
        .append("text")
        .attr("class", "text");

    vis.labels
        .attr("x", -10)
        .attr("y", function (d, index) {
            return (index * vis.barHeight + (vis.barHeight + 3) / 2);
        })
        .style("text-anchor", "end")
        .text(function (d) {
            return d.dept;
        });

    vis.labels.exit().remove();


    // DRAW LEGEND

    vis.svg.selectAll(".legendEntry").remove();

    // append legend

    vis.legend = vis.svg.selectAll('g.legendEntry')
        .data(vis.legendData)
        .enter().append('g')
        .attr('class', 'legendEntry');

    vis.legend
        .append('rect')
        .attr("x", vis.width - 200)
        .attr("y", function (d, i) {
            return i * 20 + 50;
        })
        .attr("width", 10)
        .attr("height", 10)
        .style("stroke", "none")
        .style("stroke-width", 1)
        .style("fill", function (d) { return d.color; });

    vis.legend
        .append('text')
        .attr("x", vis.width - 180)
        .attr("y", function (d, i) {
            return i * 20 + 60;
        })
        .text(function (d) { return d.name;});
}

function kFormatter(num) {
    return '$' + (num/1000000) + 'M';
}

function formatCurrency(d) {
    return "$" + d;
}

TaxRevenue.prototype.changeData = function() {
    var vis = this;

    vis.unitValue = d3.select("#budgetUnit").property("value");
    vis.yearValue = d3.select("#budgetYear").property("value");

    vis.wrangleData();
}