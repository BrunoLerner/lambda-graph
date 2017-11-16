
const express = require("express"),
	bodyParser = require("body-parser");
var app = express();

chartColors = ['rgb(255, 99, 132)', 'rgb(255, 159, 64)','rgb(255, 205, 86)','rgb(75, 192, 192)','rgb(54, 162, 235)','rgb(153, 102, 255)','rgb(201, 203, 207)']

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var server = app.listen(3200, function () {
    console.log("Listening on port %s...", server.address().port);
});

app.post("/graph", function(req, res) {
	var series = [];
	var timespan = [];
	//filling timespan array
	req.body.series[0].datapoints.forEach(timestamp => timespan.push(timestamp[1]));
	
	//getting data for each serie and adding the whole json in an array
	req.body.series.forEach(function(serie){
			var values = [];
			serie.datapoints.forEach(datapoint => values.push(datapoint[0]));
			
			// TODO: automatically assign colors
			series.push(	
				{
					label: serie.name,
					fill: false,
                    backgroundColor: chartColors[Math.floor(Math.random()*8)],
                    borderColor: chartColors[Math.floor(Math.random()*8)],
					data: values
				}
			)

			// this needs to have the same collor if exists
			if (serie.threshold !== null) { 
				var thresholdArray = [];
				thresholdArray.length = values.length
				thresholdArray.fill(serie.threshold);
				series.push(
					{
						label: 'threshold',
						fill: false,
	                    backgroundColor: chartColors[Math.floor(Math.random()*8)],
	                    borderColor: chartColors[Math.floor(Math.random()*8)],
						data: thresholdArray	
					}
				)
			}
		} 	
	);

	//creates the graph
	var service = require('./microservice')(timespan,series)
});



