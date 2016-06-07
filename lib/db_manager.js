// Dependencies internal
var serverCache = appRequire('lib/server_cache');

// Dependencies external
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Server = require('mongodb-core').Server


// Public Notifier
var Notifier = function () {};
// Inherit it from EventEmitter
util.inherits(Notifier, EventEmitter);
var notifier = new Notifier();
// Export the notifier object
module.exports.notifier = notifier;

// Public Functions
module.exports.isConnected = function (url) {
  return dbCache[url].isConnected;
}

/**
 * Server Cache Events
 */
serverCache.on('added', function (url) {
  addDatabase(url);
});

serverCache.on('removed', function (url) {
  removeDatabase(url);
});

/** 
 * MongoDB
 */
var dbCache = {};

function addDatabase(url) {

  if (dbCache[url]) {
    console.log("We already have the db <%s> in the cache and the connection status is <%s>.", url, dbCache[url].isConnected);
  } else {
    // Add url to the cache
    dbCache[url] = {
      isConnected: false
    };
    connect(url);
  }
}

function removeDatabase(url) {
  if (dbCache[url]) {
    dbCache[url].server.destroy();
    clearInterval(dbCache[url].statPolInterval);
    delete dbCache[url];
  }
}

function connect(url) {

  var server = new Server({
    host: url,
    port: 27017,
    reconnect: true,
    reconnectInterval: 50
  });
  dbCache[url].server = server;

  // EVENT-LISTENER
  // Connected
  server.on('connect', onConnect);
  // MongoDB-Status
  server.on('status', onStatus);
  // Connection-Close
  server.on('close', onClose);
  // Connection-Error
  server.on('error', onError);

  server.connect();
}

function pollStatus(server) {
  var url = server.s.options.host;

  var interval = setInterval(function () {
    server.command('system.$cmd', {
      serverStatus: true
    }, function (err, mongoStatRaw) {
      // TODO: Handle error
      if (err) {
        console.error(err);
        return;
      }

      // Emit the status to the server
      var mongoStat = mongoStatRaw.result;
      server.emit('status', server, mongoStat);
    });
  }, 1000);
  dbCache[url].statPolInterval = interval;
}

function onConnect(server) {
  var url = server.s.options.host;
  dbCache[url].isConnected = true;
  pollStatus(server);
  // Emit the close event
  notifier.emit('open', url);
}

// Function listening on MongoDB Status Info
function onStatus(server, status) {
  var url = server.s.options.host;
  // Emit the status
  notifier.emit('mongostat', url, status);
}

function onClose(msg, server) {
  var _server = server;
  if (!server) {
    // if there is no message the first parameter contains the server object
    _server = msg;
  } else {
    console.log(msg);
  }
  var url = _server.s.options.host;
  dbCache[url].isConnected = false;

  // Emit the close event
  notifier.emit('close', url);

  setTimeout(connect, 60000, url);
}

function onError() {
  console.log('DB Error');
}