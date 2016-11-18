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
    vis.displayData.nodes.push(new sankeyNode("all", vis.dataset.length, "total listings"));
    vis.displayData.nodes.push(new sankeyNode("apts", apartments.length, "apartments"));
    vis.displayData.nodes.push(new sankeyNode("short", shortTerm.length, "short-term listings"));
    vis.displayData.nodes.push(new sankeyNode("full-apt", fullApt.length, "full-home rentals"));
    vis.displayData.nodes.push(new sankeyNode("host-mult", hostMult.length, "cases where host has multiple listings"));
    vis.displayData.nodes.push(new sankeyNode("host-away", hostAway.length, "listings with host not in NYC"));
    vis.displayData.nodes.push(new sankeyNode("illegal", illegals.length, "illegal listings"));
    vis.displayData.nodes.push(new sankeyNode("legal", vis.dataset.length - illegals.length, "legal listings"));

    // now we create links between the nodes
    // for proper display, we create the ILLEGAL links first
    vis.displayData.links.push(new sankeyLink("all", "apts", vis.displayData.nodes, apartments.length));
    vis.displayData.links.push(new sankeyLink("apts", "short", vis.displayData.nodes, shortTerm.length));
    vis.displayData.links.push(new sankeyLink("short", "full-apt", vis.displayData.nodes, fullApt.length));
    vis.displayData.links.push(new sankeyLink("short", "host-mult", vis.displayData.nodes, hostMult.length));
    vis.displayData.links.push(new sankeyLink("short", "host-away", vis.displayData.nodes, hostAway.length));
    vis.displayData.links.push(new sankeyLink("full-apt", "illegal", vis.displayData.nodes, fullApt.length));
    vis.displayData.links.push(new sankeyLink("host-mult", "illegal", vis.displayData.nodes, hostMult.length));
    vis.displayData.links.push(new sankeyLink("host-away", "illegal", vis.displayData.nodes, hostAway.length));
    // now we create the LEGAL links
    vis.displayData.links.push(new sankeyLink("all", "legal", vis.displayData.nodes, vis.dataset.length - apartments.length));
    vis.displayData.links.push(new sankeyLink("apts", "legal", vis.displayData.nodes, apartments.length - shortTerm.length));
    vis.displayData.links.push(new sankeyLink("short", "legal", vis.displayData.nodes, shortTerm.length - illegals.length));

    // Update the visualization
    vis.updateVis();

}


/*
 *  The drawing function
 */

customSankey.prototype.updateVis = function() {
    var vis = this;

    
}



/******
 * these help us create the proper
 * nodes and links for the sankey data structure
 */

// the ID exists so its easier to find the correct node
sankeyNode = function(_ID, _num, _description) {
    this.id = _ID;
    this.num = _num;
    this.desc = _description;
    this.name = _num + " " + _description;
}

// i pass in IDs and then look them up in the node array
// so it automatically matches the correct things
// and we don't have to keep track of indices
sankeyLink = function(_startID, _endID, _nodeSet, _num) {
    this.source = _nodeSet.find(function(d) {
        return d.id == _startID;
    });

    this.target = _nodeSet.find(function(d) {
        return d.id == _endID;
    });

    this.startID = _startID;
    this.endID = _endID;
    this.value = _num;
}