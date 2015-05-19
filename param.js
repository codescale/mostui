/**
 * New node file
 */
// Program-Arguments
var argv = require('yargs')
    .usage('Displays the mongostat in a Web-UI.')
    .example('$0 -p 8080', 'Runs the mostui on port 8080.')
    .alias('p', 'port')
    .default('p', 8080, '8080')
    .describe('p', 'The port of the Web-Server').argv;

exports.port = argv.port;