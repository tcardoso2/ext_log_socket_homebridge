#!/usr/bin/env node

var WebSocketServer = require('websocket').server;
var http = require('http');
var cmd=require('node-cmd');
var connection;

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});
 
wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});
 
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}
 
wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

exports.serverSend = (data) => {
    console.log(`Sending data: connection is active? ${connection.connected}`);
    connection.sendUTF(data);
}

exports.sendServerOutput = (command, input, callback) => {
    console.log("Called cmd...!");
    let processRef = cmd.get(command);
    let data_line = "";
    //listen to the python terminal output
    processRef.stdout.on(
        'data',
        function(data) {
        data_line += data;
        if (data_line[data_line.length-1] == '\n') {
          console.log(data_line);
          if (callback) {
            setTimeout(() => {
                console.log("$$$$$$$$$$$$", data_line)
                callback(data_line);
            }, 1);
          }
          if(connection) {
            connection.sendUTF(data_line);
          }
        }
    });
}
