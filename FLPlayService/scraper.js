var https = require('https')
var DomParser = require('dom-parser')
var events = require('events')

module.exports = Scraper

function Scraper() {
    if (!(this instanceof Scraper)) return new Scraper()
    var scraper = this
    this.validator = ''
    this.engine = new events.EventEmitter()
    this.isDataReady = false
    this.requestedData = null
    this.isLoggedIn = false

    this.engine.on('dataReady', function() {
        scraper.isDataReady = true
    })
}

Scraper.prototype.returnData = function() {
    if (this.isDataReady) {
        return this.requestedData;
    } else {
        return null
    }
}

Scraper.prototype.logIn = function(func, param1, param2) {
    func = func || noop
    param1 = param1 || null
    param2 = param2 || null

    getValidator(this, '/')
    var scraper = this
    
    this.engine.on('validatorReady', function () {
        console.log(scraper.validator)
        postLogIn(scraper, scraper.validator)
    })
    this.engine.on('loggedIn', function () {
        console.log('LoggedIn')
        scraper.isLoggedIn = true;
        func(param1, param2)
    })
}

Scraper.prototype.makeGetRequest = function(url) {
    this.isDataReady = false
    getRequest(this, url)
}

Scraper.prototype.downloadTorrent = function(url, onStreamReadyCallback) {
    downloadTorrentGet(this, url, onStreamReadyCallback)
}

function parseCookie(cookie) {
    var list = []
    for (var i = 0; i < cookie.length; i++) {
        var c = cookie[i].split(';')
        for (var j = 0; j < c.length; j++) {
            var x = c[j]
            if (x.indexOf('deleted') !== -1) {
                break
            }
            if (x.startsWith('PHPSESSID')) {
                list.push(x)
            }
            if (x.startsWith('uid')) {
                list.push(x)
            }
            if (x.startsWith('pass')) {
                list.push(x)
            }
        }
    }
    return list
}

function getValidator(scraper, path) {
    var options = {
        hostname: 'filelist.io',
        port: 443,
        path: path,
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
        }
    }

    var req = https.request(options, function(res) {
        var totalData = '';
        console.log('statusCode: ' + res.statusCode)
        if (res.statusCode == 302) {
            if (res.headers.location) {
                getValidator(scraper, res.headers.location)
            }
        }
      
        res.on('data', function(data) {
            console.log(data)
            totalData += data;
        })
        
        res.on('end', function() {
            if (totalData == '') {
                return
            }
            try {
                if (this.headers['set-cookie']) {
                    scraper.cookie = parseCookie(this.headers['set-cookie'])
                }

                var parser = new DomParser()
                var dom = parser.parseFromString(totalData)
                var els = dom.getElementsByTagName('input')
                for (var i = 0; i < els.length; i++) {
                    var el = els[i]
                    if (el.getAttribute('name') == 'validator') {
                        console.log(el.getAttribute('value'))
                        scraper.validator = el.getAttribute('value')
                        scraper.engine.emit('validatorReady')
                    }
                }
            } catch (error) {
                console.log(error.message)
            }
        })
    })
    
    req.on('error', function(error) {
        console.log(error)
    })

    req.end()

}

function postLogIn(scraper, validator) {
    var data = 'validator=' + validator + '&username=########&password=#######&unlock=1&returnto=%252F'
    var options = {
        hostname: 'filelist.io',
        port: 443,
        path: '/takelogin.php',
        method: 'POST',
        headers: {
            'Referer': 'https://filelist.io/login.php?returnto=/',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
        }
    }
    if (scraper.cookie) {
        var cookieString = ''
        scraper.cookie.forEach(function(c) {
            cookieString += c + '; '
        });
        cookieString = cookieString.substring(0, cookieString.length - 2);
        options.headers['Cookie'] = cookieString
    }

    const req = https.request(options, function (res) {
        var totalData = '';
        console.log('statusCode: ' + res.statusCode)
        
        if (res.headers['set-cookie']) {
            scraper.cookie = scraper.cookie.concat(parseCookie(res.headers['set-cookie']))
        }

        if (res.statusCode == 302) {
            if (res.headers.location) {
                scraper.engine.emit('loggedIn');
            }
        }
      
        res.on('data', function(data) {
            console.log(data)
            totalData += data;
        })
        
        res.on('end', function() {
            try {
                console.log("Ready, must be logged in now")
            } catch (error) {
                console.log(error.message)
            }
        })
    })
    req.on('error', error => {
        console.error(error)
    })
        
    req.write(data)
    req.end()
}

function getRequest(scraper, path) {
    if (!scraper.isLoggedIn) {
        scraper.logIn(getRequest, scraper, path)
        return
    }
    scraper.isDataReady = false
    var options = {
        hostname: 'filelist.io',
        port: 443,
        path: path,
        method: 'GET',
        headers: {
            'Referer': 'https://filelist.io/browse.php',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
        }
    }
    if (scraper.cookie) {
        var cookieString = ''
        scraper.cookie.forEach(function(c) {
            cookieString += c + '; '
        });
        cookieString = cookieString.substring(0, cookieString.length - 2);
        options.headers['Cookie'] = cookieString
    }

    var req = https.request(options, function(res) {
        var totalData = '';
        console.log('statusCode: ' + res.statusCode)
        if (res.statusCode == 302) {
            if (res.headers.location) {
                getRequest(scraper, res.headers.location)
            }
        }

        res.on('data', function(data) {
            console.log(data)
            totalData += data;
        })
        
        res.on('end', function() {
            if (totalData == '') {
                return
            }
            try {
                scraper.requestedData = totalData
                scraper.engine.emit('dataReady')
            } catch (error) {
                console.log(error.message)
            }
        })
    })
    
    req.on('error', function(error) {
        console.log(error)
    })

    req.end()
}

function downloadTorrentGet(scraper, path, streamReadyCallback) {
    if (!scraper.isLoggedIn) {
        scraper.logIn(downloadTorrentGet, scraper, path)
        return
    }
    var options = {
        hostname: 'filelist.io',
        port: 443,
        path: path,
        method: 'GET',
        headers: {
            'Referer': 'https://filelist.io/browse.php',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
        }
    }
    if (scraper.cookie) {
        var cookieString = ''
        scraper.cookie.forEach(function(c) {
            cookieString += c + '; '
        });
        cookieString = cookieString.substring(0, cookieString.length - 2);
        options.headers['Cookie'] = cookieString
    }

    var req = https.request(options, function(res) {
        var bufs = [];
        console.log('statusCode: ' + res.statusCode)
        if (res.statusCode == 302) {
            if (res.headers.location) {
                downloadTorrentGet(scraper, res.headers.location)
            }
        }

        res.on('data', function(data) {
            console.log(data)
            bufs.push(data);
        })
        
        res.on('end', function() {
            if (bufs.len == 0) {
                return
            }
            try {
                var buf = Buffer.concat(bufs);
                streamReadyCallback(buf)
            } catch (error) {
                console.log(error.message)
            }
        })
    })
    
    req.on('error', function(error) {
        console.log(error)
    })

    req.end()
}

function noop() {}