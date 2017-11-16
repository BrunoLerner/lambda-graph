const ChartjsNode = require('chartjs-node'),
    AWS = require('aws-sdk');

var s3 = new AWS.S3();

// 600x600 canvas size
var chartNode = new ChartjsNode(600, 600);

var myChartOptions = {
    responsive: true,
    title:{
        display:true,
        text:'Chart.js Line Chart'
    },
    tooltips: {
        mode: 'index',
        intersect: false,
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
    },
    plugins: {
        afterDraw: function (chart, easing) {
            var self = chart.config;    /* Configuration object containing type, data, options */
            var ctx = chart.chart.ctx;  /* Canvas context used to draw with */
            ctx.fillStyle = "black";
            // ctx.fillRect(0, 0, chart.chart.width, chart.chart.height);
        }
    }
}   


var createGraph = function(timespan, series){
    var chartJsOptions = {
        type: 'line',
        data:{
            labels : timespan,
            datasets: series
        },
        options: myChartOptions
    }

    return chartNode.drawChart(chartJsOptions)
    .then(() => {
        // chart is created
        console.log('chart created')
        
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

        var params = {Bucket: 'loom-images',Key:'test.png', Body: streamResult.stream};
        // s3.upload(params, function(err, data) {
        //     console.log(err, data);
        //  });
        // write to a file
        return chartNode.writeImageToFile('image/png', './testimage.png');
    })
    .then(() => {
        // chart is now written to the file path
        // ./testimage.png
    });    
}

module.exports = createGraph;
