
var allData = [],
    taxData = [],
    neighborhoodData = [],
    mapData = [],
    airbnbData = [];

// Variable for the visualization instance
var airbnbMap,
    taxRevenue,
    housingPrices,
    airbnbNodeMap;

// Start application by loading the data
loadData();

// initialize the sankey diagram w dummy data
initializeSankey("#sankey");


function loadData() {

    queue()
        .defer(d3.json, "data/ny-borough.json")
        .defer(d3.json, "data/2014-05-10.json")
        .defer(d3.csv, "data/fy16-nyc-depts.csv")
        .defer(d3.csv, "data/NYC_Neighborhood_Prices_Transposed.csv")
        .await(function(error, data1, data2, data3, data4) {

            if (error) throw error;

            mapData = data1;

            airbnbData = data2;

            allData = data2.slice(0, 101);

            console.log(allData);

            taxData = data3;

            console.log(taxData);

            neighborhoodData = data4;

            console.log(neighborhoodData);

            createVis();
        });

}


function createVis() {

    // INSTANTIATE VISUALIZATIONS
    airbnbNodeMap = new AirBnBNodeMap("airbnb-map", mapData, airbnbData);
    //airbnbMap = new AirBnBMap("airbnb-map", allData, [40.712784, -74.005941]);
    taxRevenue = new TaxRevenue("tax-revenue", taxData);
    housingPrices = new HousingPrices("housing-prices", neighborhoodData);

}