
var allData = [],
    taxData = [],
    neighborhoodData = [],
    boroughMap = [],
    neighborhoodMap = [],
    airbnbData = [],
    timelineData;

// Variable for the visualization instance
var taxRevenue,
    housingPrices,
    airbnbNodeMap,
    newestDataset,
    timeline;

// Start application by loading the data
loadData();



function loadData() {

    queue()
        .defer(d3.json, "data/ny-borough.json")
        .defer(d3.json, "data/2014-05-10.json")
        .defer(d3.csv, "data/fy16-nyc-depts.csv")
        .defer(d3.csv, "data/NYC_Neighborhood_Prices_Dummy.csv")
        .defer(d3.json, "data/2016-10-01_with_analyses.json")
        .defer(d3.json, "data/AirBNB-neighbourhoods.geojson")
        .defer(d3.json, "data/ny-neighborhoods.json")
        .defer(d3.csv, "data/timeline.csv")
        .await(function(error, data1, data2, data3, data4, data5, data6, data7, data8) {

            if (error) throw error;

            boroughMap = data1;

            airbnbData = data2;

            allData = data2.slice(0, 101);

            //console.log(allData);

            taxData = data3;

            //console.log(taxData);

            neighborhoodData = data4;

            newestDataset = data5;

            neighborhoodMap = data6;

            timelineData = data8;

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
    housingPrices = new HousingPrices("housing-prices", neighborhoodData);
    timeline = new Timeline("timeline", timelineData);
    illegalSankey = new listingSankey("#sankey2", newestDataset);
    mySankey = new customSankey("#sankey", newestDataset);


}

// update visualization to select filter for node coloring
function dataManipulation() {
    airbnbNodeMap.dataManipulation();
}



// initialize the sankey diagram w dummy data
// initializeSankey("#sankey");