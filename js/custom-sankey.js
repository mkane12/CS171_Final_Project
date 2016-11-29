/*
 *  customSankey - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _dataset         -- Dataset to analyze for illegal listings
 */

customSankey = function(_parentElement, _dataset) {

    this.parentElement = _parentElement;
    this.dataset = _dataset;

    this.initVis();
}


/*
 *  Initialize svg layout
 */

customSankey.prototype.initVis = function() {
    var vis = this;

    vis.fullWidth = $(vis.parentElement).width();
    vis.fullHeight = 350;

    vis.margin = {top: 1, right: 1, bottom: 55, left: 1};
    vis.width = vis.fullWidth - vis.margin.right - vis.margin.left;
    vis.height = vis.fullHeight - vis.margin.top - vis.margin.bottom;

    vis.color = d3.scale.category20();

    vis.svg = d3.select(vis.parentElement).append("svg")
        .attr("width", vis.fullWidth)
        .attr("height", vis.fullHeight);

    vis.main = vis.svg.append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.legend = vis.svg.append("g")
        .attr("transform", "translate(" + (vis.margin.left) + "," + (vis.margin.top + vis.height) + ")");

    vis.barWidth = 40;

    vis.barHeightScale = d3.scale.linear()
        .range([0, 0.6*vis.height]);

    vis.xPosScale = d3.scale.linear()
        .range([0, vis.width - vis.barWidth]);

    vis.analyzeData();
}


/*
 *  Analyze listing data for legality in stages
 */

customSankey.prototype.analyzeData = function () {
    var vis = this;

    /*******
     * first we need to analyze the data
     * using tests for legality
     */

        // first test: is it an apartment?
    vis.apartments = vis.dataset.filter(function(d) {
            return d.property_type == "Apartment";
        });

    // second test: is it a short term stay?
    vis.shortTerm = vis.apartments.filter(function(d) {
        return d.min_stay < 30;
    });

    // third test: is the host still present?
    // 3 ways of figuring this out;
    // are you renting the entire apt,
    // does host have mult listings, or is host not in NYC
    // here are the helper functions to do this filtering
    function isEntireApt(d) {
        return d.room_type == "Entire home/apt";
    }
    function hostHasMult(d) {
        return d.calculated_host_listings_count > 1;
    }
    function isHostAway(d) {
        // the tests don't work if the host location is null
        // so let's make sure there IS a location
        if (d.host_location) {
            return ((!(~d.host_location.indexOf("New York")))
            && (!(~d.host_location.indexOf("NY")))
            && (d.host_location != "US"));
        }
        // if the location is null we give them the benefit of the doubt
        // and assume they're ok so we don't put them in this dataset
    }

    // apply those functions one by one
    vis.fullApt = vis.shortTerm.filter(isEntireApt);

    vis.hostMult = vis.shortTerm.filter(function(d) {
        return (hostHasMult(d) && !isEntireApt(d));
    });

    vis.hostAway = vis.shortTerm.filter(function(d) {
        return (isHostAway(d) && !(isEntireApt(d) || hostHasMult(d)));
    });

    // apply all 3 to see all illegal listings
    // the ORs make sure that there's no duplicates
    vis.illegals = vis.shortTerm.filter(function(d) {
        return (isEntireApt(d) || hostHasMult(d) || isHostAway(d));
    });

    vis.structureData();
}


/*
 *  Create initial nodes and links
 */

customSankey.prototype.structureData = function () {
    var vis = this;

    /*******
     * now we can construct the needed data structure
     */
    vis.displayData = {"nodes":[], "links":[]};

    // we add all the nodes we need based on our tests
    // the sankeyNode is below
    vis.displayData.nodes.push(new sankeyNode("all", 1, vis.height/3.5, vis.dataset.length, "total listings"));
    vis.displayData.nodes.push(new sankeyNode("apts", 2, vis.height/5, vis.apartments.length, "apartments"));
    vis.displayData.nodes.push(new sankeyNode("short", 3, vis.height/9, vis.shortTerm.length, "short-term listings"));
    vis.displayData.nodes.push(new sankeyNode("full-apt", 4, 15, vis.fullApt.length, "C"));
    vis.displayData.nodes.push(new sankeyNode("host-mult", 4, 0, vis.hostMult.length, "B"));
    vis.displayData.nodes.push(new sankeyNode("host-away", 4, 0, vis.hostAway.length, "A"));
    vis.displayData.nodes.push(new sankeyNode("illegal", 5, 0, vis.illegals.length, "illegal"));
    vis.displayData.nodes.push(new sankeyNode("legal", 5, vis.height, vis.dataset.length - vis.illegals.length, "legal"));

    // now we create links between the nodes
    // for proper display, we create the ILLEGAL links first
    vis.displayData.links.push(new sankeyLink("all", "apts", vis.displayData.nodes, vis.apartments.length, 0, null));
    vis.displayData.links.push(new sankeyLink("apts", "short", vis.displayData.nodes, vis.shortTerm.length, 0, null));
    vis.displayData.links.push(new sankeyLink("short", "full-apt", vis.displayData.nodes, vis.fullApt.length, 0, null));
    vis.displayData.links.push(new sankeyLink("short", "host-mult", vis.displayData.nodes, vis.hostMult.length, ["short", "full-apt"], null));
    vis.displayData.links.push(new sankeyLink("short", "host-away", vis.displayData.nodes, vis.hostAway.length, ["short", "host-mult"], null));
    vis.displayData.links.push(new sankeyLink("full-apt", "illegal", vis.displayData.nodes, vis.fullApt.length, null, 0));
    vis.displayData.links.push(new sankeyLink("host-mult", "illegal", vis.displayData.nodes, vis.hostMult.length, null, ["full-apt", "illegal"]));
    vis.displayData.links.push(new sankeyLink("host-away", "illegal", vis.displayData.nodes, vis.hostAway.length, null, -1));
    // now we create the LEGAL links
    vis.displayData.links.push(new sankeyLink("all", "legal", vis.displayData.nodes, vis.dataset.length - vis.apartments.length, -1, -1));
    vis.displayData.links.push(new sankeyLink("short", "legal", vis.displayData.nodes, vis.shortTerm.length - vis.illegals.length, -1, 0));
    vis.displayData.links.push(new sankeyLink("apts", "legal", vis.displayData.nodes, vis.apartments.length - vis.shortTerm.length, -1, ["short", "legal"]));

    vis.formatData();
}


/*
 *  Tweak nodes and links to be properly laid out
 */

customSankey.prototype.formatData = function() {
    var vis = this;

    // now we can set the domains for the scales
    vis.xPosScale.domain(d3.extent(vis.displayData.nodes, function(d) { return d.level; }));
    vis.barHeightScale.domain([0, d3.max(vis.displayData.nodes, function(d) { return d.num; })]);

    // use the scales to set some spacing things
    // the node for legal listings will be all the way at the bottom
    var legalNode = findNode(vis.displayData.nodes, "legal");
    legalNode.yStart= (vis.height - vis.barHeightScale(legalNode.num));


    // these three nodes are all in the same level, and i want to space them evenly
    // so access them all
    fullNode = findNode(vis.displayData.nodes, "full-apt");
    multNode = findNode(vis.displayData.nodes, "host-mult");
    awayNode = findNode(vis.displayData.nodes, "host-away");

    // calculate appropriate padding so that the three of them fill half the height
    var nodePad = (vis.height * 0.45 - (vis.barHeightScale(fullNode.num) + vis.barHeightScale(multNode.num) + vis.barHeightScale(awayNode.num))) / 2;

    // apply new positions with that padding
    multNode.yStart = vis.barHeightScale(fullNode.num) + nodePad + 15;
    awayNode.yStart = vis.barHeightScale(fullNode.num) + vis.barHeightScale(multNode.num) + 2*nodePad + 15;

    // need to set up a holder for the legend info
    vis.legendInfo = [{code: "A", label: "host not in NYC", num: vis.hostAway.length},
        {code: "B", label: "host has multiple listings", num: vis.hostMult.length},
        {code: "C", label: "full home rentals", num: vis.fullApt.length}];

    // this will help us generally position things further on
    vis.displayData.nodes.forEach(function(d) {
        d.height = vis.barHeightScale(d.num);
        d.xStart = vis.xPosScale(d.level);
        d.xEnd = d.xStart + vis.barWidth;
        d.yEnd = d.yStart + d.height;
        d.color = vis.color(d.name.replace(/ .*/, ""));
    });


    // this math helps figure out the start and end locations for the paths
    vis.displayData.links.forEach(function(d) {
        d.weight = vis.barHeightScale(d.value);
        d.xStart = d.source.xEnd;

        if (d.yStart === 0) {
            d.yStart = d.source.yStart + d.weight/2;
        } else if (d.yStart === -1) {
            d.yStart = d.source.yEnd - d.weight/2;
        } else if (d.yStart === null) {
            d.yStart = d.source.yStart + vis.barHeightScale(d.source.num)/2;
        } else if (typeof d.yStart === "object") {
            var prevLink = findLink(vis.displayData.links, d.yStart);
            d.yStart = prevLink.yStart + prevLink.weight/2 + d.weight/2;
        }

        if (d.yEnd === 0) {
            d.yEnd = d.target.yStart + d.weight/2;
        } else if (d.yEnd === -1) {
            d.yEnd = d.target.yEnd - d.weight/2;
        } else if (d.yEnd === null) {
            d.yEnd = d.target.yStart + vis.barHeightScale(d.target.num)/2;
        } else if (typeof d.yEnd === "object") {
            var prevLink = findLink(vis.displayData.links, d.yEnd);
            d.yEnd = prevLink.yEnd + prevLink.weight/2 + d.weight/2;
        }

        d.xEnd = d.target.xStart;
    });

    // Update the visualization
    vis.updateVis();

}


/*
 *  The drawing function
 */

customSankey.prototype.updateVis = function() {
    var vis = this;

    vis.node = vis.main.selectAll(".node")
        .data(vis.displayData.nodes);

    vis.node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.xStart + ", " + d.yStart + ")"; });

    vis.node
        .append("rect")
        .attr("width", vis.barWidth)
        .attr("height", function(d) { return d.height; })
        .style("fill", "#79CCCD")
        .style("stroke", d3.rgb("#79CCCD").darker(2));

    // add in the title for the nodes
    // this is word label
    // if statement means that small ABC label will be fully centered
    // also it shifts the A a little bit
    vis.node.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
            var xpos = vis.barWidth/2;
            var ypos;
            if (d.desc.length == 1) {
                xpos += 4;
            } else {
                xpos -= 4;
            }
            if (d.desc == "A") {
                ypos = d.height + 7;
            } else {
                ypos = d.height/2
            }
            return "translate(" + xpos + "," + ypos + ")rotate(-90)"; })
        .text(function(d) { return d.desc; });

    // this is number label
    // the if statement means this will only show up on sufficiently large rects
    vis.node.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", function(d) { return "translate(" + (vis.barWidth/2 + 14) + "," + d.height/2 + ")rotate(-90)"; })
        .text(function(d) {
            if (d.desc.length != 1) {
                return "(" + d.num + ")";
            }});

    vis.node.exit().remove();

    // this function draws pretty shape links
    function linkVertical(d) {
        return "M" + d.xStart + "," + d.yStart
            + "C" + (d.xStart + d.xEnd) / 2 + "," + d.yStart
            + " " + (d.xStart + d.xEnd) / 2 + "," + d.yEnd
            + " " + d.xEnd + "," + d.yEnd;
    }

    vis.links = vis.main.selectAll(".link")
        .data(vis.displayData.links);

    vis.links.enter().append("path")
        .attr("class", "link")
        .attr("stroke", "black")
        .attr("stroke-width", function(d) { return d.weight; })
        .attr("d", linkVertical);

    // add legend labels
    vis.legendLabels = vis.legend.selectAll("text")
        .data(vis.legendInfo);

    vis.legendLabels.enter().append("text")
        .attr("class", "sankey-legend");

    vis.legendLabels
        .attr("text-anchor", "start")
        .attr("transform", function(d, i) { return "translate(" + (vis.width - 200) + "," + (20 + i * 16) + ")";})
        .text(function(d) { return d.code + " = " + d.label + " (" + d.num + ")"; });

    vis.legendLabels.exit().remove();
}



/******
 * these help us create the proper
 * nodes and links for the sankey data structure
 */

// the ID exists so its easier to find the correct node
sankeyNode = function(_ID, _level, _yStart, _num, _description) {
    this.id = _ID;
    this.num = _num;
    this.level = _level;
    this.yStart = _yStart;
    this.desc = _description;
    this.name = _num + " " + _description;
}

// i pass in IDs and then look them up in the node array
// so it automatically matches the correct things
// and we don't have to keep track of indices
sankeyLink = function(_startID, _endID, _nodeSet, _num, _yStart, _yEnd) {
    this.source = _nodeSet.find(function(d) {
        return d.id == _startID;
    });

    this.target = _nodeSet.find(function(d) {
        return d.id == _endID;
    });

    this.startID = _startID;
    this.endID = _endID;
    this.value = _num;
    this.yStart = _yStart;
    this.yEnd = _yEnd;
}

function findNode(set, _id) {
    return set.find(function(d) {
        return d.id == _id;
    });
}

function findLink(set, args) {
    _startID = args[0];
    _endID = args[1];
    return set.find(function(d) {
        return (d.startID == _startID) && (d.endID == _endID);
    });
}