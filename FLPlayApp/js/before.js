function displayResponse() {
    webOS.service.request("luna://com.nelson.flplay.service/", {
        method: "hello",
        onFailure: showFailure,
        onSuccess: showSuccess
    });
}
setInterval(displayResponse, 2000);

function scrape() {
    torrents('/browse.php?search=&cat=19&searchin=1&sort=2', createButtons); // ?search=&cat=19&searchin=1&sort=2
}

function torrents(url, callbackOfData) {
    webOS.service.request("luna://com.nelson.flplay.service/", {
        method: "makeGetRequest",
        parameters: { url: url },
        onFailure: showFailure,
        onSuccess: showSuccess
    });
    var tries = 0;
    var interval = setInterval(function () {
        tries++
        if (tries > 50) {
            console.log("Function getData timeout!");
            clearInterval(interval)
            return;
        }
        webOS.service.request("luna://com.nelson.flplay.service/", {
            method: "getData",
            onFailure: showFailure,
            onSuccess: function(res) {
                if (res.mesg == 'Success') {
                    clearInterval(interval)
                    var data = res.data
                    callbackOfData(data);
                }
            }
        });
    }, 500);
}

function startStream(url) {
    console.log('Start stream: ' + url);
    webOS.service.request("luna://com.nelson.flplay.service/", {
        method: "watchTorrent",
        parameters: { url: url },
        onFailure: showFailure,
        onSuccess: showSuccess
    });
    startWatching();
}

function search() {
    showLoading();
    var text = document.getElementById('search-input').value;
    text = text.split(' ').join('+');
    torrents('/browse.php?search=' + text + '&cat=19&searchin=1&sort=2', createButtons);
}

function startWatching() {
    var interval = setInterval(function () {
        webOS.service.request("luna://com.nelson.flplay.service/", {
            method: "isStreamOpen",
            onFailure: showFailure,
            onSuccess: function (res) {
                if (res.mesg == 'yes') {
                    clearInterval(interval);
                    loadVideo(res.subtitleList);
                    console.log(res.subtitleList);
                    hideLoading();
                } else {
                    console.log('Stream is not open!');
                }
            }
        });
    }, 1000);
}

function pDownload() {
    webOS.service.request("luna://com.nelson.flplay.service/", {
        method: "pauseDownload",
        onFailure: showFailure,
        onSuccess: showSuccess
    });
}
function rDownload() {
    webOS.service.request("luna://com.nelson.flplay.service/", {
        method: "resumeDownload",
        onFailure: showFailure,
        onSuccess: showSuccess
    });
}
function httpGet(url)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url);
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            console.log(xmlHttp.responseText);
    }
    xmlHttp.send(null);
    return xmlHttp.responseText;
}

function showSuccess(res) {
    var el = document.getElementById('log-container');
    if (el.classList.contains('hidden')) {
        console.log(res.mesg);
    } else {
        el.innerHTML = res.mesg;
    }
}

function showFailure(err) {
    var el = document.getElementById('log-container');
    if (el.classList.contains('hidden')) {
        console.log(err.mesg);
    } else {
        el.innerHTML = err.mesg;
    }
}

function myLog(mesg) {
    var el = document.getElementById('log-container');
    el.innerHTML += mesg;
}