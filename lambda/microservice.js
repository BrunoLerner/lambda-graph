const ChartjsNode = require('chartjs-node'),
    AWS = require('aws-sdk');

var s3 = new AWS.S3();
var myChartOptions = {
    elements:{ point: { radius: 0 } },
    responsive: true,
    title:{
        display:false
    },
    tooltips: {
        mode: 'index',
        intersect: false,
        bodyFontSize: 0,
        titleMarginBottom:1,
        xPadding: 8,
        yPadding:10
    },
    hover: {
        mode: 'nearest',
        intersect: true
    },
    scales: {
        xAxes: [{
            type:'time',
            time: {
                unit: 'minute',
                displayFormats: {
                    minute: 'h:mm a'
                }
            },
            ticks: {
                source: 'labels'
            },
            display: true,
            scaleLabel: {
                display: true,
                labelString: 'Time'
            }
        }],
        yAxes: [{
            display: true,
            scaleLabel: {
                display: true,
                labelString: 'Value'
            }
        }]
    } 
}   


var createGraph = function(timespan, series, annotationPosition, callback) {
    // console.log('And if we are here, it means that the graph service was called')
    var chartJsOptions = {
        type: 'line',
        data:{
            labels : timespan,
            datasets: series
        },
        options: myChartOptions,
        plugins:{

            //draws the background
            beforeDraw: function (chart, easing) {
                var self = chart.config;    /* Configuration object containing type, data, options */
                var ctx = chart.chart.ctx;  /* Canvas context used to draw with */
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, chart.chart.width, chart.chart.height);
            },

            //active the tooltip
            afterDraw: function (chart, easing) {
                if (chart.tooltip._active == undefined) {
                    chart.tooltip._active = [];
                }
                var activeElements = chart.tooltip._active;
                var requestedElem = chart.getDatasetMeta(annotationPosition.dataset).data[annotationPosition.peakPoint];
                for(var i = 0; i < activeElements.length; i++) {
                    if(requestedElem._index == activeElements[i]._index)  
                       return;
                }
                activeElements.push(requestedElem);
                chart.tooltip._active = activeElements;
                chart.tooltip.update(true);
                chart.draw();
            }
        }    
    }

    var chartNode = new ChartjsNode(400, 250);
    return chartNode.drawChart(chartJsOptions)
        .then(() => {
            console.log('chart created')
    
            // get image as png buffer
            return chartNode.getImageBuffer('image/png');
        })
        .then(buffer => {
            Array.isArray(buffer) 
            return chartNode.getImageStream('image/png');
        })
        .then(streamResult => {
            var params = {Bucket: 'loom-images',Key: generateFileName(), Body: streamResult.stream, ContentType:'image/png'};
            return s3.upload(params, function(err, data) {
                if (err !== null){
                    console.log(err);
                }
                var url = data.Location;
                callback(url);
            });
            // write to a file
            // return chartNode.writeImageToFile('image/png', './testimage.png');
        });
}

function generateFileName() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text + '.png';
}

module.exports = createGraph;

