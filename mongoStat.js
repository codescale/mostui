var MongoClient = require('mongodb').MongoClient,
	assert = require('assert');

// AdminDB used to get the server status
var adminDb = {};

// Connect to mongodb
function connect (url) {
	MongoClient.connect(url, function(err, db) {
	assert.equal(null, err);
	console.log("Connected to MongoDB: " + url);

	adminDb[url] = db.admin();

	console.log('Connect MongoDB at ' + url);
	});
}

function serverStatus(url, callback) {

	if(!adminDb[url]) {
		connect(url);
	}
	adminDb[url].serverStatus( function(err, info) {
		callback(info);
	});
}

exports.serverStatus = serverStatus;