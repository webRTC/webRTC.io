# webRTC.io
### [demo](http://webrtc.dennis.is/)
An abstraction layer for webRTC. Aim is to simplify the HTML5 web standard webRTC in a similar manner to socket.io w/ websockets. This project is still in an infintile stage, please send feature requests (or pulls!) to us as well as bug reports.

## What is webRTC?
webRTC is a new webstandard being developed for peer-to-peer communication on the web. This means that browsers will be able to send information, without sending information through the server. Server side this will reduce load dramatically. 

Currently the webRTC standard is very focused on the video & audio aspects of the project. In the future (hopefully near future!) they will begin implementing the data channel, which will allow arbitrary data to be sent peer-to-peer. For now the webRTC team is focused on stabalizing and optimizing the video and audio channels.

Unfortunately, a server (or two) will still be required for two reasons, The media for the page must be initially supplied, and the server, in conjunction with a [STUN server](http://en.wikipedia.org/wiki/STUN) (abstracted away by the webRTC.io library), is required to synchronize the connections.

## Browser Support
webRTC is supported in very few browsers. We recommend either chrome from either the dev channel or the canary release.
After installation, go to [About://flags](chrome://flags/). Enable
```
Enable Media Source API on <video> elements. (this may be unnecessary)
Enable MediaStream (this may be unnecessary)
Enable PeerConnection
```

## Demo
This is a multi-person chat room demo written using our webRTC.io library. [Example Site](http://webrtc.dennis.is/) & [Repository](http://www.github.com/webRTC/webrtc.io-demo/) (browser support section still applies!)

## Installation
```bash
 npm install webrtc.io
```
for absurdly detailed instruction on setting up the demo, go to the demo repo.

To run the server in debug mode, append '-debug' to the node command

## Example code

### Client


```html
<script src="/webrtc.io.js"></script>
<script>
  rtc.createStream({"video": true, "audio":true}, function(stream){
    // get local stream for manipulation
  }
  rtc.connect('ws://yourserveraddress:8001', optionalRoom);
//then a bunch of callbacks are available
</script>
```

### Server

```javascript
var webRTC = require('webrtc.io').listen(8001);
//then a bunch of callbacks are available
```

## Stumped?
```
#webrtc.io on freenode
```

### License
Copyright (C) 2012 [Ben Brittain](https://github.com/cavedweller), [Dennis Mårtensson](https://github.com/dennismartensson), [David Peter](https://github.com/sarenji)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
