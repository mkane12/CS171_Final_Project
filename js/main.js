
var allData = [];

// Variable for the visualization instance
var airbnbMap;

// Start application by loading the data
loadData();


function loadData() {

    // LOAD DATA
    $.getJSON('data/2014-05-10.json', function(jsonData){

        // extract array of stations
        allData = jsonData.slice(0,101);

        console.log(allData)

        createVis();

    });

}


function createVis() {

    // TO-DO: INSTANTIATE VISUALIZATION
    var airbnbMap = new AirBnBMap("airbnb-map", allData, [40.712784, -74.005941]);

}