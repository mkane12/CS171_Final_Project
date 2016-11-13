
var allData = [],
    taxData = [];

// Variable for the visualization instance
var airbnbMap,
    taxRevenue,
    housingPrices;

// Start application by loading the data
loadData();


function loadData() {

    queue()
        .defer(d3.json, "data/2014-05-10.json")
        .defer(d3.csv, "data/fy16-nyc-depts.csv")
        .defer(d3.csv, "data/NYC_Neighborhood_Prices_Transposed.csv")
        .await(function(error, data1, data2, data3) {

            if (error) throw error;

            allData = data1.slice(0, 101);

            console.log(allData);

            taxData = data2;

            console.log(taxData);

            neighborhoodData = data3;

            console.log(neighborhoodData);

            createVis();
        });
}


function createVis() {

    // TO-DO: INSTANTIATE VISUALIZATION
    airbnbMap = new AirBnBMap("airbnb-map", allData, [40.712784, -74.005941]);
    taxRevenue = new TaxRevenue("tax-revenue", taxData);
    housingPrices = new HousingPrices("housing-prices", neighborhoodData);

}