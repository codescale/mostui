// var httpServer = require("./httpServer");
// var httpRequestRouter = require('./httpRequestRouter');

// httpServer.start(httpRequestRouter.route);

var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var app = express();
var serverStatus = require('./mongoStat.js').serverStatus;
var currentOps = require('./mongoStat.js').currentOps;

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

function MongoStatDTO() {
    this.insert = 0;
    this.query = 0;
    this.update = 0;
    this.deleted = 0;
    this.getmore = 0;
    this.pageFaults = 0;
}
var year = 60000 * 60 * 24 * 365;
var mongoStatLatestRaw = {};

// app.use(logger('dev'));

app.use(function(req, res, next) {
    res.locals.expose = {};
    // you could alias this as req or res.expose
    // to make it shorter and less annoying
    next();
});

app.get('/', function(req, res) {
    res.redirect('/mostui');
});

function getMongoStat(requestId, url, callback) {
    serverStatus(url, function(mongoStat) {

	if (!mongoStat) {
	    callback(new MongoStatDTO());
	    return;
	}

	// If there are no cached stats
	// console.log(requestId);
	if (!mongoStatLatestRaw[requestId]) {
	    mongoStatLatestRaw[requestId] = mongoStat;
	}

	// Update DTO
	var mongoStatDTO = new MongoStatDTO();

	// opcounters
	opcounters = mongoStat.opcounters;
	prevOpcounters = mongoStatLatestRaw[requestId].opcounters;
	insert = opcounters.insert - prevOpcounters.insert;
	query = opcounters.query - prevOpcounters.query;
	update = opcounters.update - prevOpcounters.update;
	// delete_ = opcounters.delete - prevOpcounters.delete;
	getmore = opcounters.getmore - prevOpcounters.getmore;

	// opcountersRepl
	opcountersR = mongoStat.opcountersRepl;
	prevOpcountersR = mongoStatLatestRaw[requestId].opcountersRepl;
	insertR = opcountersR.insert - prevOpcountersR.insert;
	queryR = opcountersR.query - prevOpcountersR.query;
	updateR = opcountersR.update - prevOpcountersR.update;
	// deleteR = opcountersR.delete - prevOpcountersR.delete;
	getmoreR = opcountersR.getmore - prevOpcountersR.getmore;

	mongoStatDTO.insert = insert > 0 ? insert : insertR;
	mongoStatDTO.query = query > 0 ? query : queryR;
	mongoStatDTO.update = update > 0 ? update : updateR;
	// mongoStatDTO.delete = delete_ > 0 ? delete_ : deleteR;
	mongoStatDTO.getmore = getmore > 0 ? getmore : getmoreR;

	// page faults
	mongoStatDTO.pageFaults = mongoStat.extra_info.page_faults
		- mongoStatLatestRaw[requestId].extra_info.page_faults;

	// Update latest raw data
	mongoStatLatestRaw[requestId] = mongoStat;

	// Use the callback to return new mongo-stat
	callback(mongoStatDTO);
    });
}

function getCurrentOps(requestId, url, callback) {
    currentOps(url, function(data) {
	callback(data);
    });
}

app.get('/currentOps/:host/:port', function(req, res) {

    var host = req.params.host, port = req.params.port;
    if (!host || !port) {
	return;
    }

    var url = "mongodb://" + host + ":" + port;
    var requestId = req.headers.host + "::" + url;

    getCurrentOps(requestId, url, function(currentOps) {
	res.send(currentOps);
    });
});

app.get('/mongoStat/:host/:port', function(req, res) {

    // Get host and port from the given parameters
    var host = req.params.host, port = req.params.port;
    if (!host || !port) {
	return;
    }

    // Extract all existing urls from the cookie
    var cookie = {
	url : []
    };
    if (req.cookies.urls) {
	cookie = req.cookies.urls;
    }

    // Does the cookie already contains the given host/port?
    var addNewUrl = true;
    for (var i = 0; i < cookie.url.length; i++) {
	if (cookie.url[i].host == host && cookie.url[i].port == port) {
	    addNewUrl = false;
	    break;
	}
    }

    // Build the mongodb url and requestId from the given host and port
    var url = "mongodb://" + host + ":" + port;
    var requestId = req.headers.host + "::" + url;

    if (addNewUrl) {
	// Add the new urls to the cookie
	console.log("Added url: " + url + " for user: " + requestId);
	var newUrl = {
	    host : host,
	    port : port
	}
	cookie.url.push(newUrl);
    }

    // Set the cookie
    res.cookie('urls', cookie, {
	maxAge : year
    });

    // Request the statistics and send them back in the response
    getMongoStat(requestId, url, function(data) {
	res.send(data);
    });
});

app.get('/remove/:host/:port', function(req, res) {

    // Get host and port from the given parameters
    var host = req.params.host, port = req.params.port;
    if (!host || !port) {
	return;
    }

    // Extract all existing urls from the cookie
    var cookie = {
	url : []
    };
    if (req.cookies.urls) {
	cookie = req.cookies.urls;
    }

    cookie.url = cookie.url.filter(function(url) {
	if (url.host == host && url.port == port) {
	    return false;
	}
	return true;
    });

    // Set the cookie
    res.cookie('urls', cookie, {
	maxAge : year
    });

    console.log(cookie);

    res.send({
	ok : 1
    });
});

app.get('/mostui', function(req, res) {
    res.locals.getMongoStat = getMongoStat;
    res.render('mostui');
});

if (!module.parent) {
    app.listen(8080);
    console.log('Express started on port 8080');
}