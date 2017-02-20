#!/usr/bin/env node

var fs = require('fs'),
    os = require('os');

var program = require('commander'),
    yaml = require('js-yaml'),
    TorrentManager = require('./lib/TorrentManager.js'),
    HTTPServer = require('./lib/HTTPServer.js');

var config = {};

program
  .version('1.0.7')
  .option('-c --config [configfile.yml]', 'Use the specified YAML configuration file')
  .parse(process.argv);

if( program.config ){
  try {
    config = yaml.safeLoad( fs.readFileSync( program.config ) );
  } catch( e ) {
    console.error(e);
    process.exit( -1 );
  }
}

if( !config.httpPort )
  config.httpPort = 9099;

if( !config.torrentsDir )
  config.torrentsDir = os.tmpdir()+'/torrents';

config.publicDir = __dirname+'/public';
config.viewsDir = config.publicDir+'/views';

if( !fs.existsSync( config.torrentsDir ) )
  fs.mkdirSync( config.torrentsDir );

var httpServer = new HTTPServer( config );
