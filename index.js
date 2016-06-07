// Provide an app internal (simplefied) require function
require('./lib/app_require');

// Setup the express web-server
appRequire('setup/setup_express');
// Setup the socketIO
appRequire('setup/setup_socketIO');