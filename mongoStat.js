MongoClient = require('mongodb').MongoClient;
ReplSet = require('mongodb').ReplSet;
Logger = require('mongodb').Logger;
ReadPreference = require('mongodb').ReadPreference;
ReplReadPreference = require('mongodb/node_modules/mongodb-core/lib/topologies/read_preference');
assert = require('assert');

// AdminDB used to get the server status
var db = {};

function isConnected(db) {
    if (db.s.topology.s.replset) {
        // If it's a replica-set
        return db.s.topology.s.replset.isConnected({
            readPreference: ReplReadPreference.primary
        })
    } else {
        // otherwise
        return db.s.topology.isConnected();
    }
}

function getReadPreference(db) {
    if (db.s.topology instanceof ReplSet && db.s.topology.lastIsMaster().ismaster) {
        // If it's a replica-set and the db is master
        return ReadPreference.PRIMARY;
    } else {
        // otherwise
        return ReadPreference.SECONDARY;
    }
}

// Connect to mongodb
function connect(url, callback) {

    // Logger.setLevel('debug');

    // If we established a connection to this db
    if (db[url]) {
        // And if the connection is still alive
        if (isConnected(db[url])) {
            // call back
            callback();
        } else {
            // If the connection is down, close the db connection.
            db[url].close();
        }
        return;
    }

    // Try to connect to the given url
    var mongoServer = MongoClient.connect(url, {
        server: {
            reconnectTries: -1
        },
        replSet: {
            connectWithNoPrimary: true
        }
    }, function (err, newDb) {
        if (err) {
            console.log(err);
        }

        // If the connection was successful
        if (newDb) {
            console.log('Connected MongoDB: ' + url);

            // Store this db in the local db-list
            db[url] = newDb;

            // On a close event
            db[url].on('close', function () {
                if (this._callBackStore) {
                    for (var key in this._callBackStore._notReplied) {
                        this._callHandler(key, null, 'Connection Closed!');
                    }
                }
                console.log('Disconnected MongoDB: ' + url);
                db[url] = null;
            });
            db[url].on('error', function () {
                console.log('Error event for DB ' + db[url] + '. The connection will be closed.');
                db[url].close();
            });
            db[url].s.topology.on('error', function (err) {
                console.log(err);
            });
        }
        // And call back
        callback(err);
    });
}

function serverStatus(url, callback) {

    connect(url, function () {

        if (db[url]) {

            db[url].command({
                serverStatus: 1
            }, {
                readPreference: getReadPreference(db[url])
            }, function (err, status) {

                if (err == null && status.ok === 1) {
                    callback(status);
                } else {
                    if (err)
                        console.log(err);
                    return callback(null, err);
                }
            });
        } else {
            callback(null);
        }
    });
}

function currentOps(url, callback) {

    connect(url, function () {
        if (db[url]) {

            db[url].collection('$cmd.sys.inprog').findOne({}, {
                readPreference: getReadPreference(db[url])
            }, function (err, currentOps) {
                if (err == null && currentOps.inprog) {
                    callback(currentOps.inprog);
                } else {
                    if (err)
                        console.log(err);
                    return callback(null, err);
                }
            });
        } else {
            callback(null);
        }
    });
}

exports.serverStatus = serverStatus;
exports.currentOps = currentOps;