const bodyParser = require("body-parser"),
	graphService = require('./microservice');

chartColors = ['rgb(255, 205, 86)','rgb(54, 162, 235)','rgb(255, 0, 0)','rgba(255, 205, 87, 0.5)','rgba(54, 162, 236,0.5)']

exports.handler = (event, context, callback) => {
	process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'] + '/lib';
	process.env['LD_LIBRARY_PATH'] = process.env['LAMBDA_TASK_ROOT'] + '/lib';
	process.env['PKG_CONFIG_PATH'] = process.env['LAMBDA_TASK_ROOT'] + '/lib';
	var content = event.body,
		promises = [],
		responseBody = {};

	console.log('This is the raw event');
	console.log(event);

	console.log('This is the raw event body');
	console.log(event.body);

	try{
		console.log('This is the event body parsed');
		content = JSON.parse(content);
		console.log('The parsing worked..' + content);
	}catch(e){ 
		console.log(e);
	}
	
	console.log("This is the content inside the alertId: " + content['1998247246']);
	for (var alertId in content) {
		// console.log(alertId)
		// console.log('If we are here, it means that we entered the json loop')
		var series = [],
			timespan = [],
			justOnce = 1,
			payload = content[alertId],
			in_series = payload.series,
			thresholdSize = 0;
	    
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

	            thresholdSize = values.length;   

	            var seriesName = key, 
	            	color = chartColors[0],
	            	backgroundColor = chartColors[3];

	            if (key == 'lastHourSeries'){
	            	seriesName = 'Current';
	            	color = chartColors[1];
	            	backgroundColor = chartColors[4]
	            }
	            else if (key == 'prevDaySeries'){
	            	seriesName = 'Last Day';
	            	color = chartColors[0];
	            	backgroundColor = chartColors[3]
	            }

	            series.push({
	                    label: seriesName,
	                    fill: true,
	                   	backgroundColor: backgroundColor,
	                   	borderColor: color,
	                    data: values
	                });
	            justOnce = 0;
	        }
	    }

	    if (payload.hasOwnProperty('threshold') && payload.threshold !== null){
	        var color = chartColors[2];
	        var thresholdArray = [];
	        thresholdArray.length = thresholdSize;
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
						reject('Could not generate graph');
					}				
				});
			}); 
		}
		//create promisse array of graph
		var promise = createPromisse(timespan, series, annotationPosition, alertId)
		promises.push(promise);
	}

	Promise.all(promises).then(resp => {
		resp.forEach(result => responseBody[result.alertId]=result.url)

		var response = {
	        "statusCode": 200,
	        "headers": {
	            "Content-Type": "application/json"
	        },
	        "body": JSON.stringify(responseBody),
	        "isBase64Encoded": false
	    };
		callback(null,response);
	}).catch(reason => {
		callback(reason)
	});
};