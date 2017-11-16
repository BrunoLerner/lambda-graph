const ChartjsNode = require('chartjs-node'),
    AWS = require('aws-sdk');

var s3 = new AWS.S3();

// 600x600 canvas size
var chartNode = new ChartjsNode(600, 600);

var myChartOptions = {
    responsive: true,
    title:{
        display:true,
        text:'Loom\'s Alert'
    },
    tooltips: {
        mode: 'index',
        intersect: false,
        position:''
    },
    hover: {
        mode: 'nearest',
        intersect: true
    },
    scales: {
        xAxes: [{
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


var createGraph = function(timespan, series){
    var chartJsOptions = {
        type: 'line',
        data:{
            labels : timespan,
            datasets: series
        },
        options: myChartOptions,
        plugins:{
            beforeDraw: function (chart, easing) {
                var self = chart.config;    /* Configuration object containing type, data, options */
                var ctx = chart.chart.ctx;  /* Canvas context used to draw with */
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, chart.chart.width, chart.chart.height);
                if (chart.tooltip._active == undefined) {
                    chart.tooltip._active = [];
                }
                var activeElements = chart.tooltip._active;
                var requestedElem = chart.getDatasetMeta(0).data[3];
                for(var i = 0; i < activeElements.length; i++) {
                    if(requestedElem._index == activeElements[i]._index)  
                       return;
                }
                activeElements.push(requestedElem);
                chart.tooltip._active = activeElements;
            },
            afterDraw: function (chart, easing) {
                console.log(chart.tooltips)
                var ctx = chart.chart.ctx;  /* Canvas context used to draw with */
                if (chart.tooltip._active == undefined) {
                    chart.tooltip._active = [];
                }
                var activeElements = chart.tooltip._active;
                var requestedElem = chart.getDatasetMeta(0).data[3];
                for(var i = 0; i < activeElements.length; i++) {
                    if(requestedElem._index == activeElements[i]._index)  
                       return;
                }
                activeElements.push(requestedElem);
                console.log(activeElements)
                chart.tooltip._active = activeElements;
                chart.tooltips.update(true);
                chart.draw();
            }
        }    
    }

    return chartNode.drawChart(chartJsOptions)
    .then(() => {
        // chart is created
        console.log('chart created')
        // chartNode.addHitRegion()
        // get image as png buffer
        return chartNode.getImageBuffer('image/png');
    })
    .then(buffer => {
        Array.isArray(buffer) // => true
        // as a stream
        return chartNode.getImageStream('image/png');
    })
    .then(streamResult => {
        // using the length property you can do things like
        // directly upload the image to s3 by using the
        // stream and length properties
        streamResult.stream // => Stream object
        streamResult.length // => Integer length of stream

        var params = {Bucket: 'loom-images',Key: generateFileName(), Body: streamResult.stream};
        // return s3.upload(params, function(err, data) {
        //     console.log(err, data);
        //  });
        // write to a file
        return chartNode.writeImageToFile('image/png', './testimage.png');
    })
    .then((s3Result) => {
        console.log(s3Result)
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
