
const express = require("express"),
	bodyParser = require("body-parser");
var app = express();

chartColors = ['rgb(255, 99, 132)', 'rgb(255, 159, 64)','rgb(255, 205, 86)','rgb(75, 192, 192)','rgb(54, 162, 235)','rgb(153, 102, 255)']

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var server = app.listen(3200, function () {
    console.log("Listening on port %s...", server.address().port);
});

app.post("/graph", function(req, res) {
	var series = [];
	var timespan = [];
	var justOnce = 1;
	
 	var payload = JSON.parse(req.body.payload);
    var in_series = payload.series;
    
    for (var key in in_series){
        if (in_series.hasOwnProperty(key)){
            var values = []
            for (var innerkey in in_series[key]){
                if (in_series[key].hasOwnProperty(innerkey)) {
                    if (justOnce == 1){
                        timespan.push(innerkey);
                    }
                    values.push(in_series[key][innerkey]);
                }
            }    

            var color = chartColors[Math.floor(Math.random()*8)];
            series.push(    
                {
                    label: key,
                    fill: false,
                   	backgroundColor: color,
                   	borderColor: color,
                    data: values
                }
            )
            justOnce = 0;
        }
    }

    if (payload.hasOwnProperty('threshold') && payload.threshold !== null){
        var color = chartColors[Math.floor(Math.random()*8)];
        var thresholdArray = [];
        thresholdArray.length = values.length
        thresholdArray.fill(series.threshold);
        series.push(
            {
                label: 'threshold',
                fill: false,
               	backgroundColor: color,
               	borderColor: color,
                data: thresholdArray    
            }
        )
    }

    var annotationPosition = {}
    annotationPosition['peakPoint'] = timespan.findIndex(function(element){ return element == payload.peakPoint})
    annotationPosition['dataset'] = series.findIndex(function(element){ return element.label == 'current'})
    console.log(timespan)
    console.log(annotationIndex)
    console.log(series)
	

	// // filling timespan array
	// req.body.series[0].datapoints.forEach(timestamp => timespan.push(timestamp[1]));
	
	// //getting data for each serie and adding the whole json in an array
	// req.body.series.forEach(function(serie){
	// 		var values = [];
	// 		serie.datapoints.forEach(datapoint => values.push(datapoint[0]));
			
	// 		var color = chartColors[Math.floor(Math.random()*6)];
	// 		series.push(	
	// 			{
	// 				label: serie.name,
	// 				fill: false,
 //                    backgroundColor: color,
 //                    borderColor: color,
	// 				data: values
	// 			}
	// 		)

	// 		// this needs to have the same collor if exists
	// 		if (serie.threshold !== null) {
	// 			color = chartColors[Math.floor(Math.random()*6)];
	// 			var thresholdArray = [];
	// 			thresholdArray.length = values.length
	// 			thresholdArray.fill(serie.threshold);
	// 			series.push(
	// 				{
	// 					label: 'threshold',
	// 					fill: false,
	//                     backgroundColor: color,
	//                     borderColor: color,
	// 					data: thresholdArray	
	// 				}
	// 			)
	// 		}
	// 	} 	
	// );


	//creates the graph
	var service = require('./microservice')(timespan,series,annotationPosition)

});



