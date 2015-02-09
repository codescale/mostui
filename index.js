// var httpServer = require("./httpServer");
// var httpRequestRouter = require('./httpRequestRouter');

// httpServer.start(httpRequestRouter.route);

var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var app = express();
var serverStatus = require('./mongoStat.js').serverStatus;

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

function MongoStatDTO(insert, query, update, deleted) {
  this.insert = insert;
  this.query = query;
  this.update = update;
  this.deleted = deleted;
}
var year = 60000 * 60 * 24 * 365;
var mongoStatLatestRaw = {};

app.use(logger('dev'));

app.use(function(req, res, next){
  res.locals.expose = {};
  // you could alias this as req or res.expose
  // to make it shorter and less annoying
  next();
});

app.get('/', function(req, res){
  res.redirect('/mostui');
});

function getMongoStat (url, callback) {
 	serverStatus(url, function(info) {
 		if(!info) {
	  		callback(new MongoStatDTO(0,0,0,0));
 			return;
 		}

 		// If there are no cached stats
 		if(!mongoStatLatestRaw[url]) {
 			mongoStatLatestRaw[url] = info;
 		}

		// Update DTO
		var mongoStatDTO = new MongoStatDTO(0,0,0,0);
	  	mongoStatDTO.insert = info.opcounters.insert - mongoStatLatestRaw[url].opcounters.insert;
	  	mongoStatDTO.query = info.opcounters.query - mongoStatLatestRaw[url].opcounters.query;
	  	mongoStatDTO.update = info.opcounters.update - mongoStatLatestRaw[url].opcounters.update;
	  	mongoStatDTO.deleted = info.opcounters.deleted - mongoStatLatestRaw[url].opcounters.deleted;

		// Update latest raw data
	  	mongoStatLatestRaw[url] = info;

	  	// Use the callback to return new mongo-stat
	  	callback(mongoStatDTO);
  	});
}

app.get('/mongoStat/:host/:port', function(req, res) {
	var host = req.params.host,
		port = req.params.port;
	if(!host || !port) {
		return;
	}

	var url = "mongodb://"+host+":"+port;
	getMongoStat(url, function(data) {
		var urls = {url:[]};
		if (req.cookies.urls) {
			urls = req.cookies.urls;
		}
		var addNewUrl = true;
		for(var i = 0; i<urls.url.length; i++) {
			if(urls.url[i].host == host && urls.url[i].port == port){
				addNewUrl = false;
				break;
			}
		}
		if(addNewUrl) {
			console.log("Added url: " + url);
			var newUrl = {
				host: host,
				port: port
			}
			urls.url.push(newUrl);
		}
		res.cookie('urls', urls, { maxAge: year });
		res.send(data);
	});
});

app.get('/mostui', function(req, res){
  	res.locals.getMongoStat = getMongoStat;
  	res.render('mostui');
});

if (!module.parent) {
  app.listen(8080);
  console.log('Express started on port 8080');
}