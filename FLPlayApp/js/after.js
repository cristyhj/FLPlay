
function loadVideo(subtitleList) {
    var t = '<video id="main-video" width="100%" height="100%" controls autoplay>';
    t += '<source src="http://localhost:3232" type="video/webm"/>';
    subtitleList.forEach(sub => {
        t += '<track kind="subtitles" srclang="ro" src="' + sub + '" default/>';
    });
    t += '</video>';
    var el = document.getElementById('video-container');
    el.innerHTML = t;
    hideControls();
}

function loadVideo_backup(subtitleList) {
    var t = '<video id="my-video" autoplay class="video-js" controls preload="auto" width="100%" height="100%" data-setup="{}">';
    t += '<source src="http://localhost:3232" type="video/webm"/>';
    t += '</video>';
    var el = document.getElementById('video-container');
    el.innerHTML = t;
    hideControls();
}
/*function loadVideo_test(subtitleList) {
    var newPlayer = new SubPlayerJS('#video-container', 'http://localhost:3232');
    var da = true;
    subtitleList.forEach(sub => {
        if (da) {
            newPlayer.setSubtitle(sub); 
        }
        da = false;
    });

    hideControls();
}*/

function playVideo() {
    var el = document.getElementById('main-video');
    el.play();
}

function seekVideo(time) {
    var el = document.getElementById('main-video');
    console.log(el.currentTime)
    el.currentTime = el.currentTime + time
    console.log(el.currentTime)
}

function getVideo() {
    var el = document.getElementById('main-video');
    return el;
}

function pauseVideo() {
    var el = document.getElementById('main-video');
    el.pause();
}

function getListOfTorrents(data) {
    var parser = new DOMParser()
    var dom = parser.parseFromString(data, 'text/html')
    var list = []

    var els = dom.getElementsByClassName('torrentrow')
    for (var i = 0; i < els.length; i++) {
        var el = els[i]
        var as = el.getElementsByTagName('a')
        var title = ''
        var downloadUrl = ''
        for (var j = 0; j < as.length; j++) {
            var a = as[j]
            if (downloadUrl == '') {
                if (a.getAttribute('href').startsWith('download.php')) {
                    downloadUrl = a.getAttribute('href')
                }
            }
            if (title == '') {
                if (a.getAttribute('href').startsWith('details.php')) {
                    title = a.getAttribute('title')
                }
            }
        }

        var spans = el.getElementsByTagName('span')
        var imgUrl = ''
        for (var j = 0; j < spans.length; j++) {
            var span = spans[j]
            if (imgUrl == '') {
                var attr = span.getAttribute('title')
                if (attr) {
                    if (attr.startsWith('<img')) {
                        imgUrl = attr
                        imgUrl = imgUrl.replace('<img src=\'', '')
                        imgUrl = imgUrl.replace('\'>', '')
                        console.log(imgUrl)
                    }
                }
            }
        }

        list.push({
            title: title,
            downloadUrl: downloadUrl,
            imgUrl: imgUrl
        })
    }
    return list
}

function createButtons(data) {
    var list = getListOfTorrents(data)
    var el = document.getElementById('button-container');
    var elemsHtml = '';
    var nrElements = 0;
    list.forEach(function(movie) {
        if (nrElements <= 24) {
            elemsHtml += '<button class="menu-item card m-10" onclick="';
            elemsHtml += 'startStream(\'/' + movie.downloadUrl + '\')" >';
            elemsHtml += '<img src="' + movie.imgUrl + '">';
            elemsHtml += '<div class="card-bottom">';
            elemsHtml += movie.title.split('.').join(' ');
            elemsHtml += '</div>';
            elemsHtml += '</button>';
        }
        nrElements++;
    })
    el.innerHTML = elemsHtml;
    initControls();
}

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        startCleanUp();
        myLog("(Start startCleanUp)");
    } else {
        startUpApp();
        myLog("(Start startUpApp)");
    }
}, true);

function startUpApp() {
    showLoading();
    setTimeout(function() {
        scrape();
    }, 10000);
}

function startCleanUp() {
    webOS.service.request("luna://com.nelson.flplay.service/", {
        method: "startCleanUp",
        onFailure: showFailure,
        onSuccess: showSuccess
    });
}