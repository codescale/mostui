// Internal-Dependencies
var webApp = appRequire('setup/setup_express');
var dbManager = appRequire('lib/db_manager');
var dbNotifier = dbManager.notifier;
var sessionCache = appRequire('lib/session_cache');
var serverCache = appRequire('lib/server_cache');

// Add the socket.io as listener to the db-manager
var socketIO = require('socket.io')(webApp.http);
var cookie = require('cookie');
var cookieParser = require('cookie-parser');

/**
 * DB-Notifier Events
 */
dbNotifier.on('mongostat', function (url, stats) {
  if (stats) {
    socketIO.to(url).emit('mongostat', url, stats);
  }
});
dbNotifier.on('open', function (url) {
  socketIO.to(url).emit('serverStatus', url, {
    dbOnline: true
  });
});
dbNotifier.on('close', function (url) {
  socketIO.to(url).emit('serverStatus', url, {
    dbOnline: false
  });
});

/**
 * Socket-IO Events
 */
socketIO.on('connection', function (socket) {
  var cookie_string = socket.request.headers.cookie;
  var parsed_cookies = cookie.parse(cookie_string);
  var signed_cookies = cookieParser.signedCookies(parsed_cookies, "mostui");
  var sid = signed_cookies['connect.sid'];
  var serverList = cookieParser.JSONCookie(parsed_cookies.mostuiServerList);
  sessionCache.linkWebSocket(sid, socket);

  console.log('ServerList from Client %j: %j', sid, serverList);

  if (serverList) {
    // Set serverList
    serverCache.setServerList(sid, serverList);
  }

  console.log('Report status to <%s> for these servers: %j', sid, serverCache.getServerList(sid));

  // Let this client join all rooms for the stored server urls.
  for (url in serverCache.getServerList(sid)) {

    var socket = sessionCache.getSocket(sid);
    if (socket) {
      console.log('Socket <%s> joins <%s>', socket.id, url);
      socket.join(url);
      socket.emit('serverStatus', url, {
        dbOnline: dbManager.isConnected(url)
      });
    }
  }

  socket.on('registerForMongostat', function (url) {
    socket.join(url);
  });
  socket.on('addServer', function (url) {
    console.log('Join Room: ' + url);
    socket.join(url);
  });
  socket.on('disconnect', function () {
    console.log('Socket disconected');
  });
});
socketIO.on('connect', function (msg) {
  console.log("Connection for socket-io: " + msg.id);
});