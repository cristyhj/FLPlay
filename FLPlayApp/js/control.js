var list = null;
var indexSelected = 0;
var selected = null;
var menu = null;

function initControls() {
    list = document.getElementsByClassName('menu-item');
    indexSelected = 0;
    selected = list[indexSelected];
    menu = 'main';
    selected.classList.add('menu-item-selected');
    hideLoading();
}

document.addEventListener("keydown", function(inEvent){
    console.log('Key Pressed: ' + inEvent.keyCode);
    loseFocus();

    var keycode;
    if(window.event) {
        keycode = inEvent.keyCode;
    } else if(e.which) {
        keycode = inEvent.which;
    }
    if (keycode == 53) {
        toggleLog()
    }
    if (keycode == 57) {
        scrape()
    }
    if (menu == 'main') {
        switch (keycode) {
            case 37: doPrev(); break; 
            case 38: doPrev(); break;
            case 39: doNext(); break;
            case 40: doNext(); break; 
            case 13: doEnter(); break; 
            default: break;
        }
    }
    else if (menu == 'video') {
        switch (keycode) {
            case 13: doPausePlay(); break; 
            case 461: doExit(); break;
            default: break;
        }
    }
});

function doEnter() {
    if (selected.tagName == "INPUT") {
        selected.focus();
    } else if (selected.tagName == "BUTTON") {
        selected.click();
        menu = 'video';
        showLoading();
    }
}

function doExit() {
    if (menu == 'video') {
        menu = 'main';
        destroyVideo();
        showControls();
        startCleanUp();
    }
}

function doNext() {
    if ((indexSelected + 1) >= list.length) {
        return;
    }
    selected.classList.remove('menu-item-selected');
    indexSelected++;
    selected = list[indexSelected];
    selected.classList.add('menu-item-selected');
}

function doPrev() {
    if ((indexSelected - 1) < 0) {
        return;
    }
    selected.classList.remove('menu-item-selected');
    indexSelected--;
    selected = list[indexSelected];
    selected.classList.add('menu-item-selected');
}

function doPausePlay() {
    var el = getVideo();
    if (el.paused) {
        el.play();
        showPlay();
    } else {
        el.pause();
        showPause();
    }
}

function loseFocus() {
    var el = document.querySelector(':focus');
    if(el) el.blur();
}