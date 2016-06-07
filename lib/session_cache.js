var cache = {};

var getCache = function (sid) {
  if (!cache[sid]) {
    cache[sid] = {};
  }
  return cache[sid];
}

var SessionCache = {

  linkSession: function (sid, session) {
    console.log("Link Session: " + sid + " :to: " + JSON.stringify(session));
    getCache(sid).session = session;
  },
  linkWebSocket: function (sid, socket) {
    console.log("Link Session-ID <" + sid + "> to Web-Socket-ID <" + JSON.stringify(socket.id) + ">");
    getCache(sid).socket = socket;
  },
  getSession: function (sid) {
    return getCache(sid).session;
  },
  getSocket: function (sid) {
    return getCache(sid).socket;
  }
}

module.exports = SessionCache;