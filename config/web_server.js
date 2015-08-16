// Dependencies external
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
// Dependencies internal
var serverCache = appRequire('lib/server_cache');

// Load Express
var app = express();
app.enable('trust proxy');

// Middleware
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});
app.use(session({
    secret: 'mostui',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 60000,
        expires: false
    }
}));
app.use(cookieParser());

// Render Engine
app.set('view engine', 'jade');

app.get('/', function (req, res) {
    var session = req.session;
    var cookies = req.cookies

    if (session != null && cookies) {
        var serverList = cookies.mostuiServerList;
        console.log("User requests to display mostui for: " + JSON.stringify(serverList));
        if (!serverList) {
            serverList = ["10.12.45.18"]
        }
        res.cookie('mostuiServerList', serverList);
    } else {
        res.send("Welcome to MostUI without session and cookies.");
    }

    res.render('index');
});

app.post('/removeServer', function (req, res) {

});

app.post('/addServer', urlencodedParser, function (req, res) {
    // In case there is no body, return
    if (!req.body) return res.sendStatus(400);

    // Add the new server to the cache
    serverCache.addServer(req.ip, req.body.url);

    // Go back to root
    res.redirect('/', 302);
});

app.listen(8080);

module.exports = app;