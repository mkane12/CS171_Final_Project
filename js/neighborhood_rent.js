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
    vis.z = d3.scale.ordinal(d3.schemeCategory10);

    vis.percent_illegal_color_scale = d3.scale.linear().domain([0, 1]).range(["#aaaaFF", "#FF0000"]);



    vis.line = d3.svg.line()
        .x(function(d) { return x(d.Date); })
        .y(function(d) { return y(d.price); })
        .interpolate("linear");

    vis.tip = d3.tip().attr('class', 'd3-tip')
        .offset([0,0])
        .html(function (d) {
            return d.neighborhood +
            "<table><tr><td > Number of Posts: </td><td>" + neighborhood_dict[d.neighborhood].number_of_posts + "</td></tr>" +
            "<tr><td > Number of Illegal Posts: </td><td>" + neighborhood_dict[d.neighborhood].number_of_illegal_posts + "</td></tr>" +
                "<tr><td > Percent Illegal: </td><td>" + (neighborhood_dict[d.neighborhood].percent_illegal*100).toFixed(1) + "%</td></tr>" +
                "<tr><td > Proportion of Posts: </td><td>" + neighborhood_dict[d.neighborhood].proportion_of_posts.toFixed(3) + "</td></tr>" +
                "<tr><td > Proportion of Illegal Posts: </td><td>" + neighborhood_dict[d.neighborhood].proportion_of_illegal_posts.toFixed(3) + "</td></tr></table>";
        });

    /* Invoke the tip in the context of your visualization */
    vis.svg.call(vis.tip);



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


    vis.svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -vis.height/2)
        .attr("y", -vis.margin.left+2)
        .attr("dy", "0.71em")
        .attr("fill", "#000")
        .text("Price ($/month)");


    vis.svg.append("text")
        .attr("x", vis.width/3)
        .attr("y", -vis.margin.top+20)
        .attr("text-anchor", "left")
        .attr("class", "bar-chart-title")
        .text("Inflation-Adjusted Median Housing Prices by NYC Neighborhood");



    // Initialize legend
    vis.legend_margin = {top: 20, right: 20, bottom: 20, left: 20};

    vis.legend_width = $("#neighborhood-line-legend").width()/10 ,
        vis.legend_height = 400 - vis.legend_margin.top - vis.legend_margin.bottom;


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
                            return {date: vis.parseTime.parse(d.Date), price: d[prop], neighborhood: prop};
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
    

    // Filter For Selected Borough
    borough_selectBox_area = document.getElementById("neighborhood-line-selected-borough");
    selected_borough = borough_selectBox_area.options[borough_selectBox_area.selectedIndex].value;

    var in_borough = function(borough) {
        return function(datum) {
            return vis.neighborhood_dict[datum.id].borough==borough;
        }
    }


    // Filter for selected datatype
    dtype_selectBox_area = document.getElementById("neighborhood-line-data-type");
    selected_dtype = dtype_selectBox_area.options[dtype_selectBox_area.selectedIndex].value;
    
    if (selected_borough != "all") {vis.displayData = vis.neighborhoods[selected_dtype].filter(in_borough(selected_borough))}
    else {vis.displayData = vis.neighborhoods[selected_dtype]}
    
    vis.updateVis();
}



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 */

NeighborhoodLine.prototype.updateVis = function(){
    var vis = this;

    vis.x.domain(d3.extent(vis.raw_price_data, function(d) { return vis.parseTime.parse(d.Date); }));

    vis.y.domain([
        d3.min(vis.displayData, function(c) { return d3.min(c.values, function(d) { return d.price; }); }),
        d3.max(vis.displayData, function(c) { return d3.max(c.values, function(d) { return d.price; }); })
    ]);


    vis.z.domain(vis.displayData.map(function(c) { return c.id; }));



    vis.svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(vis.xAxis);

    vis.svg.select(".axis--y").transition().call(vis.yAxis);


    vis.neighborhood = vis.svg.selectAll(".neighborhood")
        .data(vis.displayData);

    vis.neighborhood.enter().append("g")
        .attr("class", "neighborhood");



    vis.dataline = d3.svg.line()
        .x(function(d) { return vis.x(d.date); })
        .y(function(d) { return vis.y(d.price); })
        .interpolate("linear");


    vis.datalines = vis.svg.selectAll("path")
        .data(vis.displayData);

    vis.datalines.enter().append("path")
        .attr("class", "line");

    vis.datalines
        .transition()
        .attr("d", function(d) { return vis.dataline(d.values); })
        .attr("stroke", function(d) { return vis.percent_illegal_color_scale(neighborhood_dict[d.id].percent_illegal); })


    vis.datalines.exit().remove();




    //
    // vis.labels = vis.svg.selectAll("g")
    //     .data(vis.displayData)
    //
    // vis.labels.enter().append("text")
    //     .attr("class", "text");
    //
    // vis.labels
    //     .attr("transform", function(d) { console.log(d);return "translate(" + vis.x(d.values[d.values.length-1].date) + "," + vis.y(d.values[d.values.length-1].price) + ")"; })
    //     .attr("x", 3)
    //     .attr("dy", "0.35em")
    //     .style("font", "10px sans-serif")
    //     .text(function(d) {return d.id;});
    //
    // vis.labels.exit().remove();

    // vis.neighborhood.append("text")
    //     .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
    //     .attr("transform", function(d) { return "translate(" + vis.x(d.value.date) + "," + vis.y(d.value.price) + ")"; })
    //     .attr("x", 3)
    //     .attr("dy", "0.35em")
    //     .style("font", "10px sans-serif")
    //     .text(function(d) { return d.id; });



    // CIRCLES
    vis.points = vis.neighborhood.selectAll("circle")
        .data(function (d) {return d.values});

    vis.points.enter().append("circle");

    vis.points
        .attr('cx', function(d) { return vis.x(d.date) })
        .attr('cy', function(d) { return vis.y(d.price) })
        .attr("fill", function(d) {return vis.percent_illegal_color_scale(neighborhood_dict[d.neighborhood].percent_illegal)})
        .attr("r", 4)
        .on('mouseover', vis.tip.show)
        .on('mouseout', vis.tip.hide);


    vis.neighborhood.exit().remove();




    // UPDATE LEGEND!
    vis.highcolor.attr("stop-color", vis.percent_illegal_color_scale.range()[1]);

    vis.lowcolor.attr("stop-color", vis.percent_illegal_color_scale.range()[0]);

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
        .domain([0, 1]);

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


