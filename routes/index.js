// Internal Dependency
var serverCache = appRequire('lib/server_cache');
var sessionCache = appRequire('lib/session_cache');

// Main entry point (Home Page)
module.exports.index = function (req, res) {

  var session = req.session;
  var cookies = req.cookies;

  var sid = req.sessionID;

  // Link the session object
  sessionCache.linkSession(sid, req.session);

  if (cookies && cookies.mostuiServerList) {
    // Set serverList
    serverCache.setServerList(sid, cookies.mostuiServerList);
  }

  console.log("Render %j", serverCache.getServerList(sid));
}

// Additional Routes
module.exports.server = appRequire('routes/server');