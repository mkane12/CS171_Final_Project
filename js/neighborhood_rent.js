/**
 * Created by nbw on 11/24/16.
 */

NeighborhoodLine = function(_parentElement, _raw_price_data, _raw_change_data, _neighborhood_dict){
    this.parentElement = _parentElement;
    this.raw_price_data = _raw_price_data;
    this.raw_change_data = _raw_change_data;
    this.displayData = [];
    this.neighborhood_dict = _neighborhood_dict


    this.initVis();
}



/*
 * Initialize visualization (static content; e.g. SVG area, axes)
 */

NeighborhoodLine.prototype.initVis = function(){
    var vis = this;

    //console.log(vis.neighborhood_dict);

    // Set up SVG
    vis.margin = {top: 40, right: 40, bottom: 60, left: 80};


    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom;


    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


    vis.parseTime = d3.time.format("%Y-%m");

    vis.x = d3.time.scale().range([0, vis.width]);
    vis.y = d3.scale.linear().range([vis.height, 0]);

    vis.color_scale = d3.scale.linear().domain([0, 1]).range(["#aaaaFF", "#FF0000"]);


    vis.line = d3.svg.line()
        .x(function(d) { return x(d.Date); })
        .y(function(d) { return y(d.price); })
        .interpolate("linear");


    vis.tip = d3.select("body").append("div")
        .attr("class", "lines-tooltip")
        .style("opacity", 0);


    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom");

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left");

    vis.svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "axis axis--y");


    yaxlabel = vis.svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -vis.height*4/5)
        .attr("y", -vis.margin.left+2)
        .attr("dy", "0.71em")
        .attr("fill", "#000")
        .text("");


    vis.svg.append("text")
        .attr("x", vis.width/3)
        .attr("y", -vis.margin.top+20)
        .attr("text-anchor", "left")
        .attr("class", "bar-chart-title")
        .text("Inflation-Adjusted Median Housing Prices by NYC Neighborhood");


    // Initialize legend
    vis.legend_margin = {top: 20, right: 20, bottom: 20, left: 20};

    vis.legend_width = $("#neighborhood-line-legend").width()/10 ,
        vis.legend_height = 300 - vis.legend_margin.top - vis.legend_margin.bottom;


    vis.key = d3.select("#neighborhood-line-legend")
        .append("svg")
        .attr("width", vis.width + vis.legend_margin.left + vis.legend_margin.right)
        .attr("height", vis.height + vis.legend_margin.top + vis.legend_margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.legend_margin.left + "," + vis.legend_margin.top + ")");

    vis.legend = vis.key.append("defs")
        .append("svg:linearGradient")
        .attr("id", "gradient")
        .attr("x1", "100%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%")
        .attr("spreadMethod", "pad");

    vis.highcolor = vis.legend.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "white")
        .attr("stop-opacity", .8);

    vis.lowcolor = vis.legend.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "black")
        .attr("stop-opacity", .8);



    vis.initialWrangleData();
    vis.wrangleData();
}




// Reformat all data -- this only needs to be done once
NeighborhoodLine.prototype.initialWrangleData = function(){
    var vis = this;
    vis.neighborhoods = {};

    var dtypes = ["abs_price", "percent_change"];
    var dtypes_data = [vis.raw_price_data, vis.raw_change_data];
    for (idx in dtypes) {
        vis.neighborhoods[dtypes[idx]] = [];
        for (var prop in dtypes_data[idx][0]) {
            if (prop != "Date") {
                
                vis.neighborhoods[dtypes[idx]].push(
                    {
                        id: prop,
                        values: dtypes_data[idx].map(function (d) {
                            return {date: vis.parseTime.parse(d.Date), price: +d[prop], neighborhood: prop};
                        })
                    });
            };
        };
    };
};



/*
 * Data wrangling
 */

NeighborhoodLine.prototype.wrangleData = function(){
    var vis = this;

    // Get selected boroughs
    vis.selected_boroughs = {};


    $('.checkbox-inline').each(function(){
        vis.selected_boroughs[($(this).attr("value"))] = $(this).is(":checked")
    });

    console.log(vis.selected_boroughs)

    var in_borough = function(datum) {
            return vis.selected_boroughs[vis.neighborhood_dict[datum.id].borough];
    }

    vis.all_boroughs_selected = $("#select_all").is(":checked")
    console.log(vis.all_boroughs_selected);

    // Filter for selected datatype
    vis.selected_dtype = $('input[name="options"]:checked', '#neighborhood-line-data-type').val()


    console.log(vis.selected_boroughs[vis.neighborhood_dict["West Village"].borough])

    if (vis.all_boroughs_selected) {vis.displayData = vis.neighborhoods[vis.selected_dtype]}
    else {vis.displayData = vis.neighborhoods[vis.selected_dtype].filter(in_borough)}

    console.log(vis.neighborhoods["abs_price"])
    vis.updateVis();
}



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 */

NeighborhoodLine.prototype.updateVis = function(){
    var vis = this;

    // update axes
    vis.x.domain(d3.extent(vis.raw_price_data, function(d) { return vis.parseTime.parse(d.Date); }));


    vis.y.domain([
        d3.min(vis.displayData, function(c) { return d3.min(c.values, function(d) { return d.price; }); }),
        d3.max(vis.displayData, function(c) { return d3.max(c.values, function(d) { return d.price; }); })
    ]);


    var selected_color_type = $('input[name="options"]:checked', '#neighborhood-line-color-type').val();


    vis.color_scale.domain(d3.extent(vis.displayData, function(d) {return vis.neighborhood_dict[d.id][selected_color_type]}));


    vis.svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + vis.height +10 +")")
        .call(vis.xAxis);

    vis.svg.select(".axis--y").transition().call(vis.yAxis);
    vis.svg.select(".axis--x").transition().call(vis.xAxis);

    if (vis.selected_dtype == "percent_change") {yaxlabel.text("Percent change in rental prices")}
        else {yaxlabel.text("Median Rental Prices ($/month)")}



    vis.dataline = d3.svg.line()
        .x(function(d) { return vis.x(d.date); })
        .y(function(d) { return vis.y(d.price); })
        .interpolate("linear");


    vis.neighborhood = vis.svg.selectAll(".n-line")
        .data(vis.displayData);

    vis.neighborhood.exit().remove();


    vis.neighborhood.enter().append("path")
        .attr("class", "n-line");



    vis.neighborhood
        .attr("d", function(d) { return vis.dataline(d.values); })
        .style("stroke", function(d) { return vis.color_scale(vis.neighborhood_dict[d.id][selected_color_type]); })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);


    function mouseover(d, i) {
        vis.neighborhood.classed("n-line-unhovered", true);
        d3.select(this).attr("class", "n-line-hovered");
        vis.tip.transition()
            .duration(200)
            .style("opacity", .9)
            .style("background-color", vis.color_scale(vis.neighborhood_dict[d.id][selected_color_type]));
        vis.tip.html(d.id + "<br/>" + vis.neighborhood_dict[d.id][selected_color_type])
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");

    }

    function mouseout(d,i) {
        vis.neighborhood.classed("n-line-unhovered", false);
        d3.select(this).attr("class", "n-line");
        vis.tip.transition()
            .duration(500)
            .style("opacity", 0);
    }






    // UPDATE LEGEND!
    vis.highcolor.attr("stop-color", vis.color_scale.range()[1]);

    vis.lowcolor.attr("stop-color", vis.color_scale.range()[0]);

    // add legend rectangle and fill with gradient
    vis.key.append("rect")
        .transition()
        .attr("x", vis.legend_margin.left)
        .attr("y", vis.legend_margin.top)
        .attr("width", vis.legend_width)
        .attr("height", vis.legend_height)
        .style("stroke", "#000")
        .style("fill", "url(#gradient)");

    // create a scale to map from data values to legend in order to
    vis.legendy = d3.scale.linear().range([vis.legend_height, 0])
        .domain(d3.extent(vis.displayData, function(d) {return vis.neighborhood_dict[d.id][selected_color_type]}));

    vis.legendyAxis = d3.svg.axis()
        .scale(vis.legendy)
        .orient("right")
        .tickSize(5)

    //remove outdated axis values
    d3.select("#legend-axis").remove()

    // add axis
    vis.key.append("g")
        .attr("id", "legend-axis")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (vis.legend_margin.left + vis.legend_width) + "," + vis.legend_margin.top + ")")
        .transition()
        .call(vis.legendyAxis);


    // add a legend title based on selected values
    $(".legend-title").html("");
    vis.legendlabels =  vis.key
        .append("text")
        .attr("class", "legend-title")
        .attr("x", -vis.legend_height)
        .attr("y", -vis.legend_margin.top)
        .attr("dy", ".71em")
        .style("text-anchor", "start")
        .attr("transform", "rotate(-90)")
        .text("Percent of Airbnb listings that were illegal");
}


