
var allData = [],
    taxData = [],
    neighborhoodData = [],
    mapData = [],
    airbnbData = [];

// Variable for the visualization instance
var airbnbMap,
    taxRevenue,
    housingPrices,
    airbnbNodeMap,
    newestDataset;

// Start application by loading the data
loadData();



function loadData() {

    queue()
        .defer(d3.json, "data/ny-borough.json")
        .defer(d3.json, "data/2014-05-10.json")
        .defer(d3.csv, "data/fy16-nyc-depts.csv")
        .defer(d3.csv, "data/NYC_Neighborhood_Prices_Dummy.csv")
        .defer(d3.json, "data/2016-10-01_with_analyses.json")
        .defer(d3.json, "data/ny-neighborhoods.json")
        .await(function(error, data1, data2, data3, data4, data5, data6) {

            if (error) throw error;

            //mapData = data1;
            console.log(data1);

            airbnbData = data2;

            allData = data2.slice(0, 101);

            //console.log(allData);

            taxData = data3;

            //console.log(taxData);

            neighborhoodData = data4;

            newestDataset = data5;

            mapData = data6;

            //console.log(neighborhoodData);

            createVis();
        });

}


function createVis() {

    // INSTANTIATE VISUALIZATIONS
    airbnbNodeMap = new AirBnBNodeMap("airbnb-map", mapData, airbnbData);
    //airbnbMap = new AirBnBMap("airbnb-map", allData, [40.712784, -74.005941]);
    taxRevenue = new TaxRevenue("tax-revenue", taxData);
    housingPrices = new HousingPrices("housing-prices", neighborhoodData);
    illegalSankey = new listingSankey("#sankey2", newestDataset);
    mySankey = new customSankey("#sankey", newestDataset);

    d3.json("data/neighborhoods.json", function(data) {
        console.log(data);

        var NYC = {
            "type": "Feature Collection"
        };

        NYC.features = data.features.filter(function(d) {
            return (~d.properties.CITY.indexOf("New York City"))  ;
        });

        var NYCtext = JSON.stringify(NYC);
 
    });

}



// initialize the sankey diagram w dummy data
// initializeSankey("#sankey");