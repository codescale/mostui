// Dependencies external
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var cookieParser = require('cookie-parser');
var path = require('path');
var errorHandler = require('errorhandler');
// Dependencies internal
var routes = appRequire('routes');

// Load Express
var app = express();
app.enable('trust proxy');
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/bower_components', express.static(path.join(__dirname, '..', 'bower_components')));
// Render Engine
//app.set('view engine', 'jade');
//app.set('views', './views');

// Middleware
var urlencodedParser = bodyParser.urlencoded({
  extended: false
});

app.use(session({
  secret: 'mostui',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: -1,
    expires: false
  },
  store: new FileStore()
}));
app.use(cookieParser());

/**
 * ROUTES
 */
app.get('/', routes.index);
app.post('/removeServer', urlencodedParser, routes.server.remove);
app.post('/addServer', urlencodedParser, routes.server.add);

// Error logging
if (process.env.NODE_ENV !== "production") {
  app.use(errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
} else {
  app.use(errorHandler());
}

// Start Web-Server
var port = process.env.PORT || 8080;
var http = http.createServer(app);
http.listen(port, function () {
  console.log("Express server listening on port %d in %s mode", port, app.settings.env);
});

module.exports.app = app;
module.exports.http = http;