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

function MongoStatDTO() {
  this.insert = 0;
  this.query = 0;
  this.update = 0;
  this.deleted = 0;
  this.getmore = 0;
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
	  		callback(new MongoStatDTO());
 			return;
 		}

 		// If there are no cached stats
 		if(!mongoStatLatestRaw[url]) {
 			mongoStatLatestRaw[url] = info;
 		}

		// Update DTO
		var mongoStatDTO = new MongoStatDTO();
	  	mongoStatDTO.insert = info.opcounters.insert - mongoStatLatestRaw[url].opcounters.insert;
	  	mongoStatDTO.query = info.opcounters.query - mongoStatLatestRaw[url].opcounters.query;
	  	mongoStatDTO.update = info.opcounters.update - mongoStatLatestRaw[url].opcounters.update;
	  	mongoStatDTO.delete = info.opcounters.delete - mongoStatLatestRaw[url].opcounters.delete;
	  	mongoStatDTO.getmore = info.opcounters.getmore - mongoStatLatestRaw[url].opcounters.getmore;

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