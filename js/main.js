
var allData = [],
    taxData = [],
    neighborhood_dict = {},
    boroughMap = [],
    neighborhoodMap = [],
    airbnbData = [],
    timelineData;

// Variable for the visualization instance
var taxRevenue,
    housingPrices,
    airbnbNodeMap,
    newestDataset,
    timeline,
    neighborhoodrent;

// Start application by loading the data
loadData();



function loadData() {

    queue()
        .defer(d3.json, "data/ny-borough.json")
        .defer(d3.json, "data/2014-05-10.json")
        .defer(d3.csv, "data/fy16-nyc-depts-stacked.csv")
        .defer(d3.csv, "data/neighborhood-lines/housing_prices_by_neighborhood.csv")
        .defer(d3.csv, "data/neighborhood-lines/percent_change_by_neighborhood.csv")
        .defer(d3.json, "data/2016-10-01_with_analyses.json")
        .defer(d3.json, "data/AirBNB-neighbourhoods.geojson")
        .defer(d3.json, "data/ny-neighborhoods.json")
        .defer(d3.csv, "data/timeline.csv")
        .defer(d3.csv, "data/neighborhood-lines/neighborhood_info.csv")
        .await(function(error, data1, data2, data3, NRentPrice, NRentChange, data5, data6, data7, data8, data9) {

            if (error) throw error;

            boroughMap = data1;

            airbnbData = data2;

            allData = data2.slice(0, 101);

            //console.log(allData);

            taxData = data3;

            //console.log(taxData);

            neighborhoodRentPrice = NRentPrice;
            neighborhoodRentChange = NRentChange;

            newestDataset = data5;

            neighborhoodMap = data6;

            timelineData = data8;

            neighborhoodInfo = data9;
            for (i = 0; i < neighborhoodInfo.length; i++) {
                neighborhoodInfo[i].number_of_posts = +neighborhoodInfo[i].number_of_posts;
                neighborhoodInfo[i].number_of_illegal_posts = +neighborhoodInfo[i].number_of_illegal_posts;
                neighborhoodInfo[i].percent_illegal = +neighborhoodInfo[i].percent_illegal;
                neighborhoodInfo[i].proportion_of_posts = +neighborhoodInfo[i].proportion_of_posts
                neighborhoodInfo[i].proportion_of_illegal_posts = +neighborhoodInfo[i].proportion_of_illegal_posts
                neighborhood_dict[neighborhoodInfo[i].neighborhood] = neighborhoodInfo[i]
            }

            // print number of listings to listing-count
            $("#listing-count").text(airbnbData.length);

            createVis();
        });

}


function createVis() {

    // INSTANTIATE VISUALIZATIONS
    airbnbNodeMap = new AirBnBNodeMap("airbnb-map", boroughMap, neighborhoodMap, airbnbData);
    //airbnbMap = new AirBnBMap("airbnb-map", allData, [40.712784, -74.005941]);
    taxRevenue = new TaxRevenue("tax-revenue", taxData);
    
    timeline = new Timeline("timeline", timelineData);

    // HAD TO COMMENT OUT ILLEGAL SANKEY BC IT WAS THROWING ERRORS
    //illegalSankey = new listingSankey("#sankey2", newestDataset);

    mySankey = new customSankey("#sankey", newestDataset);

    neighborhoodrent = new NeighborhoodLine("neighborhood-line-chart-area", neighborhoodRentPrice, neighborhoodRentChange, neighborhood_dict);
    $(function () {
        $("#neighborhood-line-selected-borough").change(function () { 
            neighborhoodrent.wrangleData();
        });
    });
    $(function () {
        $("#neighborhood-line-data-type").change(function () { 
            neighborhoodrent.wrangleData();
        });
    });


}

// update visualization to select filter for node coloring
function dataManipulation() {
    airbnbNodeMap.dataManipulation();
}

// update airbnb node map to zoom into borough
function zoom() {
    airbnbNodeMap.zoom();
}



// initialize the sankey diagram w dummy data
// initializeSankey("#sankey");