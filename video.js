var session = null;
var timer = null;
var currentMedia = null;
var currentMediaURL = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/ED_1280.mp4';
var photo =  
    {
        //'url': 'http://www.videws.com/eureka/castv2/images/San_Francisco_Fog.jpg',
        'url': 'http://www.bing.com/az/hprichbg/rb/GreenIguana_EN-US10129447385_1366x768.jpg',
        'title':'San Francisco Fog',
        'thumb':'images/San_Francisco_Fog.jpg'        
    };

if (!chrome.cast || !chrome.cast.isAvailable) {
    setTimeout(initializeCastApi, 1000);
}

function initializeCastApi() {
    var applicationId = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
    var sessionRequest = new chrome.cast.SessionRequest(applicationId);

    console.log("Get session for " + applicationId);

    var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
      sessionListener,
      receiverListener);

    console.log("Get apiConfig " + apiConfig);

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
        console.log("Receiver found");
        
    } else {
        console.log("No Receiver found");
    }
};

var launchApp = function () {
    console.log("Launching app...");

    chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
    if (timer) {
        clearInterval(timer);
    }
};

var onRequestSessionSuccess = function (e) {
    console.log("Session success: " + e.sessionId);

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

var updateCurrentTime = function () {
    console.log("updateCurrentTime");
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
    console.log("New media session ID:" + media.mediaSessionId);

    currentMedia = media;
    currentMedia.addUpdateListener(onMediaStatusUpdate);

    document.getElementById("casticon").src = 'images/cast_icon_active.png';
    if (!timer) {
        timer = setInterval(updateCurrentTime.bind(this), 1000);
    }
};

var onMediaStatusUpdate = function (isAlive) {
    console.log("Media status update..");
};

var onLaunchError = function() {
    console.log("Launch error");
};

var stopApp = function () {
    console.log("Stopping App..");
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
        mediaCommandSuccessCallback.bind(this,"Playing started for " + currentMedia.sessionId),
         onError);
        console.log("Play started");
        timer = setInterval(updateCurrentTime.bind(this), 1000);    
    
};

var stopMedia = function() {
    console.log("Stopping media");
    if (!currentMedia)
        return;

    currentMedia.stop(null,
        mediaCommandSuccessCallback.bind(this, "stopped " + currentMedia.sessionId),
        onError);

    console.log("media stopped");

    if (timer) {
        clearInterval(timer);
    }
};

var mediaCommandSuccessCallback = function(info) {
    console.log(info);
};


var onMediaError = function(e) {
    console.log("Media error");
    document.getElementById("casticon").src = 'images/cast_icon_warning.png';
};

var showImage = function() {
    var mediaInfo = new chrome.cast.media.MediaInfo(photo['url']);
    console.log("loading..." + photo['url']);

    mediaInfo.metadata = new chrome.cast.media.PhotoMediaMetadata();
    mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.PHOTO;
    mediaInfo.metadata.artist = 'Bing';
    mediaInfo.metadata.location = 'Bing';
    mediaInfo.metadata.longitude = 37.7833;
    mediaInfo.metadata.latitude = 122.4167;
    mediaInfo.metadata.width = 1728;
    mediaInfo.metadata.height = 1152;
    mediaInfo.metadata.creationDateTime = '1999';
    mediaInfo.contentType = 'image/jpg';    

    mediaInfo.metadata.title = photo['title'];
    mediaInfo.metadata.images = [{ 'url': 'http://www.videws.com/eureka/castv2/' + photo['thumb'] }];

    var request = new chrome.cast.media.LoadRequest(mediaInfo);
    request.autoplay = true;
    request.currentTime = 0;
    session.loadMedia(request, onMediaDiscovered.bind(this, 'loadMedia'), onMediaError.bind(this));
};