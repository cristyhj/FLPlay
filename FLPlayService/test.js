var pkgInfo = require('./package.json');
var fs = require('fs');
var torrentStream = require('torrent-stream');

var filename = './big.torrent'
var magnet = "magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big%20Buck%20Bunny?file=Big Buck Bunny/Big Buck Bunny.mp4";
var mesg = "mesg";
var stream = null;
var fileSize = 0;
var server = null;
console.log("Start!");

function startStream() {
    try {
        var engine = torrentStream(fs.readFileSync(filename));
        engine.on('ready', function() {
            engine.files.forEach(function(file) {
                console.log('filename:', file.name);
                if (file.name == 'sample-the.big.bang.theory.s12e05.hdtv.x264-sva.mkv') {
                    fileSize = file.length;
                    //file.selectEnd();
                    //file.createReadStream();
                    stream = file;
                    console.log("Stream created!");
                    startServer();
                }
            });
        });
        engine.on('download', function(index) {
            console.log('downloaded: ' + index);
        });
        engine.on('torrent', function () {
            console.log("################## Da");
        })
        mesg = "Stream created successfully";
    } catch (error) {
        console.log(error.message);
        mesg = error.stack;
    }
}

function startServer() {
    try {
        var http = require('http');

        var requestListener = function (req, res) {
            var range = req.headers.range;
            if (range) {
                var chunksize = 1000000; // 1MB
                console.log("Range is: " + range);
                var parts = range.replace('bytes=', "").split("-");
                var start = parseInt(parts[0], 10)
                var end = parts[1] ? parseInt(parts[1], 10) : (start + chunksize);
                if (end > fileSize - 1) {
                    end = fileSize - 1;
                }
                var contentLength = end - start + 1;
                console.log("interval: [" + start + ", " + end + "]");
                var head = {
                    'Content-Range': 'bytes ' + start + '-' + end + '/' + fileSize,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': contentLength,
                    'Content-Type': 'video/x-matroska',
                };
                res.writeHead(206, head);
                try {
                    stream.createReadStream({
                        start: start,
                        end: end
                    }).pipe(res);
                } catch (error) {
                    console.log(error.message);
                    mesg = error.stack;
                }
            } else {
                var head = {
                  'Content-Length': fileSize,
                  'Content-Type': 'video/x-matroska',
                };
                res.writeHead(200, head);
                try {
                    stream.createReadStream().pipe(res);
                } catch (error) {
                    console.log(error.message);
                    mesg = error.stack;
                }
            }
        }

        var server = http.createServer(requestListener);
        server.listen(3232);
        console.log("Server started!");
        mesg = "Server is listening";
    } catch (error) {
        console.log(error.message);
        mesg = error.stack;
    }
}

startStream();
//startServer();