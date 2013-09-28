// This example streams the video to a browser with an mjpeg stream
var fs = require("fs"),
    client = require('../../lib/car'),
    http = require('http');
    positions = [];

client.discover()
    .then(function(serialNumber) {
        console.log("Discoverd", serialNumber);
        return client.connect(serialNumber);
    }).then(function() {
        console.log("Enabling"); return client.enable();
    }).then(function() {
        console.log("Yay! start work");

        var streams = [];

        var counter = 0,
            updateCarPosition = function (position) {
               if (counter === 0) {
                   // Forward
                   client.move(.2);
               }
               if (counter > 2) {
                   // Stop
                   client.move(0);
               }
               counter += 1;
           };


        var server = http.createServer(function(req, res) {
            if (req.url == '/stream') {

                var boundary = 'pancakes';

                res.writeHead(200, {
                    'Content-Type': 'multipart/x-mixed-replace; boundary='+boundary,
                    'Expires': 'Fri, 01 Jan 1990 00:00:00 GMT',
                    'Cache-Control': 'no-cache, no-store, max-age=0',
                    'Pragma': 'no-cache'
                });

                // Adds a function to stream data to this request
                var index = streams.length;
                streams.push(function(data) {
                    res.write('--'+boundary+'\nContent-Type: image/jpeg\nContent-length: ' + data.image.length + '\n\n');
                    res.write(data.image);
                });

                //Removes the function when the request is closed
                req.on("close", function(err) {
                    streams.splice(index, 1);
                });
            } else if (req.url == "/phone/") {
                fs.createReadStream("phone.html").pipe(res);
            } else if (req.url == "/jquery-2.0.3.js") {
                fs.createReadStream("jquery-2.0.3.js").pipe(res);
            } else if (req.url == "/phone/script.js") {
                fs.createReadStream("phone-script.js").pipe(res);
            } else if (req.url == "/updatePosition") {
                console.log("Position recieved");
                var body = '';
                req.on('data', function (data) {
                    body += data;
                });
                req.on('end', function () {
                    console.log(body);
                    var position = JSON.parse(body);
                    positions.push(position);
                    
                    updateCarPosition(position);
                    //var POST = qs.parse(body);
                });

                res.write('OK');
                res.end();
            } else {
                // You can access this stream directly from http://localhost:8000/stream
                // ...but you get horrible memory leaks
                res.write('<!doctype html><image src="/stream">');
                res.end();
            }

        });

        server.listen(8000);

        // Sends camera stream to each request
        client.startCamera(0, function(data) {
            for (var i = 0; i < streams.length; i++) {
                if (streams[i]) streams[i](data);
            }
        });
    });
