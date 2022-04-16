var pkgInfo = require('./package.json');
var Service = require('webos-service');
var torrentStream = require('torrent-stream');
var fs = require('fs');
var http = require('http');
var MemoryChunkStore = require('memory-chunk-store');
var srt2vtt = require('srt-to-vtt');
var Scraper = require('./scraper');
var matroska = require('matroska-subtitles');

var service = new Service(pkgInfo.name);

var activityManager = service.activityManager;

var filename = null;
var fileData = null;
var engine = null;

var streaming = false;
var subtitleOpen = false;
var subtitleList = [];
var subtitlePort = 3240;

var superviseDownloadInterval = null;
var superviseDownloadFile = null;

var servers = []

var logg = '';
var downloaded = '';


function startStreamBody(torrentFile) {
    try {
        engine = torrentStream(torrentFile, {
            storage: MemoryChunkStore
        });
        engine.on('ready', function() {
            var hasSub = false;
            var filenames4log = ''
            engine.files.forEach(function(file) {
                filenames4log += '[' + file.name + ']'
                console.log('filename: ', file.name);
                if (file.name.endsWith('.mkv')) {
                    console.log("Stream created!");
                    startServer(file);
                }
                if (file.name.endsWith('.mp4')) {
                    console.log("Stream created!");
                    startServer(file);
                }
                if (file.name.endsWith('.ro.srt')) {
                    hasSub = true;
                    startSubtitleServer(file);
                }
                else if (file.name.endsWith('.srt')) {
                    hasSub = true;
                    startSubtitleServer(file);
                }
            });
            logg += filenames4log;
            if (!hasSub) {
                subtitleOpen = true;
            }
        });
        engine.on('download', function(index) {
            downloaded += index + ", ";
        });
    } catch (error) {
        console.log(error.message);
        logg += error.message
    }
}

/* not used anymore after yify subtitles update */
function startSubtitleServer(file) {
    try {
        var fileSize = file.length;
        var stream = file.createReadStreamPrio();
        var requestListener = function (req, res) {
            var head = {
                'Content-Type': 'text/vtt',
                'Content-Encoding': 'ISO-8859-2'
            };
            res.writeHead(200, head);
            try {
                stream.pipe(srt2vtt()).pipe(res);
            } catch (error) {
                console.log(error.message);
                logg += error.message
            }
        }

        var server = http.createServer(requestListener);
        server.listen(subtitlePort);
        servers.push(server)
        subtitleList.push("http://localhost:" + subtitlePort);
        subtitlePort++;
        subtitleOpen = true;

    } catch (error) {
        console.log(error.message);
        logg += error.message
    }
}

function startMatroskaSubtitleServer(imdbid) {
    try {
        var fileSize = '';
        
     
        var requestListener = function (req, res) {
            var head = {
                'Content-Type': 'text/vtt',
                'Content-Encoding': 'ISO-8859-2'
            };
            res.writeHead(200, head);
            try {
                stream.pipe(res);
            } catch (error) {
                console.log(error.message);
                logg += error.message
            }
        }

        var server = http.createServer(requestListener);
        server.listen(subtitlePort);
        servers.push(server)
        subtitleList.push("http://localhost:" + subtitlePort);
        subtitlePort++;
        subtitleOpen = true;

    } catch (error) {
        console.log(error.message);
        logg += error.message
    }
}

function startServer(file, isMkv) {
    var fileSize = file.length;
    try {
        var requestListener = function (req, res) {
            var range = req.headers.range;
            logg += '(' + range + ')';
            var chunksize = 1000000; // 1MB
            
            console.log("Range is: " + range);
            var parts = range.replace('bytes=', "").split("-");
            var start = parseInt(parts[0], 10);
            var end = parts[1] ? parseInt(parts[1], 10) : (fileSize - 1);
            var contentLength = end - start + 1;
            console.log("interval: [" + start + ", " + end + "]");
            logg += "(interval: [" + start + ", " + end + "])";
            var head = {
                'Content-Range': 'bytes ' + start + '-' + end + '/' + fileSize,
                'Accept-Ranges': 'bytes',
                'Content-Length': contentLength,
                'Content-Type': 'video/webm',
            };
            res.writeHead(206, head);
            try {
                engine.clearSelection();
                engine.store.clearSelection(file.offsetPiece, file.endPiece);
                var stream = file.createReadStream({
                    start: start,
                    end: end
                });
                engine.emit('resumeDownload');
                file.selectChunkAt(start);
                
                if (isMkv) {
                    stream.pipe(matroska());
                }
                stream.pipe(res);

                if (superviseDownloadInterval) {
                    console.log("Supervise interval started");
                } else {
                    superviseDownloadInterval = setInterval(superviseDownload, 2000);
                    superviseDownloadFile = file;
                }
            } catch (error) {
                console.log(error.message);
                logg += error.message
            }
        }

        var server = http.createServer(requestListener);
        server.listen(3232);
        servers.push(server)
        streaming = true;

        console.log("Server is listening");
    } catch (error) {
        console.log(error.message);
        logg += error.message
    }
}

service.register("startStream", function(message) {
    if (message.payload && message.payload.fileData) {
        fileData = message.payload.fileData;
        //activityManager.create("downloader", startStream);
        startStreamBody()
    } else {
        message.respond({
            returnValue: true,
            mesg: "Set filename parameter!"
        });
    }
});

service.register("hello", function(message) {
    if (message.payload && message.payload.filename) {
        filename = message.payload.filename;
    }
    try {
        if (engine) {
            message.respond({
                returnValue: true,
                mesg: 'Memory: ' + engine.store.memory() + 
                    '\nPieces: ' + engine.store.getPiecesString() + 
                    '\nSelections: ' + engine.getSelectionsString() + 
                    '\nOldSelections: ' + engine.getOldSelectionsString() + 
                    '\nLogg: ' + logg + 
                    '\nDownloaded: ' + downloaded
            });
        } else {
            message.respond({
                returnValue: true,
                mesg: 'Engine not loaded: ' + 
                      '\nLogg: ' + logg
            });
        }
    } catch (error) {
        console.log(error.message);
        logg += error.message
        message.respond({
            returnValue: true,
            mesg: 'Engine not loaded: ' + 
                  '\nLogg: ' + logg
        });
    }
});

service.register("pauseDownload", function(message) {
    try {
        engine.emit('pauseDownload');
    } catch (error) {
        console.log(error.message);
        logg += error.message
    }
});
service.register("resumeDownload", function(message) {
    try {
        engine.emit('resumeDownload');
    } catch (error) {
        console.log(error.message);
        logg += error.message
    }
});

service.register("isStreamOpen", function(message) {
    try {
        if (streaming && subtitleOpen) {
            message.respond({
                returnValue: true,
                subtitleList: subtitleList,
                mesg: 'yes'
            });
        } else {
            message.respond({
                returnValue: true,
                mesg: 'no'
            });
        }
    } catch (error) {
        message.respond({
            returnValue: false,
            mesg: 'no'
        });
    }
});


/* Functions for saving RAM memory
 * when using createReadStream
 */
var lastMostImportatPiece = null;
function superviseDownload() {
    var mem = engine.store.memory();
    var mostImportatPiece = engine.store.getLastGetIndex();
    if (superviseDownloadFile) {
        if (mostImportatPiece != lastMostImportatPiece) {
            superviseDownloadFile.deselectChunk(lastMostImportatPiece)
            superviseDownloadFile.selectChunk(mostImportatPiece)
            lastMostImportatPiece = mostImportatPiece
        }
    }
    if (engine.downloadPaused) {
        if (mem <= 10) {
            engine.emit('resumeDownload');
        }
    } else {
        if (mem >= 15) {
            engine.emit('pauseDownload');
        }
    }
}

/*
 * Scraper methods
 */
var scraper = null
function startScraper() {
    scraper = scraper || new Scraper();
}

service.register("startScraper", function(message) {
    try {
        startScraper();
        //activityManager.create("scraper", startScraper);
        message.respond({
            returnValue: true,
            subtitleList: subtitleList,
            mesg: 'Success'
        });
        
    } catch (error) {
        message.respond({
            returnValue: false,
            mesg: error.message
        });
    }
});

service.register("getData", function(message) {
    try {
        startScraper();
        var data = scraper.returnData()
        if (data) {
            message.respond({
                returnValue: true,
                mesg: 'Success',
                data: data
            });
        } else {
            throw Error('Data in empty or not ready!');
        }
        
    } catch (error) {
        message.respond({
            returnValue: false,
            mesg: error.message
        });
    }
});

service.register("makeGetRequest", function(message) {
    try {
        startScraper();
        if (message.payload && message.payload.url) {
            var url = message.payload.url;
            scraper.makeGetRequest(url)
        } else {
            throw Error('Url not present!')
        }
        message.respond({
            returnValue: true,
            mesg: 'Success',
        });
        
    } catch (error) {
        message.respond({
            returnValue: false,
            mesg: error.message
        });
    }
});

service.register("watchTorrent", function(message) {
    try {
        startScraper();
        if (message.payload && message.payload.url) {
            var url = message.payload.url;
            scraper.downloadTorrent(url, startStreamBody)
        } else {
            throw Error('Url not present!')
        }
        //if (message.payload && message.payload.imdbid) {
            //var imdbid = message.payload.imdbid;
            startYifySubtitleServer('tt10334438');
        //} else {
            //throw Error('Url not present!')
        //}
        message.respond({
            returnValue: true,
            mesg: 'Success',
        });
        
    } catch (error) {
        message.respond({
            returnValue: false,
            mesg: error.message
        });
    }
});

service.register("startCleanUp", function(message) {
    try {
        for (var i = 0; i < servers.length; i++) {
            servers[i].close();
            servers[i] = null;
        }
        filename = null;
        fileData = null;

        engine.destroy();
        engine = null;
        
        streaming = false;
        subtitleOpen = false;
        subtitleList = [];
        subtitlePort = 3240;
        
        clearInterval(superviseDownloadInterval);
        superviseDownloadInterval = null;
        superviseDownloadFile = null;
        
        servers = []
        
        logg = '';
        downloaded = '';

        message.respond({
            returnValue: true,
            mesg: 'Clean Up Success',
        });
        
    } catch (error) {
        message.respond({
            returnValue: false,
            mesg: error.message
        });
    }
});

