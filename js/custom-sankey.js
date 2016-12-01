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

    // number formatter
    vis.formatNum = d3.format(",d");

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

    vis.controls = vis.svg.append("g")
        .attr("class", "controls")
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
    vis.displayData.nodes.push(new sankeyNode("full-apt", 4, 15, vis.fullApt.length, "A"));
    vis.displayData.nodes.push(new sankeyNode("host-mult", 4, 0, vis.hostMult.length, "B"));
    vis.displayData.nodes.push(new sankeyNode("host-away", 4, 0, vis.hostAway.length, "C"));
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
    vis.legendInfo = [{code: "A", label: "full home rentals", num: vis.fullApt.length, id: "full-apt"},
        {code: "B", label: "host has multiple listings", num: vis.hostMult.length, id: "host-mult"},
        {code: "C", label: "host not in NYC", num: vis.hostAway.length, id: "host-away"}];

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
        .attr("transform", function(d) { return "translate(" + d.xStart + ", " + d.yStart + ")"; });

    vis.node
        .append("rect")
        .attr("class", function(d) { return "node " + d.id; })
        .attr("width", vis.barWidth)
        .attr("height", function(d) { return d.height; })
        .attr("fill", "#F16664")
        .attr("stroke", d3.rgb("#F16664").darker(2))
        .attr("opacity", 0);

    // add in the title for the nodes
    // this is word label
    // if statement means that small ABC label will be fully centered
    // also it shifts the A a little bit
    vis.node.append("text")
        .attr("class", function(d) { return "node-label " + d.id; })
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
            var xpos = vis.barWidth/2;
            var ypos;
            if (d.desc.length == 1) {
                xpos += 4;
            } else {
                xpos -= 4;
            }
            if (d.desc == "C") {
                ypos = d.height + 7;
            } else {
                ypos = d.height/2
            }
            return "translate(" + xpos + "," + ypos + ")rotate(-90)"; })
        .text(function(d) { return d.desc; })
        .attr("opacity", 0);

    // this is number label
    // the if statement means this will only show up on sufficiently large rects
    vis.node.append("text")
        .attr("class", function(d) { return "node-label " + d.id; })
        .attr("text-anchor", "middle")
        .attr("transform", function(d) { return "translate(" + (vis.barWidth/2 + 14) + "," + d.height/2 + ")rotate(-90)"; })
        .text(function(d) {
            if (d.desc.length != 1) {
                return "(" + vis.formatNum(d.num) + ")";
            }})
        .attr("opacity", 0);

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
        .attr("class", function(d) { return "link link-" + d.startID + "-" + d.endID; })
        .attr("stroke", "black")
        .attr("stroke-width", function(d) { return d.weight; })
        .attr("d", linkVertical)
        .attr("stroke-opacity", 0);

    // add legend labels
    vis.legendLabels = vis.legend.selectAll("text")
        .data(vis.legendInfo);

    vis.legendLabels.enter().append("text");

    vis.legendLabels
        .attr("class", function(d) { return "sankey-legend " + d.id; })
        .attr("text-anchor", "start")
        .attr("transform", function(d, i) { return "translate(" + (vis.width - 200) + "," + (20 + i * 16) + ")";})
        .text(function(d) { return d.code + " = " + d.label + " (" + vis.formatNum(d.num) + ")"; })
        .attr("opacity", 0);

    vis.legendLabels.exit().remove();

    vis.initAnim();
}


/*
 *  Initializes labels and things for the animation
 *  adapted from https://github.com/nbremer/Chord-Diagram-Storytelling/
 */

customSankey.prototype.initAnim = function() {
    var vis = this;

    // wrapper for center text
    vis.textCenter = vis.main.append("g")
        .attr("class", "explanationWrapper")
        .attr("opacity", 0);

    var bgW = vis.width * 0.5;
    var bgH = vis.height * 0.85;
    vis.textBackground = vis.textCenter.append("rect")
        .attr("height", bgH)
        .attr("width", bgW)
        .attr("x", vis.width/2 - bgW/2)
        .attr("y", vis.height/2 - bgH/2)
        .attr("fill", "white")
        .attr("opacity", 0.7);

    vis.startTopText = "As of Oct 1, 2016, there were " + vis.formatNum(vis.dataset.length) + " Airbnb listings in NYC.";
    vis.startBottomText = (vis.illegals.length/vis.dataset.length * 100).toFixed(1) + "% of them were illegal.";

    // initial top text
    vis.textTop = vis.textCenter.append("text")
        .attr("class", "explanation")
        .attr("text-anchor", "middle")
        .attr("x", vis.width/2)
        .attr("y", vis.height/2 - 50)
        .attr("dy", "0.5em")
        .attr("opacity", 1)
        .text(vis.startTopText)
        .call(wrap, vis.width*0.4);

    // initial bottom text
    vis.textBottom = vis.textCenter.append("text")
        .attr("class", "explanation")
        .attr("text-anchor", "middle")
        .attr("x", vis.width/2)
        .attr("y", vis.height/2 + 40)
        .attr("dy", "0.5em")
        .attr('opacity', 1)
        .text(vis.startBottomText)
        .call(wrap, vis.width*0.4);

    // make the center text show up in a pretty way
    vis.textCenter
        .transition().duration(1400)
        .attr("opacity", 1);

    var buttonWidth = 45;
    var buttonWidthPlus = 65;
    var buttonHeight = 25;

    // now we have to add some buttons...

    // this is the main button that just says next
    vis.nextBtn = vis.controls.append("g")
        .attr("class", "button")
        .attr("transform", "translate(" + (vis.width - buttonWidth)/2 + "," + 0 + ")");

    vis.nextBtn
        .append("rect")
        .attr("height", buttonHeight)
        .attr("width", buttonWidth)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 0.75);

    vis.nextText = vis.nextBtn
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", buttonWidth/2)
        .attr("y", buttonHeight/2 + 7)
        .text("Start");


    // this is a button that skips the whole intro
    vis.skipBtn = vis.controls.append("g")
        .attr("class", "button")
        .attr("transform", "translate(" + (buttonWidthPlus + 10) + "," + 0 + ")");

    vis.skipBtn
        .append("rect")
        .attr("height", buttonHeight)
        .attr("width", buttonWidth)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 0.75);

    vis.skipText = vis.skipBtn
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", buttonWidth/2)
        .attr("y", buttonHeight/2 + 7)
        .text("Skip");

    // this button resets the intro
    vis.resetBtn = vis.controls.append("g")
        .attr("class", "button")
        .attr("transform", "translate(" + 0 + "," + 0 + ")");

    vis.resetBtn
        .append("rect")
        .attr("height", buttonHeight)
        .attr("width", buttonWidthPlus)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 0.75);

    vis.resetText = vis.resetBtn
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", buttonWidthPlus/2)
        .attr("y", buttonHeight/2 + 7)
        .text("Restart");

    vis.counter = 1,
        vis.opacityValueBase = 0.8,
        vis.opacityValue = 0.4;

    vis.nextBtn
        .on("click", function () {

            if(vis.counter == 1) vis.Draw1();
            else if(vis.counter == 2) vis.Draw2();
            else if(vis.counter == 3) vis.Draw3();
            else if(vis.counter == 4) vis.Draw4();
            else if(vis.counter == 5) vis.Draw5();
            else if(vis.counter == 6) vis.Draw6();
            else if(vis.counter == 7) vis.Draw7();
            else if(vis.counter == 8) vis.Draw8();

            else vis.DrawLast();

            vis.counter = vis.counter + 1;
        });

    // skip button just jumps to the end
    vis.skipBtn
        .on("click", function() { vis.DrawLast(); })

    // reset button just jumps to the end
    vis.resetBtn
        .on("click", function() { vis.DrawReset(); })
}


/*
 *  BELOW ARE ALL THE DRAWING FUNCTIONS
 */

customSankey.prototype.Draw1 = function() {
    var vis = this;

    vis.textCenter
        .transition().duration(1400).attr("opacity", 0);

    vis.nextText
        .transition().duration(1400).text("Next");

    vis.node.selectAll(".all")
        .transition().delay(1400).duration(1400).attr("opacity", 1);

    vis.main.selectAll(".link-all-apts")
        .transition().delay(1400).duration(1400).attr("stroke-opacity", 0.1);

    vis.main.selectAll(".link-all-legal")
        .transition().delay(1400).duration(1400).attr("stroke-opacity", 0.1);

    vis.node.selectAll(".apts")
        .transition().delay(1400).duration(1400).attr("opacity", 1);

    vis.node.selectAll(".legal")
        .transition().delay(1400).duration(1400).attr("opacity", 1);

    vis.textTop
        .transition().delay(1400)
        .text("Renting a house or condo is always legal.")
        .call(wrap, vis.width*0.4);

    vis.textBottom
        .transition().delay(1400)
        .text("However, the " + vis.formatNum(vis.apartments.length) + " apartments listed might be illegal.")
        .call(wrap, vis.width*0.4);

    vis.textCenter
        .transition().delay(2100).duration(1400).attr("opacity", 1);
}

customSankey.prototype.Draw2 = function() {
    var vis = this;

    vis.textCenter
        .transition().duration(1400).attr("opacity", 0);

    vis.node.selectAll(".short")
        .transition().delay(1400).duration(1400).attr("opacity", 1);

    vis.main.selectAll(".link-apts-short")
        .transition().delay(1400).duration(1400).attr("stroke-opacity", 0.1);

    vis.main.selectAll(".link-apts-legal")
        .transition().delay(1400).duration(1400).attr("stroke-opacity", 0.1);

    vis.textTop
        .transition().delay(1400)
        .text("It's usually illegal to rent an apartment for fewer than 30 days.")
        .call(wrap, vis.width*0.4);

    vis.textBottom
        .transition().delay(1400)
        .text("Only " + vis.formatNum(vis.apartments.length - vis.shortTerm.length) + " listed apartments were above this limit.")
        .call(wrap, vis.width*0.4);

    vis.textCenter
        .transition().delay(2100).duration(1400).attr("opacity", 1);
}

customSankey.prototype.Draw3 = function() {
    var vis = this;

    vis.textCenter
        .transition().duration(1400).attr("opacity", 0);

    vis.textTop
        .transition().delay(1400)
        .text("A short-term apartment rental is still legal if the host is on the premises.")
        .call(wrap, vis.width*0.4);

    vis.textBottom
        .transition().delay(1400)
        .text("We had three methods of estimating when they're not.")
        .call(wrap, vis.width*0.4);

    vis.textCenter
        .transition().delay(2100).duration(1400).attr("opacity", 1);

}

customSankey.prototype.Draw4 = function() {
    var vis = this;

    vis.textCenter
        .transition().duration(1400).attr("opacity", 0);

    vis.node.selectAll(".full-apt")
        .transition().delay(1400).duration(1400).attr("opacity", 1);

    vis.legend.selectAll(".full-apt")
        .transition().delay(1400).duration(1400).attr("opacity", 1);

    vis.main.selectAll(".link-short-full-apt")
        .transition().delay(1400).duration(1400).attr("stroke-opacity", 0.1);

    vis.textTop
        .transition().delay(1400)
        .text("Renting a full home/apartment means the host probably isn't there.")
        .call(wrap, vis.width*0.4);

    vis.textBottom
        .transition().delay(1400)
        .text("This accounts for " + vis.formatNum(vis.fullApt.length) + " listings.")
        .call(wrap, vis.width*0.4);

    vis.textCenter
        .transition().delay(2100).duration(1400).attr("opacity", 1);

}

customSankey.prototype.Draw5 = function() {
    var vis = this;

    vis.textCenter
        .transition().duration(1400).attr("opacity", 0);

    vis.node.selectAll(".host-mult")
        .transition().delay(1400).duration(1400).attr("opacity", 1);

    vis.legend.selectAll(".host-mult")
        .transition().delay(1400).duration(1400).attr("opacity", 1);

    vis.main.selectAll(".link-short-host-mult")
        .transition().delay(1400).duration(1400).attr("stroke-opacity", 0.1);

    vis.textTop
        .transition().delay(1400)
        .text("Hosts with multiple listings definitely aren't living in all of them.")
        .call(wrap, vis.width*0.4);

    vis.textBottom
        .transition().delay(1400)
        .text("That's another " + vis.formatNum(vis.hostMult.length) + " listings.")
        .call(wrap, vis.width*0.4);

    vis.textCenter
        .transition().delay(2100).duration(1400).attr("opacity", 1);

}

customSankey.prototype.Draw6 = function() {
    var vis = this;

    vis.textCenter
        .transition().duration(1400).attr("opacity", 0);

    vis.node.selectAll(".host-away")
        .transition().delay(1400).duration(1400).attr("opacity", 1);

    vis.legend.selectAll(".host-away")
        .transition().delay(1400).duration(1400).attr("opacity", 1);

    vis.main.selectAll(".link-short-host-away")
        .transition().delay(1400).duration(1400).attr("stroke-opacity", 0.1);

    vis.textTop
        .transition().delay(1400)
        .text("If the host isn't located in NYC, they aren't living at the listed property.")
        .call(wrap, vis.width*0.4);

    vis.textBottom
        .transition().delay(1400)
        .text(vis.formatNum(vis.hostAway.length) + " listings met this criterion.")
        .call(wrap, vis.width*0.4);

    vis.textCenter
        .transition().delay(2100).duration(1400).attr("opacity", 1);

}

customSankey.prototype.Draw7 = function() {
    var vis = this;

    vis.textCenter
        .transition().duration(1400).attr("opacity", 0);

    vis.main.selectAll(".link-short-legal")
        .transition().delay(1400).duration(1400).attr("stroke-opacity", 0.1);

    vis.textTop
        .transition().delay(1400)
        .text(vis.formatNum(vis.shortTerm.length - vis.illegals.length) + " short-term apartments didn't meet any of these three tests.")
        .call(wrap, vis.width*0.4);

    vis.textBottom
        .transition().delay(1400)
        .text("Those listings are most likely legal.")
        .call(wrap, vis.width*0.4);

    vis.textCenter
        .transition().delay(2100).duration(1400).attr("opacity", 1);

}

customSankey.prototype.Draw8 = function() {
    var vis = this;

    vis.textCenter
        .transition().duration(1400).attr("opacity", 0);

    vis.nextText
        .transition().duration(1400).text("End");

    vis.main.selectAll(".node")
        .transition().duration(1400)
        .attr("opacity", 1);

    vis.main.selectAll(".node-label")
        .transition().duration(1400)
        .attr("opacity", 1);

    vis.legendLabels
        .transition().duration(1400)
        .attr("opacity", 1);

    vis.main.selectAll(".link")
        .transition().duration(1400)
        .attr("stroke-opacity", 0.1);

    vis.textTop
        .transition().delay(1400)
        .text("Combining the results of those three tests gives us " + vis.formatNum(vis.illegals.length) + " illegal listings.")
        .call(wrap, vis.width*0.4);

    vis.textBottom
        .transition().delay(1400)
        .text("They represent " + (vis.illegals.length/vis.dataset.length * 100).toFixed(1) + "% of the original " + vis.formatNum(vis.dataset.length) + " listings.")
        .call(wrap, vis.width*0.4);

    vis.textCenter
        .transition().delay(2100).duration(1400).attr("opacity", 1);

}

customSankey.prototype.DrawLast = function() {
    var vis = this;

    vis.textCenter
        .transition().duration(1400)
        .attr("opacity", 0);

    vis.main.selectAll(".node")
        .transition().duration(1400)
        .attr("opacity", 1);

    vis.main.selectAll(".node-label")
        .transition().duration(1400)
        .attr("opacity", 1);

    vis.legendLabels
        .transition().duration(1400)
        .attr("opacity", 1);

    vis.main.selectAll(".link")
        .transition().duration(1400)
        .attr("stroke-opacity", 0.1);

    vis.nextBtn
        .transition().duration(1400)
        .attr("class", "button-off")
        .attr("opacity", 0);

    vis.skipBtn
        .transition().duration(1400)
        .attr("class", "button-off")
        .attr("opacity", 0);

}

customSankey.prototype.DrawReset = function() {
    var vis = this;

    vis.counter = 1;

    vis.textCenter
        .transition().duration(1400)
        .attr("opacity", 0);

    vis.main.selectAll(".node")
        .transition().duration(1400)
        .attr("opacity", 0);

    vis.main.selectAll(".node-label")
        .transition().duration(1400)
        .attr("opacity", 0);

    vis.legendLabels
        .transition().duration(1400)
        .attr("opacity", 0);

    vis.main.selectAll(".link")
        .transition().duration(1400)
        .attr("stroke-opacity", 0);

    vis.textTop
        .transition().delay(1400)
        .text(vis.startTopText)
        .call(wrap, vis.width*0.4);

    vis.textBottom
        .transition().delay(1400)
        .text(vis.startBottomText)
        .call(wrap, vis.width*0.4);

    vis.textCenter
        .transition().delay(1400).duration(1400)
        .attr("opacity", 1);

    vis.nextBtn
        .transition().duration(1400)
        .attr("class", "button")
        .attr("opacity", 1);

    vis.skipBtn
        .transition().duration(1400)
        .attr("class", "button")
        .attr("opacity", 1);

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


/*Taken from http://bl.ocks.org/mbostock/7555321
 //Wraps SVG text*/
function wrap(text, width) {
    var text = d3.select(this[0][0]),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.4,
        y = text.attr("y"),
        x = text.attr("x"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

    while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        };
    };
};

