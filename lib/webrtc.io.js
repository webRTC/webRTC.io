//SERVER
var WebSocketServer = require('ws').Server

var iolog = function() {};

for (var i = 0; i < process.argv.length; i++) {
  var arg = process.argv[i];
  if (arg === "-debug") {
    iolog = function(msg) {
      console.log(msg)
    }
    console.log('Debug mode on!');
  }
}


// Used for callback publish and subscribe
if (typeof rtc === "undefined") {
  var rtc = {};
}

//Array to store connections
rtc.sockets = [];

//Array to store rooms
rtc.rooms = {};

// Holds callbacks for certain events.
rtc._events = {};

// Register the event callbacks
rtc.on = function(eventName, callback) {
  rtc._events[eventName] = rtc._events[eventName] || [];
  rtc._events[eventName].push(callback);
};

// Fire the events
rtc.fire = function(eventName, _) {
  var events = rtc._events[eventName];
  if(!events)
    return;

  var args = Array.prototype.slice.call(arguments, 1);

  for (var i = 0, len = events.length; i < len; i++) {
    events[i].apply(null, args);
  }
};

// Attach the WebSockets server to a port or an existing server
module.exports.listen = function(server) {
  var manager;
  if (typeof server === 'number') { 
    manager = new WebSocketServer({
        port: server
      });
  } else {
    manager = new WebSocketServer({
      server: server
    });
  }

  manager.rtc = rtc;
  attachEvents(manager);
  return manager;
};

// Attach different events to the WebSockets manager on connection
function attachEvents(manager) {

  // Connection established, attach the events
  manager.on('connection', function(socket) {
    iolog('connect');

    socket.id = id();
    iolog('new socket got id: ' + socket.id);

    socket.emit = function(eventName, data)
    {
      socket.send(JSON.stringify(
      {
        "eventName": eventName,
        "data": data
      }),
      function(error)
      {
        if(error)
          console.log(error);
      });
    }

    rtc.sockets.push(socket);

    // Message received
    socket.on('message', function(msg) {
      var json = JSON.parse(msg);
      rtc.fire(json.eventName, json.data, socket);
    });

    // Peer connection closed, notify to other peers so they can close their
    // connections to it
    socket.on('close', function() {
      iolog('close');

      // find socket to remove
      var i = rtc.sockets.indexOf(socket);
      // remove socket
      rtc.sockets.splice(i, 1);

      // remove from rooms and send remove_peer_connected to all sockets in room
      for (var key in rtc.rooms) {

        var room = rtc.rooms[key];
        var exist = room.indexOf(socket.id);

        if (exist !== -1) {
          room.splice(room.indexOf(socket.id), 1);
          for (var j = 0; j < room.length; j++) {
            console.log(room[j]);

            var soc = rtc.getSocket(room[j]);
            soc.emit("remove_peer_connected", {"socketId": socket.id})
          }
          break;
        }
      }

      // call the disconnect callback
      rtc.fire('disconnect', rtc);
    });

    // call the connect callback
    rtc.fire('connect', rtc);
  });

  // manages the built-in room functionality
  rtc.on('join_room', function(data, socket) {
    iolog('join_room');

    var connectionsId = [];
    var roomList = rtc.rooms[data.room] || [];

    roomList.push(socket.id);
    rtc.rooms[data.room] = roomList;


    for(var i = 0; i < roomList.length; i++)
    {
      var id = roomList[i];
      if(id != socket.id)
      {
        connectionsId.push(id);

        // inform the peers that they have a new peer
        var soc = rtc.getSocket(id);
        if(soc)
          soc.emit("new_peer_connected", {"socketId": socket.id})
      }
    }

    // send new peer a list of all prior peers
    socket.emit("get_peers", {"connections": connectionsId})
  });

  //Receive ICE candidates and send to the correct socket
  rtc.on('send_ice_candidate', function(data, socket) {
    iolog('send_ice_candidate');
    var soc = rtc.getSocket(data.socketId);

    if(soc)
    {
      soc.emit("receive_ice_candidate",
      {
        "label": data.label,
        "candidate": data.candidate,
        "socketId": socket.id
      })

      // call the 'recieve ICE candidate' callback
      rtc.fire('receive ice candidate', rtc);
    }
  });

  //Receive request to create fake DataChannel
  rtc.on('create_DataChannel', function(data, socket)
  {
    iolog('create_DataChannel');

    var soc = rtc.getSocket(data.socketId);
    if(soc)
      soc.emit("datachannel.create",
      {
        "configuration": {"label": data.label},
        "socketId": socket.id
      })

    // call the 'create DataChannel' callback
    rtc.fire('create DataChannel', rtc);
  });

  //Receive request to create fake DataChannel
  rtc.on('datachannel.send', function(data, socket)
  {
    iolog('datachannel.send');

    var soc = rtc.getSocket(data.socketId);
    if(soc)
      soc.emit("datachannel.message",
      {
        "socketId": socket.id,
        "label": data.label,
        "message": data.message
      })

    // call the 'create DataChannel' callback
    rtc.fire('DataChannel send', rtc);
  });

  //Receive request to create fake DataChannel
  rtc.on('datachannel.ready', function(data, socket)
  {
    iolog('datachannel.ready');

    var soc = rtc.getSocket(data.socketId);
    if(soc)
      soc.emit("datachannel.ready",
      {
        "socketId": socket.id,
        "label": data.label
      })

    // call the 'create DataChannel' callback
    rtc.fire('DataChannel ready', rtc);
  });

  //Receive offer and send to correct socket
  rtc.on('send_offer', function(data, socket) {
    iolog('send_offer');

    var soc = rtc.getSocket(data.socketId);
    if(soc)
      soc.emit("receive_offer",
      {
        "sdp": data.sdp,
        "socketId": socket.id
      })

    // call the 'send offer' callback
    rtc.fire('send offer', rtc);
  });

  //Receive answer and send to correct socket
  rtc.on('send_answer', function(data, socket) {
    iolog('send_answer');

    var soc = rtc.getSocket( data.socketId);
    if(soc)
    {
      soc.emit("receive_answer",
      {
        "sdp": data.sdp,
        "socketId": socket.id
      })

      rtc.fire('send answer', rtc);
    }
  });
}

// generate a 4 digit hex code randomly
function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// make a REALLY COMPLICATED AND RANDOM id, kudos to dennis
function id() {
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

// Get the socket with the requested ID
rtc.getSocket = function(id) {
  var connections = rtc.sockets;
  if (!connections) {
    // TODO: Or error, or customize
    return;
  }

  for (var i = 0; i < connections.length; i++) {
    var socket = connections[i];
    if (id === socket.id) {
      return socket;
    }
  }
}