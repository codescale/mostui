// var httpServer = require("./httpServer");
// var httpRequestRouter = require('./httpRequestRouter');

// httpServer.start(httpRequestRouter.route);

var express = require('express');
var logger = require('morgan');
var app = express();
var serverStatus = require('./mongoStat.js').serverStatus;

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

function MongoStatDTO(insert, query, update, deleted) {
  this.insert = insert;
  this.query = query;
  this.update = update;
  this.deleted = deleted;
}

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