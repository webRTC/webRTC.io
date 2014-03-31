var videos = [];
var PeerConnection = window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.RTCPeerConnection;
var ASPECTRATIO = 4/3;
var VIDPADDING = 4;

function getNumPerRow() {
  var len = videos.length;
  var biggest;

  // Ensure length is even for better division.
  if(len % 2 === 1) {
    len++;
  }

  biggest = Math.ceil(Math.sqrt(len));
  while(len % biggest !== 0) {
    biggest++;
  }
  return biggest;
}


function subdivideVideos() {
  var perRow = getNumPerRow();
  var numInRow = 0;
  for(var i = 0, len = videos.length; i < len; i++) {
    var video = videos[i];
    perRow = setWH(video, i, perRow);
    numInRow = (numInRow + 1) % perRow;
  }
}



function setWH(video, i, perRow) {
  var perColumn = Math.ceil(videos.length / perRow);
  var container = document.getElementById("videos");
  
  var width = Math.floor((container.clientWidth) / perRow);
  var height = width / ASPECTRATIO;

  //check if the height of the columns is greater than the screen size
  if(window.innerHeight < (height * perColumn) + (perColumn * VIDPADDING)){
    //add one more video per row
    return setWH(video, i, perRow+1);
  }else{ //height of video pans out
    video.style.width = width - (perRow * VIDPADDING);
    video.style.height = height - (perColumn * VIDPADDING);
  }

  return perRow;
}

function cloneVideo(domId, socketId) {
  var video = document.getElementById(domId);
  var clone = video.cloneNode(false);
  clone.id = "remote" + socketId;
  document.getElementById('videos').appendChild(clone);
  videos.push(clone);
  return clone;
}

function removeVideo(socketId) {
  var video = document.getElementById('remote' + socketId);
  if(video) {
    videos.splice(videos.indexOf(video), 1);
    video.parentNode.removeChild(video);
    subdivideVideos();
  }
}

function addToChat(msg, color) {
  var messages = document.getElementById('messages');
  msg = sanitize(msg);
  msg = '<strong style="'+(color?'color: ' + color + ';':'')+'">'+ (color?'Them: ':'You: ') + msg + '</strong>';
  messages.innerHTML = messages.innerHTML + msg + '<br>';
  messages.scrollTop = 10000;
}

function sanitize(msg) {
  return msg.replace(/</g, '&lt;');
}

function queryObj() {
  var result = {}, keyValuePairs = location.search.slice(1).split('&');

  keyValuePairs.forEach(function(keyValuePair) {
    if(!keyValuePair){ return; } //side effect of using split is blank strings
    keyValuePair = keyValuePair.split('=');
    result[keyValuePair[0]] = decodeURIComponent(keyValuePair[1]) || '';
  });

  return result;
}
function queryStr(queryObj){
  var hrefString = "";
  for(var i in queryObj){
    hrefString += "&"+i+"="+queryObj[i];
  }
  hrefString = hrefString.replace(/^&/,'');
  return hrefString;
}

function initFullScreen() {
  var elem = document.getElementById("videos");
  //show full screen
  elem.webkitRequestFullScreen();
}

function initNewRoom(roomName) {
  if(!roomName){
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = 8;
    var roomName = '';
    for(var i = 0; i < string_length; i++) {
      var rnum = Math.floor(Math.random() * chars.length);
      roomName += chars.substring(rnum, rnum + 1);
    }
  }

  var query = queryObj();
  query.room = roomName;
  var hrefString = "?"+queryStr(query);

  window.location.href = hrefString;
}


var websocketChat = {
  send: function(message) {
    rtc._socket.send(message);
  },
  recv: function(message) {
    return message;
  },
  event: 'receive_chat_msg'
};

var dataChannelChat = {
  send: function(message) {
    for(var connection in rtc.dataChannels) {
      var channel = rtc.dataChannels[connection];
      channel.send(message);
    }
  },
  recv: function(channel, message) {
    return JSON.parse(message).data;
  },
  event: 'data stream data'
};

function initChat() {
  var chat;

  if(rtc.dataChannelSupport) {
    console.log('initializing data channel chat');
    chat = dataChannelChat;
  } else {
    console.log('initializing websocket chat');
    chat = websocketChat;
  }

  var input = document.getElementById("chatinput");
  //var toggleHideShow = document.getElementById("hideShowMessages");
  var room = window.location.hash.slice(1);
  //creates a hex color, /3 to keep it in the darker color range.
  var color = "#" + (((1 << 24)/3) * Math.random() | 0).toString(16);

  /*toggleHideShow.addEventListener('click', function() {
    var element = document.getElementById("messages");

    if(element.style.display === "block") {
      element.style.display = "none";
    }
    else {
      element.style.display = "block";
    }

  });*/

  input.addEventListener('keydown', function(event) {
    var key = event.which || event.keyCode;
    if(key === 13) {
      chat.send(JSON.stringify({
        "eventName": "chat_msg",
        "data": {
          "messages": input.value,
          "room": room,
          "color": color
        }
      }));
      addToChat(input.value);
      input.value = "";
    }
  }, false);
  rtc.on(chat.event, function() {
    var data = chat.recv.apply(this, arguments);
    addToChat(data.messages, data.color.toString(16));
  });
}

function hide(el){
  if(el.className.indexOf('hide') === -1){
    el.className += (el.className !== ""?" ":"")+"hide";  
  }
}
function show(el){
  if(el.className.indexOf('hide') !== -1){
    el.className = el.className.replace('hide', '');
  }
}

function showRoomList(data){
  var el = document.getElementById('roomList');
  var rlEl = document.getElementById('roomListCont');
  rlEl.innerHTML = "";
  var ul = document.createElement("ul");
  var li = null;
  var href = null;
  var linkText = "";
  var currentQueryList = queryObj();
  var j;
  var hrefString = "";
  for(var i=0; i<data.roomList.length; i++){
    hrefString = "";
    if(data.roomList[i] !== ""){
      li = document.createElement("li");
      href = document.createElement("a");
      linkText = document.createTextNode(decodeURIComponent(data.roomList[i]));
      href.appendChild(linkText);

      currentQueryList.room = encodeURIComponent(data.roomList[i]);
      hrefString = queryStr(currentQueryList);

      href.href = "?"+hrefString;
      href.onclick = function(){
        window.location.href = this.href;
      }
      li.appendChild(href);
      ul.appendChild(li);
    }
  }
  if(data.roomList.length > 0){
    rlEl.appendChild(ul);
  }
  show(el);
}
function hideRoomList(){
  var el = document.getElementById('roomList');
  hide(el);
}

function closeDialog(event){
  var el = event.target.parentNode.parentNode; //h1, div
  hide(el);
}


function init() {
  if(PeerConnection) {
    rtc.createStream({
      "video": {"mandatory": {}, "optional": []},
      "audio": true
    }, function(stream) {
      document.getElementById('you').src = URL.createObjectURL(stream);
      document.getElementById('you').muted = true; //prevent echo locally
      document.getElementById('you').play();
    });
  } else {
    alert('Your browser is not supported or you have to turn on flags. In chrome you go to chrome://flags and turn on Enable PeerConnection remember to restart chrome');
  }



  //figure out which room to use
  //var room = window.location.hash.slice(1);
  var room = queryObj();
  if(room.room){
    room = room.room;
  }
  rtc.connect("ws:" + window.location.href.substring(window.location.protocol.length).split('?')[0], room);

  rtc.on('add remote stream', function(stream, socketId) {
    console.log("ADDING REMOTE STREAM...");
    var clone = cloneVideo('you', socketId);
    document.getElementById(clone.id).setAttribute("class", "");
    document.getElementById(clone.id).muted = true;
    rtc.attachStream(stream, clone.id);
    
    subdivideVideos();
  });
  rtc.on('disconnect stream', function(data) {
    removeVideo(data);
  });

  rtc.on('receive room list', function(data) {
    showRoomList(data);
  });
  
  //init additional functionality
  var button = document.getElementById("fullscreen");
  button.addEventListener('click', function(event) {
    initFullScreen();
  });
  
  var createRoomButton = document.getElementById("createRoom");
  createRoomButton.addEventListener('click', function(event) {
    initNewRoom(document.getElementById("roomName").value);
  });

  var joinRoom = document.getElementById("joinRoom");
  joinRoom.addEventListener('click', function(event) {
    rtc.getRoomList();
  });

  var closeButtons = document.getElementsByClassName("closeButton");
  for (var i = 0; i < closeButtons.length; i++) {
    closeButtons[i].addEventListener('click', function(event) {
      closeDialog(event);
    });
  };

  initChat();
}

window.onresize = function(event) {
  subdivideVideos();
};