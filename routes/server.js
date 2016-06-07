// Internal Dependency
var serverCache = appRequire('lib/server_cache');
var sessionCache = appRequire('lib/session_cache');

/**
 * INTERNAL FUNCTIONS
 */
function setServerListToCookie(res, serverList) {
    res.cookie('mostuiServerList', serverList);
}

/**
 * ROUTES
 */
exports.remove = function (req, res) {
    // In case there is no body, return
    if (!req.body) return res.sendStatus(400);

    var serverList = serverCache.removeServer(req.sessionID, req.body.url);
    setServerListToCookie(res, serverList);

    // Go back to root
    res.redirect('/', 302);
}

exports.add = function (req, res) {
    // In case there is no body, return
    if (!req.body) return res.sendStatus(400);

    // Add the new server to the cache
    var serverList = serverCache.addServer(req.sessionID, req.body.url);
    setServerListToCookie(res, serverList);

    // Let the client join the related socket-room
    var socket = sessionCache.getSocket(req.sessionID);
    if (socket) {
        console.log("Socket " + socket.id + " join " + req.body.url);
        socket.join(req.body.url);
    }

    // Go back to root
    res.redirect('/', 302);
}