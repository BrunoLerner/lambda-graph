const express = require("express"),
	bodyParser = require("body-parser"),
	graphService = require('./microservice');

var app = express();

chartColors = ['rgb(255, 99, 132)', 'rgb(255, 159, 64)','rgb(255, 205, 86)','rgb(75, 192, 192)','rgb(54, 162, 235)','rgb(153, 102, 255)']

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var server = app.listen(3200, function () {
    console.log("Listening on port %s...", server.address().port);
});

app.post("/graph", function(req, res) {
	var response = {},
		content = req.body,
		promises = [];

	for (var alertId in content) {
		var series = [],
			timespan = [],
			justOnce = 1,
			payload = content[alertId],
			in_series = payload.series;
	    
	    for (var key in in_series){
	        if (in_series.hasOwnProperty(key)){
	            var values = [];
	            for (var innerkey in in_series[key]){
	                if (in_series[key].hasOwnProperty(innerkey)) {
	                    if (justOnce == 1){
	                        timespan.push(innerkey);
						}
						values.push(in_series[key][innerkey]);
	                }
	            }    

	            var seriesName = key, 
	            	color = chartColors[0];

	            if (key == 'lastHourSeries'){
	            	seriesName = 'Current';
	            	color = chartColors[2];
	            }
	            else if (key == 'prevDaySeries'){
	            	seriesName = 'Last Day';
	            	color = chartColors[1];
	            }

	            series.push({
	                    label: seriesName,
	                    fill: false,
	                   	backgroundColor: color,
	                   	borderColor: color,
	                    data: values
	                });
	            justOnce = 0;
	        }
	    }

	    if (payload.hasOwnProperty('threshold') && payload.threshold !== null){
	        var color = chartColors[Math.floor(Math.random()*6)];
	        var thresholdArray = [];
	        thresholdArray.length = 61
	        thresholdArray.fill(payload.threshold);
	        series.push(
	            {
	                label: 'threshold',
	                fill: false,
	               	backgroundColor: color,
	               	borderColor: color,
	               	borderWidth: 1,
	                data: thresholdArray    
	            }
	        )
	    }

	    var annotationPosition = {}
	    annotationPosition['peakPoint'] = timespan.findIndex(function(element){ return element == payload.detectionTime})
	    annotationPosition['dataset'] = series.findIndex(function(element){ return element.label == 'Current'})
	    
	    //timespan is in seconds
	    timespan = timespan.map(x => x*1000);
		
		function createPromisse(xAxis, data, position, Id) {
			return new Promise(function (resolve, reject) {
				graphService(xAxis, data, position, function (innerRes, innerErr) {
					if (innerRes !== null) {
						resolve({
							url: innerRes,
							alertId: Id
						});
					} else {
						reject();
					}				
				});
			}); 
		}
		//create promisse array of graph
		var promise = createPromisse(timespan, series, annotationPosition, alertId)
		promises.push(promise);
	}

	Promise.all(promises).then(function (resp, err) {
		resp.forEach(result => response[result.alertId]=result.url)
		res.send(response);
	})
});