const bodyParser = require("body-parser"),
	graphService = require('./microservice');

chartColors = ['rgb(255, 205, 86)','rgb(54, 162, 235)']

exports.handler = (event, context, callback) => {
	var response = {},
		content = event.body,
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
	            	color = chartColors[1];
	            }
	            else if (key == 'prevDaySeries'){
	            	seriesName = 'Last Day';
	            	color = chartColors[0];
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
	        var color = chartColors[0];
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
		callback(null,response);
	})
};