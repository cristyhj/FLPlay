var opensubtitles = null;
try {

    opensubtitles = require('opensubtitles-api');
} catch (error) {
    console.log(error);
}

module.exports = Subtitles

function Subtitles() {
    if (!(this instanceof Subtitles)) return new Subtitles();

    try {
        var OpenSubtitles = new opensubtitles({
            useragent:'Mozilla/5.0 (X11; Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Raspbian Chromium/74.0.3729.157 Chrome/74.0.3729.157 Safari/537.36'
            //username: 'cristyhj',
            //password: 'OpenPassword123.',
        // ssl: true
        });
    } catch (error) {
        console.log(error);
    }

    Subtitles.prototype.search = function(name, callback) {
        try {
            OpenSubtitles.search({
                sublanguageid: 'all',       // Can be an array.join, 'all', or be omitted.
                filename: "jackass forever",        // The video file name. Better if extension
                                            //   is included.
                extensions: ['vtt', 'srt'], // Accepted extensions, defaults to 'srt'.
            }).then(function (subtitles) {
                // an array of objects, no duplicates (ordered by
                // matching + uploader, with total downloads as fallback)
                if (callback) callback(subtitles);
            });
        } catch (error) {
            console.log(error);
            callback(null, error);
        }
    }
}