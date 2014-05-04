var session = null;
var timer = null;
var currentMedia = null;
var currentMediaURL = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/ED_1280.mp4';


if (!chrome.cast || !chrome.cast.isAvailable) {
    setTimeout(initializeCastApi, 1000);
}

function initializeCastApi() {
    var applicationId = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
    var sessionRequest = new chrome.cast.SessionRequest(applicationId);

    console.log("get session for " + applicationId);

    var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
      sessionListener,
      receiverListener);

    console.log("get apiConfig " + apiConfig);

    chrome.cast.initialize(apiConfig, onInitSuccess, onError);
};

var onInitSuccess = function() {
    console.log("Init Success...");
};

var onError = function(){
    console.log("Error!");
};

var sessionListener = function(e) {
    console.log('New session ID: ' + e.sessionId);

    session = e;
    if (session.media.length != 0) {
        console.log('Found ' + session.media.length + ' existing media sessions.');
        onMediaDiscovered('sessionListener', session.media[0]);
    }

    session.addMediaListener(onMediaDiscovered.bind(this, 'addMediaListener'));
    session.addUpdateListener(sessionUpdateListener.bind(this));
};

var receiverListener = function(receivers) {
    if (receivers === 'available') {
        console.log("receiver found");
        document.getElementById("info").innerText = "TEST";
    } else {
        console.log("receiver list empty");
    }
};

var launchApp = function () {
    console.log("launching app...");

    chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
    if (timer) {
        clearInterval(timer);
    }
};

var onRequestSessionSuccess = function (e) {
    console.log("session success: " + e.sessionId);

    session = e;
    document.getElementById("casticon").src = 'images/cast_icon_active.png';

    session.addUpdateListener(sessionUpdateListener.bind(this));
    if (session.media.length != 0) {
        console.log('Found ' + session.media.length + ' existing media sessions.');
        onMediaDiscovered('onRequestSession', session.media[0]);
    }
    
    session.addMediaListener(onMediaDiscovered.bind(this, 'addMediaListener'));

    session.addUpdateListener(sessionUpdateListener.bind(this));
};

var sessionUpdateListener = function(isAlive) {
    var message = isAlive ? 'Session Updated' : 'Session Removed';
    message += ': ' + session.sessionId;

    console.log(message);

    if (!isAlive) {
        session = null;
        document.getElementById("casticon").src = 'images/cast_icon_idle.png'; 

        if (timer) {
            clearInterval(timer);
        }
        else {
            timer = setInterval(updateCurrentTime.bind(this), 1000);
        }
    }
};

var updateCurrentTime = function() {
    if (!session || !currentMedia) {
        return;
    }

    if (currentMedia.media && currentMedia.media.duration != null) {
        var cTime = currentMedia.getEstimatedTime();
        console.log(cTime);
    }
    else {
        if( timer ) {
            clearInterval(timer);
        }
    }
};


var onMediaDiscovered = function(how, media) {
    console.log("new media session ID:" + media.mediaSessionId);

    currentMedia = media;
    currentMedia.addUpdateListener(onMediaStatusUpdate);

    document.getElementById("casticon").src = 'images/cast_icon_active.png';
    if (!timer) {
        timer = setInterval(updateCurrentTime.bind(this), 1000);
    }
};

var onMediaStatusUpdate = function (isAlive) {
    console.log("media status update..");
};

var onLaunchError = function() {
    console.log("launch error");
};

var stopApp = function() {
    session.stop(onStopAppSuccess, onError);
    if (timer) {
        clearInterval(timer);
    }
};

var onStopAppSuccess = function () {
    console.log('Session stopped');

    document.getElementById("casticon").src = 'images/cast_icon_idle.png';
};

var playMedia = function () {
    var mediaInfo = new chrome.cast.media.MediaInfo(currentMediaURL);
    mediaInfo.contentType = 'video/mp4';
    var request = new chrome.cast.media.LoadRequest(mediaInfo);
    request.autoplay = true;
    request.currentTime = 0;

    session.loadMedia(request,
        onMediaDiscovered.bind(this, 'loadMedia'),
        onMediaError);

    if( !currentMedia ) 
        return;

    if( timer ) {
        clearInterval(timer);
    }

    currentMedia.play(null, 
        mediaCommandSuccessCallback.bind(this,"playing started for " + currentMedia.sessionId),
         onError);
        console.log("play started");
        timer = setInterval(updateCurrentTime.bind(this), 1000);    
    
};


var onMediaError = function(e) {
    console.log("media error");
    document.getElementById("casticon").src = 'images/cast_icon_warning.png';
};