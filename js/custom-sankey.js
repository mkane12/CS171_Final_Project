/*
 *  listingSankey - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _dataset         -- Dataset to analyze for illegal listings
 */

customSankey = function(_parentElement, _dataset) {

    this.parentElement = _parentElement;
    this.dataset = _dataset;

    this.initVis();
}


/*
 *  Initialize station map
 */

customSankey.prototype.initVis = function() {
    var vis = this;

    vis.width = $(vis.parentElement).width();
    vis.height = 300;

    vis.color = d3.scale.category20();

    vis.svg = d3.select(vis.parentElement).append("svg")
        .attr("width", vis.width)
        .attr("height", vis.height);

    vis.barWidth = 40;

    vis.barHeightScale = d3.scale.linear()
        .range([0, 0.6*vis.height]);

    vis.xPosScale = d3.scale.linear()
        .range([0, vis.width - vis.barWidth]);

    vis.wrangleData();
}


/*
 *  Data wrangling
 */

customSankey.prototype.wrangleData = function() {
    var vis = this;

    /*******
     * first we need to analyze the data
     * using tests for legality
     */

        // first test: is it an apartment?
    var apartments = vis.dataset.filter(function(d) {
            return d.property_type == "Apartment";
        });

    // second test: is it a short term stay?
    var shortTerm = apartments.filter(function(d) {
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
    var fullApt = shortTerm.filter(isEntireApt);

    var hostMult = shortTerm.filter(function(d) {
        return (hostHasMult(d) && !isEntireApt(d));
    });

    var hostAway = shortTerm.filter(function(d) {
        return (isHostAway(d) && !(isEntireApt(d) || hostHasMult(d)));
    });

    // apply all 3 to see all illegal listings
    // the ORs make sure that there's no duplicates
    var illegals = shortTerm.filter(function(d) {
        return (isEntireApt(d) || hostHasMult(d) || isHostAway(d));
    });

    /*******
     * now we can construct the needed data structure
     */
    vis.displayData = {"nodes":[], "links":[]};

    // we add all the nodes we need based on our tests
    // the sankeyNode is below
    vis.displayData.nodes.push(new sankeyNode("all", 1, vis.height/3.5, vis.dataset.length, "total listings"));
    vis.displayData.nodes.push(new sankeyNode("apts", 2, vis.height/5, apartments.length, "apartments"));
    vis.displayData.nodes.push(new sankeyNode("short", 3, vis.height/9, shortTerm.length, "short-term listings"));
    vis.displayData.nodes.push(new sankeyNode("full-apt", 4, 15, fullApt.length, "full-home rentals"));
    vis.displayData.nodes.push(new sankeyNode("host-mult", 4, 0, hostMult.length, "cases where host has multiple listings"));
    vis.displayData.nodes.push(new sankeyNode("host-away", 4, 0, hostAway.length, "listings with host not in NYC"));
    vis.displayData.nodes.push(new sankeyNode("illegal", 5, 0, illegals.length, "illegal listings"));
    vis.displayData.nodes.push(new sankeyNode("legal", 5, vis.height, vis.dataset.length - illegals.length, "legal listings"));

    // now we create links between the nodes
    // for proper display, we create the ILLEGAL links first
    vis.displayData.links.push(new sankeyLink("all", "apts", vis.displayData.nodes, apartments.length, 0, null));
    vis.displayData.links.push(new sankeyLink("apts", "short", vis.displayData.nodes, shortTerm.length, 0, null));
    vis.displayData.links.push(new sankeyLink("short", "full-apt", vis.displayData.nodes, fullApt.length, 0, null));
    vis.displayData.links.push(new sankeyLink("short", "host-mult", vis.displayData.nodes, hostMult.length, ["short", "full-apt"], null));
    vis.displayData.links.push(new sankeyLink("short", "host-away", vis.displayData.nodes, hostAway.length, ["short", "host-mult"], null));
    vis.displayData.links.push(new sankeyLink("full-apt", "illegal", vis.displayData.nodes, fullApt.length, null, 0));
    vis.displayData.links.push(new sankeyLink("host-mult", "illegal", vis.displayData.nodes, hostMult.length, null, ["full-apt", "illegal"]));
    vis.displayData.links.push(new sankeyLink("host-away", "illegal", vis.displayData.nodes, hostAway.length, null, -1));
    // now we create the LEGAL links
    vis.displayData.links.push(new sankeyLink("all", "legal", vis.displayData.nodes, vis.dataset.length - apartments.length, -1, -1));
    vis.displayData.links.push(new sankeyLink("short", "legal", vis.displayData.nodes, shortTerm.length - illegals.length, -1, 0));
    vis.displayData.links.push(new sankeyLink("apts", "legal", vis.displayData.nodes, apartments.length - shortTerm.length, -1, ["short", "legal"]));

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

    vis.node = vis.svg.selectAll(".node")
        .data(vis.displayData.nodes);

    vis.node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.xStart + ", " + d.yStart + ")"; });

    vis.node
        .append("rect")
        .attr("width", vis.barWidth)
        .attr("height", function(d) { return d.height; })
        .style("fill", function(d) { return d.color; })
        .style("stroke", function(d) { return d3.rgb(d.color).darker(2); });

    // add in the title for the nodes
    vis.node.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", function(d) { return "translate(" + (vis.barWidth/2 + 4) + "," + d.height/2 + ")rotate(-90)"; })
        .text(function(d) { return d.desc; });

    vis.node.exit().remove();

    // this function should draw pretty links???
    function linkHorizontal(d) {
        return "M" + d.xStart + "," + d.yStart
            + "C" + d.xStart +  "," + (d.yStart + d.yEnd) / 2
            + " " + d.xEnd + "," + (d.yStart + d.yEnd) / 2
            + " " + d.xEnd + "," + d.yEnd;
    }

    function linkVertical(d) {
        return "M" + d.xStart + "," + d.yStart
            + "C" + (d.xStart + d.xEnd) / 2 + "," + d.yStart
            + " " + (d.xStart + d.xEnd) / 2 + "," + d.yEnd
            + " " + d.xEnd + "," + d.yEnd;
    }

    vis.links = vis.svg.selectAll(".link")
        .data(vis.displayData.links);

    vis.links.enter().append("path")
        .attr("class", "link")
        .attr("stroke", "black")
        .attr("stroke-width", function(d) { return d.weight; })
        .attr("d", linkVertical);
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