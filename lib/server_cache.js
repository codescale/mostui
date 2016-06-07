var util = require('util');
var EventEmitter = require('events').EventEmitter;

// Private Variables
var urlPattern = /^(\d{1,3}\.){3}\d{1,3}/;
var clientCache = {};

// Private Functions
var serverList = function serverList(clientId) {
  var _serverList = clientCache[clientId];
  if (!_serverList) {
    _serverList = {};
    clientCache[clientId] = _serverList;
  }
  return _serverList;
}

/**
 * The Server-Cache keeps for every client a list of servers they've registered for.
 **/

// Public ServerCache definition
var ServerCache = function () {};
// Inherit it from EventEmitter
util.inherits(ServerCache, EventEmitter);
var serverCache = new ServerCache();
// Export the serverCache object
module.exports = serverCache;

// -----------------
// Public functions
// -----------------
/*
 * addServer
 */
serverCache.addServer = function (clientId, url) {

  if (!serverList(clientId)[url] && urlPattern.test(url)) {

    console.log('Add server <%s> for client <%s>', url, clientId);

    serverList(clientId)[url] = true;

    serverCache.emit('added', url);
  }

  return serverList(clientId);
};
/*
 * removeServer
 */
serverCache.removeServer = function (clientId, url) {

  if (serverList(clientId)[url]) {
    console.log('Remove server <%j> for client <%s>', url, clientId);

    delete serverList(clientId)[url];

    // If there is not another client listening to this server
    // -> Disconnect
    var isUrlUsedByClient = false;
    for (clientId in clientCache) {
      if (serverList(clientId)[url]) {
        isUrlUsedByClient = true;
        return;
      }
    };
    if (!isUrlUsedByClient) {
      serverCache.emit('removed', url);
    }
  }

  return serverList(clientId);
};
/*
 * setServerList
 */
serverCache.setServerList = function (clientId, urls) {
  console.log('Set server list to <%j> for client <%s>', urls, clientId);

  for (url in urls) {
    this.addServer(clientId, url);
  }

  return serverList(clientId);
};
/*
 * getServerList
 */
serverCache.getServerList = function (clientId) {
  return serverList(clientId);
};