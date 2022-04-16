

function showLoading() {
    var el = document.getElementById('main-loader');
    el.classList.remove('hidden');
}
function hideLoading() {
    var el = document.getElementById('main-loader');
    el.classList.add('hidden');
}

function showControls() {
    var el = document.getElementById('main-container');
    el.classList.remove('hidden');
}
function hideControls() {
    var el = document.getElementById('main-container');
    el.classList.add('hidden');
}


function showPause() {
    var el = document.getElementById('main-pause');
    el.classList.remove('hidden');
    el.classList.add('anim-fade')
    setTimeout(function () {
        el.classList.add('hidden');
        el.classList.remove('anim-fade');
    }, 1000);
}
function showPlay() {
    var el = document.getElementById('main-play');
    el.classList.remove('hidden');
    el.classList.add('anim-fade')
    setTimeout(function () {
        el.classList.add('hidden');
        el.classList.remove('anim-fade');
    }, 1000);
}

function toggleLog() {
    var el = document.getElementById('log-container');
    if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
}
