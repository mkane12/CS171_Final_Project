
var allData = [];

// Variable for the visualization instance
var airbnbMap;

// Start application by loading the data
loadData();


function loadData() {

    // LOAD DATA
    // $.getJSON('data/2014-05-10.json', function(jsonData){
    //
    //     // get first 100 airbnb listings because data is yuge
    //     allData = jsonData.slice(0,101);
    //
    //     //console.log(allData)
    //
    //
    // });

    // Load data parallel
    queue()
        .defer(d3.json, "data/ny-borough.json")
        .defer(d3.json, "data/2014-05-10.json")
        .await(createVis);

}


function createVis(error, mapData, airbnbData) {

    console.log(mapData);

    // INSTANTIATE NODE MAP
    var airbnbNodeMap = new AirBnBNodeMap("airbnb-map", mapData, airbnbData);

    // INSTANTIATE VISUALIZATION
    // var airbnbMap = new AirBnBMap("airbnb-map", allData, [40.712784, -74.005941]);

}