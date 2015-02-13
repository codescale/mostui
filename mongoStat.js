var MongoClient = require('mongodb').MongoClient,
	assert = require('assert');

// AdminDB used to get the server status
var adminDb = {};

// Connect to mongodb
function connect (url) {
	MongoClient.connect(url, function(err, db) {
		if(db) {
			console.log("Connected to MongoDB: " + url);

			adminDb[url] = db.admin();
		}
	});
}

function serverStatus(url, callback) {

	if(!adminDb[url]) {
		connect(url);
	}

	if(adminDb[url]) {
		adminDb[url].serverStatus( function(err, info) {
			callback(info);
		});
	} else {
		callback(null);
	}
}

exports.serverStatus = serverStatus;