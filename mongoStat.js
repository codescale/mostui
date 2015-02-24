var MongoClient = require('mongodb').MongoClient, assert = require('assert');

// AdminDB used to get the server status
var openConnection = {};
var adminDb = {};
var dbs = {};

// Connect to mongodb
function connect(url) {

	if (openConnection[url]) {
		return;
	}

	openConnection[url] = "open";
	MongoClient.connect(url, {
		numberOfRetries : -1
	}, function(err, db) {
		if (db) {
			console.log("Connected to MongoDB: " + url);

			dbs[url] = db;
			adminDb[url] = db.admin();
		}
	});
}

function serverStatus(url, callback) {

	connect(url);

	if (adminDb[url]) {
		adminDb[url].serverStatus(function(err, info) {
			callback(info);
		});
	} else {
		callback(null);
	}
}

function currentOps(url, callback) {

	connect(url);

	if (dbs[url]) {
		dbs[url].collection('$cmd.sys.inprog').findOne(function(err, data) {

			if (err) {
				throw err;
			}

			callback(data.inprog);
		});
	} else {
		callback(null);
	}
}

exports.serverStatus = serverStatus;
exports.currentOps = currentOps;