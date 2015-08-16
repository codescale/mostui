var path = require('path');

module.exports = function () {
    global.appRequire = function (name) {
        return require(path.join(__dirname, '..', name));
    }
}();